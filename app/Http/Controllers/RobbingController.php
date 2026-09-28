<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RobbingController extends Controller
{
public function index(Request $request)
{
    Log::info('=== RobbingController@index START ===', [
        'full_url'  => $request->fullUrl(),
        'query'     => $request->query(),
        'user_id'   => auth()->id(),
    ]);

    // ── Multi-select entry point ──
    if ($request->filled('issue_ids')) {
        return $this->handleMulti($request);
    }

    // ── Single entry point (existing behavior) ──
    return $this->handleSingle($request);
}
protected function handleSingle(Request $request)
{
    $bootstrapData = null;

    if ($request->has('issue_id')) {
        $issueId = $request->input('issue_id');

        Log::info('RobbingController: fetching single record', ['issue_id' => $issueId]);

        $record = $this->fetchIssues([$issueId])->first();

        if ($record) {
            $shortage = max($record->required_qty - $record->counted_qty, 0);

            $bootstrapData = [
                'mode'         => 'single',           // ← new, explicit marker
                'issue_id'     => (int) $issueId,
                'customer_id'  => $record->customer_id,
                'model_id'     => $record->model_id,
                'lot_id'       => $record->lot_id,
                'part_id'      => $record->part_id,
                'partnum'      => $record->partnum,
                'partdesc'     => $record->partdesc,
                'shortage_qty' => $shortage,
                'reason'       => $record->comment,
            ];

            Log::info('RobbingController: single bootstrap built', $bootstrapData);
        } else {
            Log::warning('RobbingController: no matching record', ['issue_id' => $issueId]);
        }
    } else {
        Log::info('RobbingController: plain form load (no issue_id)');
    }

    return view('students.newrob', ['bootstrapData' => $bootstrapData]);
}
protected function handleMulti(Request $request)
{
    // 1. Parse & clean the comma-separated IDs
    $raw = $request->input('issue_ids');
    $ids = collect(explode(',', $raw))
        ->map(fn($v) => (int) trim($v))
        ->filter(fn($v) => $v > 0)
        ->unique()
        ->values();

    Log::info('RobbingController: multi-issue request', [
        'raw'        => $raw,
        'parsed_ids' => $ids->all(),
    ]);

    if ($ids->isEmpty()) {
        Log::warning('RobbingController: multi-issue request with no valid IDs');
        return redirect()->route('unboxrpt')
            ->with('error', 'No valid issues selected.');
    }

    // 2. Fetch all records in one go
    $rows = $this->fetchIssues($ids->all());

    // 3. If some IDs didn't resolve, warn but continue with what we have
    if ($rows->count() !== $ids->count()) {
        Log::warning('RobbingController: some issue IDs did not resolve', [
            'requested' => $ids->all(),
            'found'     => $rows->pluck('record_id')->all(),
        ]);
    }

    if ($rows->isEmpty()) {
        return redirect()->route('unboxrpt')
            ->with('error', 'None of the selected issues could be found.');
    }

    // 4. Enforce: all rows must belong to the same lot
    $uniqueLotIds = $rows->pluck('lot_id')->unique();
    if ($uniqueLotIds->count() > 1) {
        Log::warning('RobbingController: multi-issue spans multiple lots — rejecting', [
            'lot_ids' => $uniqueLotIds->all(),
        ]);
        return redirect()->route('unboxrpt')
            ->with('error', 'All selected issues must belong to the same Lot Number.');
    }

    // 5. Build the multi-mode bootstrap payload
    $first = $rows->first();

    $bootstrapData = [
        'mode'        => 'multi',
        'customer_id' => $first->customer_id,
        'model_id'    => $first->model_id,
        'lot_id'      => $first->lot_id,
        'rows'        => $rows->map(function ($r) {
            return [
                'issue_id'     => $r->record_id,
                'part_id'      => $r->part_id,
                'partnum'      => $r->partnum,
                'partdesc'     => $r->partdesc,
                'shortage_qty' => max($r->required_qty - $r->counted_qty, 0),
                'reason'       => $r->comment,
            ];
        })->values()->all(),
    ];

    Log::info('RobbingController: multi bootstrap built', [
        'row_count' => count($bootstrapData['rows']),
        'lot_id'    => $bootstrapData['lot_id'],
    ]);

    return view('students.newrob', ['bootstrapData' => $bootstrapData]);
}
/**
 * Fetch unboxing issue records with all joined data.
 * Used by both single and multi flows.
 *
 * @param  array<int>  $issueIds
 * @return \Illuminate\Support\Collection
 */
protected function fetchIssues(array $issueIds)
{
    return DB::table('unboxing_records')
        ->join('parts', 'unboxing_records.part_id', '=', 'parts.id')
        ->join('masterlot', 'unboxing_records.lot', '=', 'masterlot.id')
        ->leftJoin('customers', 'masterlot.customer', '=', 'customers.id')
        ->leftJoin('models', 'masterlot.model', '=', 'models.id')
        ->whereIn('unboxing_records.id', $issueIds)
        ->select(
            'unboxing_records.id as record_id',
            'unboxing_records.required_qty',
            'unboxing_records.counted_qty',
            'unboxing_records.comment',
            'parts.id as part_id',
            'parts.partnum',
            'parts.partdesc',
            'masterlot.id as lot_id',
            'masterlot.customer as customer_id',
            'masterlot.model as model_id',
            'customers.cname',
            'models.mname'
        )
        ->get();
}
}
