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

        $rows = $query->limit(200)->get();

        $profileIds = $rows->pluck('counselor_profile_id')->map(fn ($id) => (int) $id)->unique()->values()->all();
        $profiles = CounselorProfile::query()->whereIn('id', $profileIds)->get()->keyBy('id');
        $counselorUserIds = $profiles->map(fn ($p) => (int) $p->user_id)->values()->all();

        // Enrich with names resolved through the Express service (identity owner).
        $names = ExpressClient::lookupUsers(array_values(array_unique(array_merge(
            $rows->pluck('student_user_id')->map(fn ($id) => (int) $id)->all(),
            $counselorUserIds
        ))));

        $data = $rows->map(function (Appointment $a) use ($names, $role, $profiles) {
            $profile = $profiles->get($a->counselor_profile_id);
            $counselorUserId = $profile ? (int) $profile->user_id : null;

            $payload = [
                'id' => $a->id,
                'student_user_id' => $a->student_user_id,
                'counselor_profile_id' => $a->counselor_profile_id,
                'counselor_user_id' => $counselorUserId,
                'slot_start' => $a->slot_start?->toIso8601String(),
                'slot_end' => $a->slot_end?->toIso8601String(),
                'status' => $a->status,
                'mode' => $a->mode,
                'concern_category' => $a->concern_category,
                'created_at' => $a->created_at?->toIso8601String(),
                'student_name' => $names[$a->student_user_id]['full_name'] ?? null,
                'counselor_name' => $counselorUserId ? ($names[$counselorUserId]['full_name'] ?? null) : null,
                'student_avatar_url' => $names[$a->student_user_id]['avatar_url'] ?? null,
                'counselor_avatar_url' => $counselorUserId ? ($names[$counselorUserId]['avatar_url'] ?? null) : null,
            ];

            if ($role === 'admin') {
                return $payload;
            }

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
     * GET /api/appointments/counselors — directory for students (all for admins).
     */
    public function counselors(Request $request): JsonResponse
    {
        $role = (string) $request->attributes->get('auth_role');
        $query = CounselorProfile::query();
        if ($role !== 'admin') {
            $query->where('accepting_students', true);
        }
        $profiles = $query->get();

        $users = ExpressClient::lookupUsers($profiles->pluck('user_id')->map(fn ($id) => (int) $id)->all());

        $data = $profiles->map(function (CounselorProfile $p) use ($users) {
            return [
                'id' => $p->id,
                'user_id' => $p->user_id,
                'name' => $users[$p->user_id]['full_name'] ?? 'Counselor',
                'avatar_url' => $users[$p->user_id]['avatar_url'] ?? null,
                'specialization' => $p->specialization,
                'credentials' => $p->credentials,
                'bio' => $p->bio,
                'max_weekly_appointments' => $p->max_weekly_appointments,
                'accepting_students' => $p->accepting_students,
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

    /**
     * PATCH /api/appointments/{id} — admin correction of assigned identities.
     */
    public function adminUpdate(Request $request, int $id): JsonResponse
    {
        $role = (string) $request->attributes->get('auth_role');
        if ($role !== 'admin') {
            throw new AuthorizationException('Only administrators can update appointment identities.');
        }

        $validated = $request->validate([
            'student_user_id' => ['sometimes', 'integer', 'min:1'],
            'counselor_profile_id' => ['sometimes', 'integer', 'exists:counselor_profiles,id'],
        ]);

        $appointment = Appointment::query()->findOrFail($id);

        $updates = [];
        if (array_key_exists('student_user_id', $validated)) {
            $updates['student_user_id'] = (int) $validated['student_user_id'];
        }
        if (array_key_exists('counselor_profile_id', $validated)) {
            $updates['counselor_profile_id'] = (int) $validated['counselor_profile_id'];
        }

        if (! empty($updates)) {
            $appointment->update($updates);
        }

        $appointment = $appointment->fresh();
        $profile = CounselorProfile::query()->find($appointment->counselor_profile_id);
        $counselorUserId = $profile ? (int) $profile->user_id : null;
        $names = ExpressClient::lookupUsers(array_values(array_filter([
            (int) $appointment->student_user_id,
            $counselorUserId,
        ])));

        return response()->json([
            'status' => 'success',
            'data' => [
                'appointment' => [
                    'id' => $appointment->id,
                    'student_user_id' => $appointment->student_user_id,
                    'counselor_profile_id' => $appointment->counselor_profile_id,
                    'counselor_user_id' => $counselorUserId,
                    'slot_start' => $appointment->slot_start?->toIso8601String(),
                    'slot_end' => $appointment->slot_end?->toIso8601String(),
                    'status' => $appointment->status,
                    'mode' => $appointment->mode,
                    'created_at' => $appointment->created_at?->toIso8601String(),
                    'student_name' => $names[$appointment->student_user_id]['full_name'] ?? null,
                    'counselor_name' => $counselorUserId ? ($names[$counselorUserId]['full_name'] ?? null) : null,
                ],
            ],
        ]);
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
