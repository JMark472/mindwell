<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CounselingRecord;
use App\Models\CounselorProfile;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Confidential counseling records.
 *
 * Access rules (enforced here and by CounselingRecordPolicy):
 *  - a counselor may read/write records only for students assigned to them
 *    through one of their own appointments;
 *  - students can never read records about themselves;
 *  - administrators are denied regardless of request parameters.
 */
class CounselingRecordController extends Controller
{
    /**
     * GET /api/counseling-records?student={id}
     */
    public function index(Request $request): JsonResponse
    {
        $counselor = $this->currentCounselor($request);

        $query = CounselingRecord::query()
            ->where('counselor_user_id', $counselor->user_id)
            ->orderByDesc('session_date');

        if ($request->filled('student')) {
            $studentId = (int) $request->query('student');
            $this->assertAssigned($counselor, $studentId);
            $query->where('student_user_id', $studentId);
        }

        return response()->json([
            'status' => 'success',
            'data' => ['records' => $query->limit(100)->get()],
        ]);
    }

    /**
     * GET /api/counseling-records/caseload — assigned student list.
     */
    public function caseload(Request $request): JsonResponse
    {
        $counselor = $this->currentCounselor($request);

        $byStudent = Appointment::query()
            ->where('counselor_profile_id', $counselor->id)
            ->whereIn('status', [Appointment::STATUS_CONFIRMED, Appointment::STATUS_COMPLETED])
            ->get()
            ->groupBy('student_user_id');

        $names = \App\Support\ExpressClient::lookupUsers(
            $byStudent->keys()->map(fn ($id) => (int) $id)->all()
        );

        $caseload = [];
        foreach ($byStudent as $studentId => $appointments) {
            $latest = $appointments->sortByDesc('slot_start')->first();
            $caseload[] = [
                'student_user_id' => (int) $studentId,
                'name' => $names[(int) $studentId]['full_name'] ?? 'Student',
                'total_sessions' => $appointments->count(),
                'last_session' => $latest?->slot_start?->toIso8601String(),
                'next_session' => $appointments
                    ->where('status', Appointment::STATUS_CONFIRMED)
                    ->where('slot_start', '>', now())
                    ->sortBy('slot_start')
                    ->first()?->slot_start?->toIso8601String(),
            ];
        }

        return response()->json(['status' => 'success', 'data' => ['caseload' => $caseload]]);
    }

    /**
     * POST /api/counseling-records
     */
    public function store(Request $request): JsonResponse
    {
        $counselor = $this->currentCounselor($request);

        $validated = $request->validate([
            'student_user_id' => ['required', 'integer'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'session_date' => ['required', 'date'],
            'summary' => ['required', 'string', 'max:10000'],
            'follow_up_plan' => ['nullable', 'string', 'max:5000'],
            'recommendations' => ['nullable', 'string', 'max:5000'],
            'referral_service' => ['nullable', 'string', 'max:190'],
            'risk_level' => ['nullable', Rule::in([
                CounselingRecord::RISK_NONE,
                CounselingRecord::RISK_LOW,
                CounselingRecord::RISK_MODERATE,
                CounselingRecord::RISK_HIGH,
            ])],
        ]);

        $this->assertAssigned($counselor, (int) $validated['student_user_id']);

        $record = CounselingRecord::create([
            ...$validated,
            'counselor_user_id' => $counselor->user_id,
            'risk_level' => $validated['risk_level'] ?? CounselingRecord::RISK_NONE,
        ]);

        return response()->json(['status' => 'success', 'data' => ['record' => $record]], 201);
    }

    /**
     * PATCH /api/counseling-records/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $counselor = $this->currentCounselor($request);
        $record = CounselingRecord::query()->findOrFail($id);

        if ($record->counselor_user_id !== $counselor->user_id) {
            throw new AuthorizationException('You do not have access to this record.');
        }

        $validated = $request->validate([
            'summary' => ['sometimes', 'string', 'max:10000'],
            'follow_up_plan' => ['nullable', 'string', 'max:5000'],
            'recommendations' => ['nullable', 'string', 'max:5000'],
            'referral_service' => ['nullable', 'string', 'max:190'],
            'risk_level' => ['sometimes', Rule::in([
                CounselingRecord::RISK_NONE,
                CounselingRecord::RISK_LOW,
                CounselingRecord::RISK_MODERATE,
                CounselingRecord::RISK_HIGH,
            ])],
        ]);

        $record->update($validated);

        return response()->json(['status' => 'success', 'data' => ['record' => $record->fresh()]]);
    }

    private function currentCounselor(Request $request): CounselorProfile
    {
        $role = (string) $request->attributes->get('auth_role');
        if ($role !== 'counselor') {
            throw new AuthorizationException('Only counselors may access counseling records.');
        }

        $userId = (int) $request->attributes->get('auth_user_id');
        $profile = CounselorProfile::query()->where('user_id', $userId)->first();

        if (! $profile) {
            throw new AuthorizationException('Counselor profile not found.');
        }

        return $profile;
    }

    private function assertAssigned(CounselorProfile $counselor, int $studentId): void
    {
        $assigned = Appointment::query()
            ->where('counselor_profile_id', $counselor->id)
            ->where('student_user_id', $studentId)
            ->whereIn('status', [Appointment::STATUS_CONFIRMED, Appointment::STATUS_COMPLETED])
            ->exists();

        if (! $assigned) {
            throw new AuthorizationException('This student is not assigned to you.');
        }
    }
}
