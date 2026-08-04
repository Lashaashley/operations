<?php

namespace App\Http\Controllers;

use App\Models\Parts;
use App\Models\UnboxingRecord;
use App\Models\UnboxingCaseCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Masterlot;
use App\Models\Structure;
use App\Models\LotActivityTracker;

class PartsController extends Controller
{
    public function index()
    {
        return view('students.unbox');
    }
    public function index2()
    {
        return view('students.unboxrpt');
    }
    public function index3()
    {
        return view('students.pidentify');
    }
    public function getPartsBymodel(Request $request)
    {
        $modelid = $request->input('modelid');
        $parts = Parts::where('model', $modelid)->get();
        return response()->json(['data' => $parts]);
    }

    public function getClassesBylot(Request $request)
    {
        $lotid = $request->input('lotid');
        $cases = Parts::where('lot', $lotid)->select('boxcase')->distinct()->get();
        return response()->json(['data' => $cases]);
    }


    // ── NEW: Load parts for a selected case, with existing check-state ──
    public function getPartsForCase(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lot_id'  => 'required|integer',
            'boxcase' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $lotId   = $request->input('lot_id');
        $boxcase = $request->input('boxcase');

        try {
            // Parts belonging to this lot + case
            $parts = Parts::where('lot', $lotId)
                ->where('boxcase', $boxcase)
                ->get();

            // Existing check records for these parts (resume support)
            $existingRecords = UnboxingRecord::where('lot', $lotId)
                ->where('boxcase', $boxcase)
                ->get()
                ->keyBy('part_id');

            $data = $parts->map(function ($part) use ($existingRecords) {
                $record = $existingRecords->get($part->id);

                return [
                    'part_id'      => $part->id,
                    'partnum'      => $part->partnum,
                    'partdesc'     => $part->partdesc,
                    'station'      => $part->station,
                    'required_qty'=> $part->quantity,
                    // Pre-filled if already checked, otherwise defaults
                    'counted_qty'  => $record->counted_qty ?? null, //?? $part->quantity
                    'status'       => $record->status  ?? null,
                    'comment'      => $record->comment ?? '',
                    'is_checked'   => $record !== null,
                ];
            });

            // Is this case already marked complete?
            $isCompleted = UnboxingCaseCompletion::where('lot', $lotId)
                ->where('boxcase', $boxcase)
                ->exists();

            return response()->json([
                'data'         => $data,
                'is_completed' => $isCompleted,
                'checked_count'=> $existingRecords->count(),
                'total_count'  => $parts->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('getPartsForCase error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to load parts.'], 500);
        }
    }


    // ── NEW: Autosave a single part's check result ──
    public function saveUnboxingRow(Request $request)
    {
        $validator = Validator::make($request->all(), [
        'part_id'      => 'required|integer|exists:parts,id',
        'lot_id'       => 'required|integer|exists:masterlot,id', // Add exists validation
        'boxcase'      => 'required|string|max:255',
        'required_qty' => 'required|integer|min:0',
        'counted_qty'  => 'required|integer|min:0',
        'status'       => 'required|in:OK,NOK',
        'comment'      => 'nullable|string|max:255',
    ]);

    if ($validator->fails()) {
        // Log validation errors for debugging
        Log::error('Validation failed', [
            'errors' => $validator->errors()->toArray(),
            'input' => $request->all()
        ]);
        
        return response()->json(['errors' => $validator->errors()], 422);
    }

        try {
            $record = UnboxingRecord::updateOrCreate(
                [
                    'part_id' => $request->part_id,
                    'lot'     => $request->lot_id,
                    'boxcase' => $request->boxcase,
                ],
                [
                    'required_qty' => $request->required_qty,
                    'counted_qty'  => $request->counted_qty,
                    'status'       => $request->status,
                    'comment'      => $request->comment,
                    'checked_by'   => Auth::id(),
                    'checked_at'   => now(),
                ]
            );

            Log::info('UnboxingRecord saved', [
                'part_id' => $request->part_id,
                'lot'     => $request->lot_id,
                'boxcase' => $request->boxcase,
                'status'  => $request->status,
            ]);

            return response()->json(['success' => true, 'record_id' => $record->id]);

        } catch (\Exception $e) {
            Log::error('saveUnboxingRow error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to save.'], 500);
        }
    }


