<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsentRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConsentController extends Controller
{
    /**
     * GET /api/consents — the student's own consent state.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $records = ConsentRecord::query()
            ->where('student_user_id', $userId)
            ->orderByDesc('created_at')
            ->get();

        $state = [];
        foreach ([
            ConsentRecord::TYPE_CHECKIN_SHARING,
            ConsentRecord::TYPE_COUNSELOR_ACCESS,
            ConsentRecord::TYPE_RESEARCH,
        ] as $type) {
            $latest = $records->firstWhere('consent_type', $type);
            $state[$type] = [
                'granted' => (bool) ($latest?->is_granted ?? false),
                'updated_at' => $latest?->created_at?->toIso8601String(),
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => ['consents' => $state, 'history' => $records],
        ]);
    }

    /**
     * PUT /api/consents/{type} — grant or revoke a consent.
     */
    public function update(Request $request, string $type): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        if (! in_array($type, [
            ConsentRecord::TYPE_CHECKIN_SHARING,
            ConsentRecord::TYPE_COUNSELOR_ACCESS,
            ConsentRecord::TYPE_RESEARCH,
        ], true)) {
            return response()->json(['status' => 'error', 'message' => 'Unknown consent type.'], 422);
        }

        $validated = $request->validate([
            'granted' => ['required', 'boolean'],
            'scope' => ['nullable', 'array'],
            'policy_version' => ['nullable', 'string', 'max:40'],
        ]);

        $granted = (bool) $validated['granted'];

        $record = ConsentRecord::create([
            'student_user_id' => $userId,
            'consent_type' => $type,
            'is_granted' => $granted,
            'scope' => $validated['scope'] ?? null,
            'policy_version' => $validated['policy_version'] ?? 'v1',
            'granted_at' => $granted ? now() : null,
            'revoked_at' => $granted ? null : now(),
        ]);

        // Revoking sharing must also un-share previously shared check-ins.
        if (! $granted && $type === ConsentRecord::TYPE_CHECKIN_SHARING) {
            \App\Models\WellnessCheckin::query()
                ->where('student_user_id', $userId)
                ->update(['is_shared_with_counselor' => false]);
        }

        return response()->json(['status' => 'success', 'data' => ['consent' => $record]]);
    }
}
