<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsentRecord;
use App\Models\CounselorProfile;
use App\Models\WellnessCheckin;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Voluntary wellness check-ins.
 *
 * A check-in is private to the student by default. A counselor can only see
 * a check-in when the student has granted `checkin_sharing` consent AND the
 * individual check-in was explicitly shared. Scores are never presented as
 * a diagnosis.
 */
class WellnessCheckinController extends Controller
{
    /**
     * POST /api/wellness-checkins — student creates a check-in.
     */
    public function store(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $validated = $request->validate([
            'mood_score' => ['required', 'integer', 'min:1', 'max:5'],
            'energy_score' => ['nullable', 'integer', 'min:1', 'max:5'],
            'stress_score' => ['nullable', 'integer', 'min:1', 'max:5'],
            'sleep_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'influences' => ['nullable', 'array'],
            'influences.*' => ['string', 'max:40'],
            'note' => ['nullable', 'string', 'max:2000'],
            'share_with_counselor' => ['nullable', 'boolean'],
        ]);

        $share = (bool) ($validated['share_with_counselor'] ?? false);

        if ($share) {
            $consent = ConsentRecord::query()
                ->where('student_user_id', $userId)
                ->where('consent_type', ConsentRecord::TYPE_CHECKIN_SHARING)
                ->where('is_granted', true)
                ->exists();

            if (! $consent) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Grant check-in sharing consent in Privacy settings before sharing with a counselor.',
                ], 422);
            }
        }

        $checkin = WellnessCheckin::create([
            'student_user_id' => $userId,
            'mood_score' => $validated['mood_score'],
            'energy_score' => $validated['energy_score'] ?? null,
            'stress_score' => $validated['stress_score'] ?? null,
            'sleep_hours' => $validated['sleep_hours'] ?? null,
            'influences' => $validated['influences'] ?? [],
            'note' => $validated['note'] ?? null,
            'is_shared_with_counselor' => $share,
        ]);

        // Optional configurable answers.
        if ($request->filled('answers') && is_array($request->input('answers'))) {
            foreach ($request->input('answers') as $answer) {
                if (! is_array($answer) || empty($answer['question_key'])) {
                    continue;
                }
                $checkin->answers()->create([
                    'question_key' => (string) $answer['question_key'],
                    'question_prompt' => (string) ($answer['question_prompt'] ?? ''),
                    'answer_value' => isset($answer['answer_value']) ? (string) $answer['answer_value'] : null,
                    'answer_text' => isset($answer['answer_text']) ? (string) $answer['answer_text'] : null,
                ]);
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => ['checkin' => $checkin->load('answers')],
        ], 201);
    }

    /**
     * GET /api/wellness-checkins — student history, or counselor view of
     * shared check-ins only.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $role = (string) $request->attributes->get('auth_role');

        $query = WellnessCheckin::query()->orderByDesc('created_at');

        if ($role === 'student') {
            $query->where('student_user_id', $userId);
        } elseif ($role === 'counselor') {
            // Only check-ins the student explicitly shared AND consented to.
            $studentIds = WellnessCheckin::query()
                ->where('is_shared_with_counselor', true)
                ->pluck('student_user_id')
                ->unique()
                ->all();

            $consented = ConsentRecord::query()
                ->whereIn('student_user_id', $studentIds)
                ->where('consent_type', ConsentRecord::TYPE_CHECKIN_SHARING)
                ->where('is_granted', true)
                ->pluck('student_user_id')
                ->all();

            $query->where('is_shared_with_counselor', true)
                ->whereIn('student_user_id', $consented);
        } else {
            // Admins get aggregated counts only — never individual responses.
            $counts = WellnessCheckin::query()
                ->selectRaw('COUNT(*) as total, AVG(mood_score) as avg_mood')
                ->first();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'checkins' => [],
                    'aggregate' => [
                        'total' => (int) ($counts->total ?? 0),
                        'avg_mood' => round((float) ($counts->avg_mood ?? 0), 2),
                    ],
                ],
            ]);
        }

        if ($request->filled('student')) {
            $query->where('student_user_id', (int) $request->query('student'));
        }

        $rows = $query->limit(90)->get();

        return response()->json(['status' => 'success', 'data' => ['checkins' => $rows]]);
    }

    /**
     * GET /api/wellness-checkins/trend — last 7 entries for the student chart.
     */
    public function trend(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $role = (string) $request->attributes->get('auth_role');

        if ($role !== 'student') {
            throw new AuthorizationException('Trend data is only available to students.');
        }

        $rows = WellnessCheckin::query()
            ->where('student_user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(7)
            ->get(['id', 'mood_score', 'energy_score', 'stress_score', 'created_at'])
            ->reverse()
            ->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'trend' => $rows->map(fn ($r) => [
                    'id' => $r->id,
                    'mood' => $r->mood_score,
                    'energy' => $r->energy_score,
                    'stress' => $r->stress_score,
                    'date' => $r->created_at?->toIso8601String(),
                ]),
            ],
        ]);
    }

    /**
     * GET /api/wellness-checkins/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $checkin = WellnessCheckin::query()->with('answers')->findOrFail($id);
        $userId = (int) $request->attributes->get('auth_user_id');
        $role = (string) $request->attributes->get('auth_role');

        if ($role === 'student' && $checkin->student_user_id !== $userId) {
            throw new AuthorizationException('You do not have access to this check-in.');
        }

        if ($role === 'counselor') {
            if (! $checkin->is_shared_with_counselor) {
                throw new AuthorizationException('This check-in was not shared with counselors.');
            }
            $consented = ConsentRecord::query()
                ->where('student_user_id', $checkin->student_user_id)
                ->where('consent_type', ConsentRecord::TYPE_CHECKIN_SHARING)
                ->where('is_granted', true)
                ->exists();
            if (! $consented) {
                throw new AuthorizationException('The student has not consented to check-in sharing.');
            }
        }

        return response()->json(['status' => 'success', 'data' => ['checkin' => $checkin]]);
    }
}
