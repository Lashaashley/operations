<?php

namespace App\Http\Controllers;

use App\Models\Masterlot;
use App\Models\LotTracking;
use App\Models\Status;
use App\Models\Parts;
use App\Models\UnboxingRecord;
use App\Models\LineFeedingRecord;
use App\Models\LineFeedingConfirmation;
use App\Models\LotActivityTracker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function getDashboardData(Request $request)
    {
        try {
            $userId = Auth::id();

            // ── Stat 1: My active work right now ─────────────────────
            $myActiveCount = LotActivityTracker::where('user_id', $userId)
                ->whereNull('ended_at')
                ->count();

            // ── Stat 2: Lots currently in plant (have active tracking OR in queue) ──
            $totalLots = Masterlot::count();
            $completedLots = Masterlot::whereDoesntHave('currentTracking')
                ->whereHas('trackingHistory')
                ->count(); // has history but nothing active = fully through pipeline (approximation)
            $lotsInPlant = $totalLots; // adjust if you track a hard "completed" flag elsewhere

            // ── Stat 3: Flagged issues, plant-wide, still open ────────
            $unboxNokCount = UnboxingRecord::where('status', 'NOK')->count();
            $lfNokCount    = LineFeedingRecord::where('status', 'NOK')->count();
            $totalNok      = $unboxNokCount + $lfNokCount;

            // ── Stat 4: Pending stations across active lots ───────────
            $activeLotIds = LotTracking::whereNull('endtime')->pluck('lot')->unique();

            $totalStationsAcrossActiveLots = Parts::whereIn('lot', $activeLotIds)
                ->select('lot', 'station')
                ->distinct()
                ->count();

            $completedStations = LineFeedingConfirmation::whereIn('lot', $activeLotIds)
                ->whereNotNull('completed_at')
                ->count();

            $pendingStations = max($totalStationsAcrossActiveLots - $completedStations, 0);

            // ── Chart 1: Lots by current station (donut) ──────────────
            $statusDistribution = DB::table('lottracking')
                ->join('status', 'lottracking.status', '=', 'status.id')
                ->whereNull('lottracking.endtime')
                ->select('status.statusn', 'status.color', DB::raw('count(*) as total'))
                ->groupBy('status.statusn', 'status.color')
                ->get();

            // Add "In Queue" lots (no tracking record at all)
            $inQueueCount = Masterlot::whereDoesntHave('trackingHistory')->count();

            $statusChartData = $statusDistribution->map(fn($row) => [
                'name'  => $row->statusn,
                'y'     => (int) $row->total,
                'color' => $row->color,
            ])->values();

            if ($inQueueCount > 0) {
                $statusChartData->push(['name' => 'In Queue', 'y' => $inQueueCount, 'color' => '#6B7280']);
            }

            // ── Chart 2: My activity, last 7 days ──────────────────────
            $last7Days = collect(range(6, 0))->map(fn($i) => now()->subDays($i)->format('Y-m-d'));

            $myUnboxByDay = UnboxingRecord::where('checked_by', $userId)
                ->whereDate('checked_at', '>=', now()->subDays(6))
                ->selectRaw('DATE(checked_at) as day, COUNT(*) as total')
                ->groupBy('day')->pluck('total', 'day');

            $myLfByDay = LineFeedingRecord::where('checked_by', $userId)
                ->whereDate('checked_at', '>=', now()->subDays(6))
                ->selectRaw('DATE(checked_at) as day, COUNT(*) as total')
                ->groupBy('day')->pluck('total', 'day');

            $myActivityChart = $last7Days->map(fn($day) => [
                'day'         => \Carbon\Carbon::parse($day)->format('D'),
                'unboxing'    => (int) ($myUnboxByDay[$day] ?? 0),
                'linefeeding' => (int) ($myLfByDay[$day] ?? 0),
            ]);

            // ── Chart 3: NOK issues by station ─────────────────────────
            $nokByStation = DB::table('line_feeding_records')
                ->join('parts', 'line_feeding_records.part_id', '=', 'parts.id')
                ->where('line_feeding_records.status', 'NOK')
                ->select('line_feeding_records.station', DB::raw('count(*) as total'))
                ->groupBy('line_feeding_records.station')
                ->orderByDesc('total')
                ->limit(8)
                ->get();

            // ── Today's floor activity feed (light version of "What's Happening") ──
            $todayActivity = LotActivityTracker::with(['user', 'lotInfo'])
                ->whereNull('ended_at')
                ->orderByDesc('started_at')
                ->limit(6)
                ->get()
                ->map(fn($a) => [
                    'user'   => $a->user->name ?? 'Unknown',
                    'lotnum' => $a->lotInfo->lotnum ?? '—',
                    'action' => $a->action,
                    'started_at_iso' => \Carbon\Carbon::parse($a->started_at)->toIso8601String(),
                ]);
                 $resumeCard = $this->getResumeCard($userId);
            return response()->json([
                'stats' => [
                    'my_active_count'   => $myActiveCount,
                    'lots_in_plant'     => $lotsInPlant,
                    'total_nok'         => $totalNok,
                    'pending_stations'  => $pendingStations,
                ],
                'status_chart'   => $statusChartData,
                'activity_chart' => $myActivityChart,
                'nok_chart'      => $nokByStation,
                'today_activity' => $todayActivity,
                'resume_card'    => $resumeCard, 
            ]);

        } catch (\Exception $e) {
            Log::error('Dashboard getDashboardData failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Failed to load dashboard data.'], 500);
        }
    }

    // Add this method, and call it from getDashboardData()

