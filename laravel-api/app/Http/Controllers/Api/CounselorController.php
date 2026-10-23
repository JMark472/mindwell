<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselorAvailability;
use App\Models\CounselorProfile;
use App\Support\ExpressClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CounselorController extends Controller
{
    /**
     * GET /api/counselors/profile — the signed-in counselor's own profile.
     */
    public function myProfile(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $profile = CounselorProfile::query()->firstOrCreate(
            ['user_id' => $userId],
            ['accepting_students' => true]
        );

        return response()->json([
            'status' => 'success',
            'data' => [
                'profile' => $profile,
                'availability' => $profile->availability()->orderBy('day_of_week')->get(),
            ],
        ]);
    }

    /**
     * PATCH /api/counselors/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $profile = CounselorProfile::query()->firstOrCreate(['user_id' => $userId]);

        $validated = $request->validate([
            'specialization' => ['sometimes', 'string', 'max:190'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'credentials' => ['nullable', 'string', 'max:190'],
            'max_weekly_appointments' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'accepting_students' => ['sometimes', 'boolean'],
        ]);

        $profile->update($validated);

        return response()->json(['status' => 'success', 'data' => ['profile' => $profile->fresh()]]);
    }

    /**
     * PUT /api/counselors/availability — replaces the weekly template.
     */
    public function updateAvailability(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $profile = CounselorProfile::query()->firstOrCreate(['user_id' => $userId]);

        $validated = $request->validate([
            'availability' => ['required', 'array'],
            'availability.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'availability.*.start_time' => ['required', 'date_format:H:i'],
            'availability.*.end_time' => ['required', 'date_format:H:i', 'after:availability.*.start_time'],
            'availability.*.slot_minutes' => ['nullable', 'integer', 'min:15', 'max:180'],
        ]);

        CounselorAvailability::query()
            ->where('counselor_profile_id', $profile->id)
            ->delete();

        foreach ($validated['availability'] as $window) {
            $profile->availability()->create([
                'day_of_week' => $window['day_of_week'],
                'start_time' => $window['start_time'],
                'end_time' => $window['end_time'],
                'slot_minutes' => $window['slot_minutes'] ?? 50,
                'is_active' => true,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => ['availability' => $profile->availability()->orderBy('day_of_week')->get()],
        ]);
    }

    /**
     * GET /api/counselors — directory (students can browse).
     */
    public function index(): JsonResponse
    {
        $profiles = CounselorProfile::query()->where('accepting_students', true)->get();
        $users = ExpressClient::lookupUsers($profiles->pluck('user_id')->map(fn ($id) => (int) $id)->all());

        return response()->json([
            'status' => 'success',
            'data' => [
                'counselors' => $profiles->map(fn (CounselorProfile $p) => [
                    'id' => $p->id,
                    'name' => $users[$p->user_id]['full_name'] ?? 'Counselor',
                    'specialization' => $p->specialization,
                    'credentials' => $p->credentials,
                    'bio' => $p->bio,
                ]),
            ],
        ]);
    }
}
