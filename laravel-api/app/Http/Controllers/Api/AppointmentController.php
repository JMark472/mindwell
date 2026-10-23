<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CounselorProfile;
use App\Services\AppointmentService;
use App\Support\ExpressClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function __construct(private readonly AppointmentService $appointments) {}

    /**
     * GET /api/appointments — role-scoped appointment list.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $role = (string) $request->attributes->get('auth_role');

        $query = Appointment::query()->with('counselor')->orderByDesc('slot_start');

        if ($role === 'student') {
            $query->where('student_user_id', $userId);
        } elseif ($role === 'counselor') {
            $profile = CounselorProfile::query()->where('user_id', $userId)->first();
            if (! $profile) {
                return response()->json(['status' => 'success', 'data' => ['appointments' => []]]);
            }
            $query->where('counselor_profile_id', $profile->id);
        } else {
            // Admin: aggregate access only — no student notes are exposed.
            $query->select('id', 'student_user_id', 'counselor_profile_id', 'slot_start', 'slot_end', 'status', 'mode', 'created_at');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $rows = $query->limit(100)->get();

        // Enrich with names resolved through the Express service (identity owner).
        $names = ExpressClient::lookupUsers(array_merge(
            $rows->pluck('student_user_id')->all(),
            $rows->pluck('counselor_profile_id')->map(fn ($id) => (int) $id)->all()
        ));

        $data = $rows->map(function (Appointment $a) use ($names, $role) {
            $payload = [
                'id' => $a->id,
                'student_user_id' => $a->student_user_id,
                'counselor_profile_id' => $a->counselor_profile_id,
                'slot_start' => $a->slot_start?->toIso8601String(),
                'slot_end' => $a->slot_end?->toIso8601String(),
                'status' => $a->status,
                'mode' => $a->mode,
                'concern_category' => $a->concern_category,
                'created_at' => $a->created_at?->toIso8601String(),
            ];

            if ($role === 'admin') {
                return $payload;
            }

            $payload['student_name'] = $names[$a->student_user_id]['full_name'] ?? null;
            $payload['counselor_name'] = $names[$a->counselor_profile_id]['full_name'] ?? null;

            if ($role === 'counselor') {
                $payload['student_note'] = $a->student_note;
                $payload['counselor_note'] = $a->counselor_note;
            }

            if ($role === 'student') {
                $payload['counselor_note'] = $a->counselor_note;
            }

            return $payload;
        });

        return response()->json(['status' => 'success', 'data' => ['appointments' => $data]]);
    }

    /**
     * GET /api/appointments/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::query()->with('counselor')->findOrFail($id);
        $this->authorizeAccess($request, $appointment);

        return response()->json([
            'status' => 'success',
            'data' => ['appointment' => $appointment],
        ]);
    }

    /**
     * GET /api/appointments/counselors — directory for students.
     */
    public function counselors(): JsonResponse
    {
        $profiles = CounselorProfile::query()
            ->where('accepting_students', true)
            ->get();

        $users = ExpressClient::lookupUsers($profiles->pluck('user_id')->map(fn ($id) => (int) $id)->all());

        $data = $profiles->map(function (CounselorProfile $p) use ($users) {
            return [
                'id' => $p->id,
                'user_id' => $p->user_id,
                'name' => $users[$p->user_id]['full_name'] ?? 'Counselor',
                'specialization' => $p->specialization,
                'credentials' => $p->credentials,
                'bio' => $p->bio,
            ];
        });

        return response()->json(['status' => 'success', 'data' => ['counselors' => $data]]);
    }

    /**
     * GET /api/appointments/{counselorProfileId}/slots?date=YYYY-MM-DD
     */
    public function slots(Request $request, int $counselorProfileId): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $slots = $this->appointments->availableSlots($counselorProfileId, $request->query('date'));

        return response()->json(['status' => 'success', 'data' => ['slots' => $slots]]);
    }

    /**
     * POST /api/appointments — student books a slot.
     */
    public function store(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $validated = $request->validate([
            'counselor_profile_id' => ['required', 'integer', 'exists:counselor_profiles,id'],
            'slot_start' => ['required', 'date'],
            'mode' => ['nullable', Rule::in(['online', 'in_person'])],
            'concern_category' => ['nullable', 'string', 'max:60'],
            'student_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $appointment = $this->appointments->book(
            studentUserId: $userId,
            counselorProfileId: (int) $validated['counselor_profile_id'],
            slotStart: $validated['slot_start'],
            mode: $validated['mode'] ?? 'online',
            concernCategory: $validated['concern_category'] ?? null,
            studentNote: $validated['student_note'] ?? null,
        );

        return response()->json([
            'status' => 'success',
            'data' => ['appointment' => $appointment],
        ], 201);
    }

    /**
     * PATCH /api/appointments/{id}/status — counselor workflow.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $validated = $request->validate([
            'status' => ['required', Rule::in([Appointment::STATUS_CONFIRMED, Appointment::STATUS_DECLINED, Appointment::STATUS_COMPLETED])],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $appointment = Appointment::query()->findOrFail($id);
        $this->authorizeCounselorAccess($request, $appointment);

        $updated = $this->appointments->transition(
            $appointment,
            $validated['status'],
            $userId,
            $validated['note'] ?? null
        );

        return response()->json(['status' => 'success', 'data' => ['appointment' => $updated]]);
    }

    /**
     * POST /api/appointments/{id}/cancel
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $appointment = Appointment::query()->findOrFail($id);
        $this->authorizeAccess($request, $appointment, true);

        $updated = $this->appointments->cancel($appointment, $userId, $validated['reason'] ?? '');

        return response()->json(['status' => 'success', 'data' => ['appointment' => $updated]]);
    }

    private function authorizeAccess(Request $request, Appointment $appointment, bool $allowCancel = false): void
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $role = (string) $request->attributes->get('auth_role');

        if ($role === 'admin') {
            return;
        }

        if ($role === 'student') {
            if ($appointment->student_user_id !== $userId) {
                throw new AuthorizationException('You do not have access to this appointment.');
            }

            return;
        }

        if ($role === 'counselor') {
            $this->authorizeCounselorAccess($request, $appointment);

            return;
        }

        throw new AuthorizationException('You do not have access to this appointment.');
    }

    private function authorizeCounselorAccess(Request $request, Appointment $appointment): void
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $profile = CounselorProfile::query()->where('user_id', $userId)->first();

        if (! $profile || $profile->id !== $appointment->counselor_profile_id) {
            throw new AuthorizationException('This student is not assigned to you.');
        }
    }
}