private function getResumeCard($userId)
{
    // ── Most recent unfinished unboxing case worked on by this user ──
    $lastUnboxing = UnboxingRecord::where('checked_by', $userId)
        ->orderByDesc('checked_at')
        ->first();

    $unboxingResume = null;
    if ($lastUnboxing) {
        $totalParts   = Parts::where('lot', $lastUnboxing->lot)->where('boxcase', $lastUnboxing->boxcase)->count();
        $checkedParts = UnboxingRecord::where('lot', $lastUnboxing->lot)->where('boxcase', $lastUnboxing->boxcase)->count();
        $isCompleted  = \App\Models\UnboxingCaseCompletion::where('lot', $lastUnboxing->lot)
            ->where('boxcase', $lastUnboxing->boxcase)->exists();

        if (!$isCompleted && $checkedParts < $totalParts) {
            $lot = Masterlot::find($lastUnboxing->lot);
            $unboxingResume = [
                'type'       => 'unboxing',
                'lot_id'     => $lastUnboxing->lot,
                'lotnum'     => $lot->lotnum ?? '—',
                'boxcase'    => $lastUnboxing->boxcase,
                'progress'   => "{$checkedParts} / {$totalParts} parts checked",
                'percent'    => $totalParts > 0 ? round(($checkedParts / $totalParts) * 100) : 0,
                'last_worked_at' => $lastUnboxing->checked_at,
            ];
        }
    }

    // ── Most recent unfinished line feeding station worked on by this user ──
    $lastLf = LineFeedingRecord::where('checked_by', $userId)
        ->orderByDesc('checked_at')
        ->first();

    $lfResume = null;
    if ($lastLf) {
        $totalParts   = Parts::where('lot', $lastLf->lot)->where('station', $lastLf->station)->count();
        $checkedParts = LineFeedingRecord::where('lot', $lastLf->lot)->where('station', $lastLf->station)->count();
        $confirmation = LineFeedingConfirmation::where('lot', $lastLf->lot)->where('station', $lastLf->station)->first();
        $isCompleted  = $confirmation && $confirmation->completed_at;

        if (!$isCompleted) {
            $lot = Masterlot::find($lastLf->lot);
            $lfResume = [
                'type'       => 'linefeeding',
                'lot_id'     => $lastLf->lot,
                'lotnum'     => $lot->lotnum ?? '—',
                'station'    => $lastLf->station,
                'progress'   => "{$checkedParts} / {$totalParts} parts reviewed",
                'percent'    => $totalParts > 0 ? round(($checkedParts / $totalParts) * 100) : 0,
                'last_worked_at' => $lastLf->checked_at,
            ];
        }
    }

    // Pick whichever was worked on most recently between the two
    $candidates = collect([$unboxingResume, $lfResume])->filter();

    if ($candidates->isEmpty()) return null;

    return $candidates->sortByDesc('last_worked_at')->first();
}
}