    // ── NEW: Mark case as complete ──
    public function completeCase(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lot_id'  => 'required|integer',
            'boxcase' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $lotId   = $request->input('lot_id');
        $boxcase = $request->input('boxcase');

        try {
            $totalParts   = Parts::where('lot', $lotId)->where('boxcase', $boxcase)->count();
            $checkedParts = UnboxingRecord::where('lot', $lotId)->where('boxcase', $boxcase)->count();

            if ($checkedParts < $totalParts) {
                return response()->json([
                    'error' => "Not all parts checked ({$checkedParts}/{$totalParts}). Please complete all parts first."
                ], 422);
            }

            UnboxingCaseCompletion::updateOrCreate(
                ['lot' => $lotId, 'boxcase' => $boxcase],
                ['completed_by' => Auth::id(), 'completed_at' => now()]
            );

            $nokCount = UnboxingRecord::where('lot', $lotId)
                ->where('boxcase', $boxcase)
                ->where('status', 'NOK')
                ->count();

            Log::info('Case marked complete', [
                'lot' => $lotId, 'boxcase' => $boxcase, 'nok_count' => $nokCount,
            ]);

            return response()->json([
                'success'   => true,
                'message'   => $nokCount > 0
                    ? "Case completed with {$nokCount} issue(s) flagged for follow-up."
                    : 'Case completed — all parts OK.',
                'nok_count' => $nokCount,
            ]);

        } catch (\Exception $e) {
            Log::error('completeCase error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to complete case.'], 500);
        }
    }


    public function unboxingReport(Request $request)
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

        $logoPath = null;
        if ($structure && $structure->logo) {
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

        // ── Unboxing records for this lot, joined with parts + users ──
        $unboxrecords = DB::table('unboxing_records')
            ->join('parts', 'unboxing_records.part_id', '=', 'parts.id')
            ->join('users', 'unboxing_records.checked_by', '=', 'users.id')
            ->where('unboxing_records.lot', $lotId)
            ->where('unboxing_records.status', 'NOK')
            ->select(
                'unboxing_records.boxcase',
                'unboxing_records.required_qty',
                'unboxing_records.counted_qty',
                'unboxing_records.status',
                'unboxing_records.comment',
                'unboxing_records.checked_at',
                'parts.partnum',
                'parts.partdesc',
                'users.name as checked_by_name'
            )
            ->orderBy('unboxing_records.boxcase')
            ->orderBy('parts.partnum')
            ->get()
            ->map(function ($row) {
                $short = $row->required_qty - $row->counted_qty;
                $row->qty_short = $short > 0 ? $short : 0;
                return $row;
            })
            ->groupBy('boxcase');

        // ── Summary counts ─────────────────────────────────────────
        $totalParts = $unboxrecords->flatten(1)->count();
        $shortParts = $unboxrecords->flatten(1)->where('qty_short', '>', 0)->count();
        $okParts    = $unboxrecords->flatten(1)->where('status', 'OK')->count();

        // ── Technicians involved ───────────────────────────────────
        $technicians = $unboxrecords->flatten(1)->pluck('checked_by_name')->unique()->values();

        Log::info('PartsController: Generating unboxing report', [
            'lot_id'      => $lotId,
            'boxcases'    => $unboxrecords->keys(),
            'total_parts' => $totalParts,
            'short_parts' => $shortParts,
        ]);

        // ── Generate PDF ──────────────────────────────────────────
        $pdf = Pdf::loadView('reports.unboxing', [
            'structure'    => $structure,
            'logoPath'     => $logoPath,
            'lot'          => $lot,
            'unboxrecords' => $unboxrecords,
            'totalParts'   => $totalParts,
            'shortParts'   => $shortParts,
            'okParts'      => $okParts,
            'technicians'  => $technicians,
            'generatedAt'  => now()->format('d M Y, H:i'),
        ])
        ->setPaper('a4', 'portrait')
        ->setOptions([
            'defaultFont'          => 'sans-serif',
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled'      => false,
            'dpi'                  => 150,
        ]);

        $pdfContent = $pdf->output();
        $base64     = base64_encode($pdfContent);

        return response()->json([
            'success' => true,
            'pdf'     => $base64,
            'lot_num' => $lot->lotnum,
        ]);

    } catch (\Exception $e) {
        Log::error('PartsController: Unboxing report failed', [
            'lot_id' => $lotId,
            'error'  => $e->getMessage(),
            'trace'  => $e->getTraceAsString(),
        ]);
        return response()->json(['error' => 'Failed to generate report.'], 500);
    }
}
// New method — lot-wide unboxing progress
public function getLotProgress(Request $request)
{
    $validator = Validator::make($request->all(), [
        'lot_id' => 'required|integer|exists:masterlot,id',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $lotId = $request->input('lot_id');

    try {
        // Total distinct cases in this lot
        $totalCases = Parts::where('lot', $lotId)->distinct('boxcase')->count('boxcase');

        // Completed cases (marked in unboxing_case_completion)
        $completedCases = UnboxingCaseCompletion::where('lot', $lotId)->count();

        // Total parts across the entire lot
        $totalPartsInLot = Parts::where('lot', $lotId)->count();

        // Parts checked (have a record) across the entire lot
        $checkedPartsInLot = UnboxingRecord::where('lot', $lotId)->count();

        // Parts flagged NOK across the lot (pending issues)
        $nokPartsInLot = UnboxingRecord::where('lot', $lotId)->where('status', 'NOK')->count();

        return response()->json([
            'total_cases'      => $totalCases,
            'completed_cases'  => $completedCases,
            'total_parts'      => $totalPartsInLot,
            'checked_parts'    => $checkedPartsInLot,
            'nok_parts'        => $nokPartsInLot,
            'cases_percent'    => $totalCases > 0 ? round(($completedCases / $totalCases) * 100) : 0,
            'parts_percent'    => $totalPartsInLot > 0 ? round(($checkedPartsInLot / $totalPartsInLot) * 100) : 0,
        ]);

    } catch (\Exception $e) {
        Log::error('getLotProgress error', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to load progress.'], 500);
    }
}
public function identifyPart(Request $request)
{
    $validator = Validator::make($request->all(), [
        'partnum' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $partnum = trim($request->input('partnum'));

    try {
        $matches = Parts::where('partnum', $partnum)
            ->leftJoin('masterlot', 'parts.lot', '=', 'masterlot.id')
            ->leftJoin('customers', 'masterlot.customer', '=', 'customers.id')
            ->leftJoin('models',    'masterlot.model',    '=', 'models.id')
            ->leftJoin('unboxing_records', function ($join) {
                $join->on('unboxing_records.part_id', '=', 'parts.id')
                     ->on('unboxing_records.lot', '=', 'parts.lot');
            })
            ->leftJoin('users', 'unboxing_records.checked_by', '=', 'users.id')
            ->select(
                'parts.id as part_id',
                'parts.partnum',
                'parts.partdesc',
                'parts.station',
                'parts.boxcase',
                'parts.quantity as required_qty',
                'masterlot.lotnum',
                'customers.cname',
                'models.mname',
                'unboxing_records.status',
                'unboxing_records.counted_qty',
                'unboxing_records.comment',
                'unboxing_records.checked_at',
                'users.name as checked_by_name'
            )
            ->orderBy('masterlot.lotnum')
            ->get();

        if ($matches->isEmpty()) {
            Log::info('PartIdentify: No match found', ['partnum' => $partnum]);
            return response()->json([
                'found' => false,
                'message' => "No part found matching \"{$partnum}\".",
            ]);
        }

        $results = $matches->map(fn($row) => [
            'part_id'      => $row->part_id,
            'partnum'      => $row->partnum,
            'partdesc'     => $row->partdesc,
            'station'      => $row->station,
            'boxcase'      => $row->boxcase,
            'required_qty' => $row->required_qty,
            'lotnum'       => $row->lotnum,
            'customer'     => $row->cname,
            'model'        => $row->mname,
            'is_checked'   => !is_null($row->status),
            'status'       => $row->status,        // OK / NOK / null (not yet checked)
            'counted_qty'  => $row->counted_qty,
            'comment'      => $row->comment,
            'checked_by'   => $row->checked_by_name,
            'checked_at'   => $row->checked_at,
        ]);

        Log::info('PartIdentify: Match found', [
            'partnum'     => $partnum,
            'match_count' => $results->count(),
        ]);

        return response()->json([
            'found'   => true,
            'partnum' => $partnum,
            'data'    => $results,
        ]);

    } catch (\Exception $e) {
        Log::error('PartIdentify error', ['partnum' => $partnum, 'error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to identify part.'], 500);
    }
}
public function heartbeat(Request $request)
{
    $validator = Validator::make($request->all(), [
        'lot_id' => 'required|integer|exists:masterlot,id',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $userId = Auth::id();
    $lotId  = $request->input('lot_id');
    $action = 'Unboxing';

    try {
        // Find an existing active session for this user (any lot) — close it if they switched lots
        $existing = LotActivityTracker::where('user_id', $userId)
            ->whereNull('ended_at')
            ->first();

        if ($existing && $existing->lot != $lotId) {
            // User switched to a different lot — close the old session
            $existing->update(['ended_at' => now()]);
            $existing = null;
        }

        if ($existing) {
            // Same lot — just update heartbeat
            $existing->update(['last_heartbeat' => now()]);
        } else {
            // New session for this lot
            LotActivityTracker::create([
                'user_id'        => $userId,
                'lot'            => $lotId,
                'action'         => $action,
                'last_heartbeat' => now(),
                'started_at'     => now(),
                'ended_at'       => null,
            ]);

            Log::info('LotActivityTracker: New session started', [
                'user_id' => $userId,
                'lot_id'  => $lotId,
            ]);
        }

        return response()->json(['success' => true]);

    } catch (\Exception $e) {
        Log::error('LotActivityTracker heartbeat failed', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to record activity.'], 500);
    }
}
public function endSession(Request $request)
{
    $userId = Auth::id();
    $lotId  = $request->input('lot_id');

    try {
        LotActivityTracker::where('user_id', $userId)
            ->where('lot', $lotId)
            ->whereNull('ended_at')
            ->update(['ended_at' => now()]);

        return response()->json(['success' => true]);

    } catch (\Exception $e) {
        Log::error('LotActivityTracker endSession failed', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to end session.'], 500);
    }
}

public function getcasesbylot(Request $request) {
    $lotid = $request->input('lotid');
    
    // Select distinct boxcase columns where the lot matches
    $cases = Parts::where('lot', $lotid)
        ->distinct()
        ->get(['boxcase']);
    
    return response()->json([
        'data' => $cases,
    ]);
}


}