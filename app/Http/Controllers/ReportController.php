<?php

// app/Http/Controllers/ReportController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Masterlot;
use App\Models\Structure;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    public function receivingReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lot_id' => 'required|integer|exists:masterlot,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $lotId = $request->input('lot_id');

        try {
            // ── Organization Structure (Report Header) ────────────────
            $structure = Structure::first();
            
            // Build logo path for PDF
            $logoPath = null;
            if ($structure && $structure->logo) {
                // Logo is stored as 'students/filename.png'
                $fullLogoPath = public_path('storage/' . $structure->logo);
                if (file_exists($fullLogoPath)) {
                    $logoPath = $fullLogoPath;
                }
            }

            // ── Lot info ─────────────────────────────────────────────
            $lot = Masterlot::select(
                    'masterlot.*',
                    'customers.cname',
                    'models.mname'
                )
                ->leftJoin('customers', 'masterlot.customer', '=', 'customers.id')
                ->leftJoin('models',    'masterlot.model',    '=', 'models.id')
                ->findOrFail($lotId);

            // ── Receiving records grouped by container ────────────────
            $containers = DB::table('receiving')
                ->where('lot', $lotId)
                ->orderBy('containerno')
                ->orderBy('caseno')
                ->get()
                ->groupBy('containerno');

            // ── Time taken from lot_activity_tracker ──────────────────
            $activityBounds = DB::table('lot_activity_tracker')
                ->where('lot', $lotId)
                ->whereNotNull('ended_at')
                ->selectRaw('MIN(started_at) as start_time, MAX(ended_at) as end_time')
                ->first();

            $timeTaken = null;
            $startTime = null;
            $endTime   = null;

            if ($activityBounds && $activityBounds->start_time && $activityBounds->end_time) {
                $startTime = \Carbon\Carbon::parse($activityBounds->start_time);
                $endTime   = \Carbon\Carbon::parse($activityBounds->end_time);
                $diff      = $startTime->diff($endTime);

                $timeTaken = trim(
                    ($diff->h ? $diff->h . 'h ' : '') .
                    ($diff->i ? $diff->i . 'm '  : '') .
                    ($diff->s ? $diff->s . 's'   : '')
                ) ?: '< 1s';
            }

            // ── Technicians who worked on this lot ────────────────────
            $technicians = DB::table('lot_activity_tracker')
                ->join('users', 'lot_activity_tracker.user_id', '=', 'users.id')
                ->where('lot_activity_tracker.lot', $lotId)
                ->whereNotNull('lot_activity_tracker.ended_at')
                ->select('users.name')
                ->distinct()
                ->pluck('name')
                ->toArray();

            // ── Summary counts ────────────────────────────────────────
            $totalCases = DB::table('receiving')->where('lot', $lotId)->count();
            $okCount    = DB::table('receiving')->where('lot', $lotId)->where('status', 'OK')->count();
            $nokCount   = DB::table('receiving')->where('lot', $lotId)->where('status', 'NOK')->count();

            Log::info('ReportController: Generating receiving report', [
                'lot_id'      => $lotId,
                'containers'  => $containers->count(),
                'total_cases' => $totalCases,
                'time_taken'  => $timeTaken,
            ]);

            // ── Generate PDF ──────────────────────────────────────────
            $pdf = Pdf::loadView('reports.receiving', [
                'structure'   => $structure,
                'logoPath'    => $logoPath,
                'lot'         => $lot,
                'containers'  => $containers,
                'timeTaken'   => $timeTaken,
                'startTime'   => $startTime,
                'endTime'     => $endTime,
                'technicians' => $technicians,
                'totalCases'  => $totalCases,
                'okCount'     => $okCount,
                'nokCount'    => $nokCount,
                'generatedAt' => now()->format('d M Y, H:i'),
            ])
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'defaultFont'          => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'dpi'                  => 150,
            ]);

            // Return as base64 so JS can embed in modal iframe
            $pdfContent = $pdf->output();
            $base64     = base64_encode($pdfContent);

            return response()->json([
                'success'    => true,
                'pdf'        => $base64,
                'time_taken' => $timeTaken ?? 'N/A',
                'lot_num'    => $lot->lotnum,
            ]);

        } catch (\Exception $e) {
            Log::error('ReportController: Receiving report failed', [
                'lot_id' => $lotId,
                'error'  => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Failed to generate report.'], 500);
        }
    }

    public function kitsInventoryReport(Request $request)
{
    $validator = Validator::make($request->all(), [
        'customer_id'      => 'nullable|integer',
        'model_id'         => 'nullable|integer',
        'include_units'    => 'nullable|boolean',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $customerId    = $request->input('customer_id');
    $modelId       = $request->input('model_id');
    $includeUnits  = filter_var($request->input('include_units', false), FILTER_VALIDATE_BOOLEAN);

    try {
        $structure = Structure::first();
        $logoPath  = null;
        if ($structure && $structure->logo) {
            $fullLogoPath = public_path('storage/' . $structure->logo);
            if (file_exists($fullLogoPath)) $logoPath = $fullLogoPath;
        }

        // ── Base lot query ──────────────────────────────────────────
        $lotsQuery = Masterlot::select(
                'masterlot.id',
                'masterlot.lotnum',
                'masterlot.unitsno',
                'masterlot.created_at as lot_created_at',
                'customers.id as customer_id',
                'customers.cname',
                'models.id as model_id',
                'models.mname'
            )
            ->leftJoin('customers', 'masterlot.customer', '=', 'customers.id')
            ->leftJoin('models',    'masterlot.model',    '=', 'models.id');

        if ($customerId) $lotsQuery->where('masterlot.customer', $customerId);
        if ($modelId)    $lotsQuery->where('masterlot.model', $modelId);

        $lots = $lotsQuery->orderBy('customers.cname')->orderBy('masterlot.lotnum')->get();

        // ── Current station + age per lot ────────────────────────────
        $lotIds = $lots->pluck('id');

        // Active tracking (endtime null) per lot
        $activeTracking = DB::table('lottracking')
            ->join('status', 'lottracking.status', '=', 'status.id')
            ->whereIn('lottracking.lot', $lotIds)
            ->whereNull('lottracking.endtime')
            ->select('lottracking.lot', 'status.statusn', 'status.color', 'lottracking.starttime')
            ->get()
            ->keyBy('lot');

        // Whether a lot has ANY tracking history at all (to distinguish "In Queue" vs "Completed")
        $lotsWithHistory = DB::table('lottracking')
            ->whereIn('lot', $lotIds)
            ->select('lot')
            ->distinct()
            ->pluck('lot')
            ->toArray();

        $now = now();

        $detailRows = $lots->map(function ($lot) use ($activeTracking, $lotsWithHistory, $now) {
            $tracking = $activeTracking->get($lot->id);

            if ($tracking) {
                $currentStation = $tracking->statusn;
                $stationColor   = $tracking->color;
                $ageAtStation   = $now->diffForHumans(\Carbon\Carbon::parse($tracking->starttime), true);
                $ageAtStationDays = $now->diffInDays(\Carbon\Carbon::parse($tracking->starttime));
            } elseif (in_array($lot->id, $lotsWithHistory)) {
                $currentStation = 'Completed';
                $stationColor   = '#10B981';
                $ageAtStation   = '—';
                $ageAtStationDays = 0;
            } else {
                $currentStation = 'In Queue';
                $stationColor   = '#6B7280';
                $ageAtStation   = $now->diffForHumans(\Carbon\Carbon::parse($lot->lot_created_at), true);
                $ageAtStationDays = $now->diffInDays(\Carbon\Carbon::parse($lot->lot_created_at));
            }

            $ageAtKvm = $now->diffForHumans(\Carbon\Carbon::parse($lot->lot_created_at), true);
            $ageAtKvmDays = $now->diffInDays(\Carbon\Carbon::parse($lot->lot_created_at));

            return [
                'lot_id'            => $lot->id,
                'customer'          => $lot->cname,
                'model'             => $lot->mname,
                'lotnum'            => $lot->lotnum,
                'unitsno'           => $lot->unitsno,
                'current_station'   => $currentStation,
                'station_color'     => $stationColor,
                'age_at_station'    => $ageAtStation,
                'age_at_station_days' => $ageAtStationDays,
                'age_at_kvm'        => $ageAtKvm,
                'age_at_kvm_days'   => $ageAtKvmDays,
                'is_stale'          => $ageAtStationDays >= 3, // flag lots stuck 3+ days at one station
            ];
        });

        // ── Individual units (only if requested) ──────────────────
        $unitsByLot = collect();
        if ($includeUnits) {
            $unitsByLot = DB::table('units')
                ->whereIn('lot', $lotIds)
                ->select('lot', 'chassis_number', 'engine_number')
                ->get()
                ->groupBy('lot');
        }

        // ── Summary 1: Lots per customer ──────────────────────────
        $lotsPerCustomer = $lots->groupBy('cname')->map(fn($group) => [
            'customer'   => $group->first()->cname,
            'lot_count'  => $group->count(),
            'unit_total' => $group->sum('unitsno'),
        ])->values();

        // ── Summary 2: Units per customer, grouped by model ────────
        $unitsPerCustomerModel = $lots->groupBy('cname')->map(function ($group) {
            return [
                'customer' => $group->first()->cname,
                'models'   => $group->groupBy('mname')->map(fn($m) => [
                    'model'     => $m->first()->mname,
                    'lot_count' => $m->count(),
                    'units'     => $m->sum('unitsno'),
                ])->values(),
                'total_units' => $group->sum('unitsno'),
            ];
        })->values();

        // ── Overall totals ──────────────────────────────────────────
        $totals = [
            'total_lots'      => $lots->count(),
            'total_units'     => $lots->sum('unitsno'),
            'total_customers' => $lots->pluck('cname')->unique()->count(),
            'stale_lots'      => $detailRows->where('is_stale', true)->count(),
        ];

        Log::info('KitsInventoryReport generated', $totals);

        $pdf = Pdf::loadView('reports.kits-inventory', [
            'structure'             => $structure,
            'logoPath'              => $logoPath,
            'lotsPerCustomer'       => $lotsPerCustomer,
            'unitsPerCustomerModel' => $unitsPerCustomerModel,
            'detailRows'            => $detailRows,
            'unitsByLot'            => $unitsByLot,
            'includeUnits'          => $includeUnits,
            'totals'                => $totals,
            'generatedAt'           => now()->format('d M Y, H:i'),
        ])
        ->setPaper('a4', $includeUnits ? 'portrait' : 'landscape') // more width needed if showing units
        ->setOptions([
            'defaultFont'          => 'sans-serif',
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled'      => false,
            'dpi'                  => 150,
        ]);

        return response()->json([
            'success' => true,
            'pdf'     => base64_encode($pdf->output()),
        ]);

    } catch (\Exception $e) {
        Log::error('KitsInventoryReport failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
        return response()->json(['error' => 'Failed to generate report.'], 500);
    }
}
}