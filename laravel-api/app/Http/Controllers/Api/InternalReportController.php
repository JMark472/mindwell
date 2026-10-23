<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\WellnessCheckin;
use App\Models\WellnessResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Internal reporting endpoints. Reachable only with the shared service key
 * (an administrator's browser never calls these directly).
 *
 * All output is aggregated — no student identifiers, notes or wellness
 * responses are included.
 */
class InternalReportController extends Controller
{
    /**
     * GET /api/internal/reports/appointment-summary
     */
    public function appointmentSummary(): JsonResponse
    {
        $byStatus = Appointment::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $total = (int) $byStatus->sum();

        $completed = (int) ($byStatus[Appointment::STATUS_COMPLETED] ?? 0);
        $cancelled = (int) ($byStatus[Appointment::STATUS_CANCELLED] ?? 0) + (int) ($byStatus[Appointment::STATUS_DECLINED] ?? 0);

        $monthly = Appointment::query()
            ->selectRaw("DATE_FORMAT(slot_start, '%Y-%m') as month, COUNT(*) as total")
            ->where('slot_start', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $workload = Appointment::query()
            ->select('counselor_profile_id', DB::raw('COUNT(*) as total'))
            ->whereIn('status', [Appointment::STATUS_CONFIRMED, Appointment::STATUS_COMPLETED])
            ->groupBy('counselor_profile_id')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'counselor_profile_id' => (int) $row->counselor_profile_id,
                'total' => (int) $row->total,
                'name' => \App\Models\CounselorProfile::query()
                    ->find($row->counselor_profile_id)?->displayName(),
            ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'total' => $total,
                'by_status' => [
                    'pending' => (int) ($byStatus[Appointment::STATUS_PENDING] ?? 0),
                    'confirmed' => (int) ($byStatus[Appointment::STATUS_CONFIRMED] ?? 0),
                    'completed' => $completed,
                    'cancelled' => $cancelled,
                ],
                'completion_rate' => $total > 0 ? round($completed / $total * 100, 1) : 0.0,
                'cancellation_rate' => $total > 0 ? round($cancelled / $total * 100, 1) : 0.0,
                'monthly' => $monthly->map(fn ($r) => ['month' => $r->month, 'total' => (int) $r->total]),
                'counselor_workload' => $workload,
            ],
        ]);
    }

    /**
     * GET /api/internal/reports/platform-summary
     */
    public function platformSummary(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'published_resources' => WellnessResource::query()->published()->count(),
                'total_resources' => WellnessResource::query()->count(),
                'checkins_total' => WellnessCheckin::query()->count(),
                'checkins_shared' => WellnessCheckin::query()->where('is_shared_with_counselor', true)->count(),
            ],
        ]);
    }
}
