<?php

namespace App\Http\Controllers;

use App\Models\Masterlot;
use App\Models\Unit;
use App\Models\Status;
use App\Models\Lottracking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\LotsExport;
use Barryvdh\DomPDF\Facade\Pdf;

class MasterlotConroller extends Controller
{
    public function index()
    {
        return view('students.createlot');
    }

    public function index2()
    {
        return view('students.lottracking');
    }
    public function index3()
    {
        return view('students.newrob');
    }

    public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'customer'                 => 'required|integer',
        'model'                    => 'required|integer',
        'lotnum'                   => 'required|string|max:255|unique:masterlot,lotnum',
        'unitsno'                  => 'required|integer|min:1',
        'units'                    => 'required|array|min:1',
        'units.*.chassis_number'   => 'required|string|max:50|unique:units,chassis_number',
        'units.*.engine_number'    => 'required|string|max:50|unique:units,engine_number',
    ], [
        'units.required' => 'At least one unit must be added.',
    ]);

    // Enforce units count matches unitsno exactly
    if ($validator->passes()) {
        $expected = (int) $request->unitsno;
        $actual   = count($request->units ?? []);

        if ($expected !== $actual) {
            $validator->errors()->add(
                'units',
                "Number of unit rows ({$actual}) must match No. of Units ({$expected})."
            );
        }

        // Check for duplicate chassis/engine numbers within the submission
        $chassisNumbers = array_column($request->units, 'chassis_number');
        $engineNumbers  = array_column($request->units, 'engine_number');

        if (count($chassisNumbers) !== count(array_unique($chassisNumbers))) {
            $validator->errors()->add('units', 'Duplicate chassis numbers detected in submission.');
        }
        if (count($engineNumbers) !== count(array_unique($engineNumbers))) {
            $validator->errors()->add('units', 'Duplicate engine numbers detected in submission.');
        }
    }

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // Check chassis/engine numbers aren't already used in other lots
    $existingChassis = DB::table('units')
        ->whereIn('chassis_number', array_column($request->units, 'chassis_number'))
        ->pluck('chassis_number')
        ->toArray();

    $existingEngine = DB::table('units')
        ->whereIn('engine_number', array_column($request->units, 'engine_number'))
        ->pluck('engine_number')
        ->toArray();

    if (!empty($existingChassis) || !empty($existingEngine)) {
        return response()->json([
            'errors' => [
                'units' => array_filter([
                    !empty($existingChassis) ? 'Chassis numbers already exist: ' . implode(', ', $existingChassis) : null,
                    !empty($existingEngine)  ? 'Engine numbers already exist: ' . implode(', ', $existingEngine)   : null,
                ])
            ]
        ], 422);
    }

    try {
        $lot = DB::transaction(function () use ($request) {
            $lot = Masterlot::create([
                'customer' => $request->customer,
                'lotnum'   => $request->lotnum,
                'unitsno'  => $request->unitsno,
                'model'    => $request->model,
            ]);

            foreach ($request->units as $unit) {
                Unit::create([
                    'lot'            => $lot->id,
                    'chassis_number' => $unit['chassis_number'],
                    'engine_number'  => $unit['engine_number'],
                ]);
            }

            return $lot;
        });

        Log::info('Lot created with units', ['lot_id' => $lot->id, 'unit_count' => count($request->units)]);

        return response()->json(['message' => 'Lot Created!']);

    } catch (\Exception $e) {
        Log::error('Lot creation failed', ['error' => $e->getMessage()]);
        return response()->json(['errors' => ['general' => ['Failed to create lot. Please try again.']]], 500);
    }
}


public function getData(Request $request)
{
    try {
        $draw = $request->get('draw', 1);
        $start = $request->get('start', 0);
        $length = $request->get('length', 10);
        $searchValue = $request->get('search')['value'] ?? '';
        $orderColumn = $request->get('order')[0]['column'] ?? 0;
        $orderDir = $request->get('order')[0]['dir'] ?? 'asc';

        $columns = [
            0 => 'masterlot.lotnum',
            1 => 'masterlot.unitsno',
            2 => 'customers.cname',
            3 => 'models.mname',
        ];

        $query = $this->buildLotQuery($searchValue);

        $totalRecords = Masterlot::count();
        $filteredRecords = $query->count();

        $orderColumnName = $columns[$orderColumn] ?? 'masterlot.lotnum';
        $query->orderBy($orderColumnName, $orderDir);

        $lots = $query->skip($start)->take($length)->get();

        $data = [];
        foreach ($lots as $lot) {
            $row = $this->formatLotRow($lot);

            $data[] = [
                'LotNumber' => $row['LotNumber'],
                'Units'     => $row['Units'],
                'Customer'  => $row['Customer'],
                'Model'     => $row['Model'],
                'Status'    => [
                    'label' => $row['Status'],
                    'color' => $row['StatusColor'],
                ],
                'Age'       => $row['Age'],
                'actions'   => $lot->id,
            ];
        }

        return response()->json([
            'draw' => intval($draw),
            'recordsTotal' => $totalRecords,
            'recordsFiltered' => $filteredRecords,
            'data' => $data
        ]);
    } catch (\Exception $e) {
        Log::error('AgentsController getData error', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'draw' => $request->get('draw', 1),
            'recordsTotal' => 0,
            'recordsFiltered' => 0,
            'data' => [],
            'error' => 'Error loading data: ' . $e->getMessage()
        ], 500);
    }
}

// New method — load lot details for modal
public function getLotDetails(Request $request, $id)
{
    try {
        $lot = Masterlot::with([
            'trackingHistory.statusInfo'
        ])
        ->leftJoin('models', 'masterlot.model', '=', 'models.id')
        ->leftJoin('customers', 'masterlot.customer', '=', 'customers.id')
        ->select('masterlot.*', 'models.mname', 'customers.cname')
        ->findOrFail($id);

        // Full history ordered by starttime
        $history = Lottracking::with('statusInfo')
            ->where('lot', $id)
            ->orderBy('starttime')
            ->get()
            ->map(fn($t) => [
                'status_name' => $t->statusInfo->statusn,
                'color'       => $t->statusInfo->color,
                'starttime'   => $t->starttime,
                'endtime'     => $t->endtime,
                'done'        => !is_null($t->endtime),
            ]);

        // Current active status
        $current = Lottracking::with('statusInfo')
            ->where('lot', $id)
            ->whereNull('endtime')
            ->first();

        // Determine next status
        $allStatuses  = Status::orderBy('id')->get();
        $lastStatusId = $history->isNotEmpty()
            ? Lottracking::where('lot', $id)->max('status')
            : 0;

        $nextStatus = $allStatuses->first(fn($s) => $s->id > $lastStatusId);

        // Is lot completed (went through all statuses)?
        $isCompleted = is_null($nextStatus);

        return response()->json([
            'lot' => [
                'id'      => $lot->id,
                'lotnum'  => $lot->lotnum,
                'units'   => $lot->unitsno,
                'model'   => $lot->mname,
                'customer'=> $lot->cname,
            ],
            'history'     => $history,
            'current'     => $current ? [
                'status_name' => $current->statusInfo->statusn,
                'color'       => $current->statusInfo->color,
            ] : null,
            'next_status' => $nextStatus ? [
                'id'    => $nextStatus->id,
                'name'  => $nextStatus->statusn,
                'color' => $nextStatus->color,
            ] : null,
            'is_completed' => $isCompleted,
            'in_queue'     => $history->isEmpty(),
        ]);

    } catch (\Exception $e) {
        Log::error('getLotDetails error', ['id' => $id, 'error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to load lot details.'], 500);
    }
}


// New method — advance to next status
public function advanceStatus(Request $request, $id)
{
    try {
        $lot = Masterlot::findOrFail($id);

        $allStatuses  = Status::orderBy('id')->get();
        $lastStatusId = Lottracking::where('lot', $id)->max('status') ?? 0;
        $nextStatus   = $allStatuses->first(fn($s) => $s->id > $lastStatusId);

        if (!$nextStatus) {
            return response()->json(['error' => 'Lot is already completed.'], 422);
        }

        DB::transaction(function () use ($id, $nextStatus) {
            $now = now();

            // Close current active status if exists
            Lottracking::where('lot', $id)
                ->whereNull('endtime')
                ->update(['endtime' => $now]);

            // Open next status
            Lottracking::create([
                'lot'       => $id,
                'status'    => $nextStatus->id,
                'starttime' => $now,
                'endtime'   => null,
            ]);
        });

        Log::info('LotTracking: Status advanced', [
            'lot_id'      => $id,
            'new_status'  => $nextStatus->statusn,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Lot moved to {$nextStatus->statusn}",
        ]);

    } catch (\Exception $e) {
        Log::error('advanceStatus error', ['id' => $id, 'error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to advance status.'], 500);
    }
}

public function getLotsByModel(Request $request)
{
    $modelId = $request->input('modelId');
    

    $lots = Masterlot::where('masterlot.model', $modelId)
        ->leftJoin('lottracking', function ($join) {
            $join->on('lottracking.lot', '=', 'masterlot.id')
                 ->whereNull('lottracking.endtime');
        })
        ->leftJoin('status', 'lottracking.status', '=', 'status.id')
        ->select(
            'masterlot.id',
            'masterlot.lotnum',
            'lottracking.status as statusid',  // ✅ add this
            'status.statusn',
            'status.color'
        )
        ->get()
        ->map(fn($lot) => [
            'id'       => $lot->id,
            'lotnum'   => $lot->lotnum,
            'statusid' => $lot->statusid,       // ✅ now references the alias correctly
            'status'   => $lot->statusn ?? 'In Queue',
            'color'    => $lot->color   ?? '#6B7280',
        ]);

    return response()->json(['data' => $lots]);
}


public function getLotsByModelandlot(Request $request)
{
    $validator = Validator::make($request->all(), [
        'modelId'  => 'required|integer',
        //'statusid' => 'required|integer',
    ]);

    if ($validator->fails()) {
        Log::warning('getLotsByModelandlot: invalid params', $request->all());
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $modelId  = $request->input('modelId');
   // $statusId = $request->input('statusid');

    $lots = Masterlot::where('masterlot.model', $modelId)
        ->join('lottracking', function ($join) {
            $join->on('lottracking.lot', '=', 'masterlot.id')
                 ->whereNull('lottracking.endtime');
        })
        ->join('status', 'lottracking.status', '=', 'status.id')
        //->where('lottracking.status', '<', $statusId)
        ->select(
            'masterlot.id',
            'masterlot.lotnum',
            'lottracking.status as statusid',
            'status.statusn',
            'status.color'
        )
        ->get()
        ->map(fn($lot) => [
            'id'       => $lot->id,
            'lotnum'   => $lot->lotnum,
            'statusid' => $lot->statusid,
            'status'   => $lot->statusn,
            'color'    => $lot->color,
        ]);

    return response()->json(['data' => $lots]);
}


public function getlotbyModel(Request $request) {
    $modelid = $request->input('modelid');
    
    // Fetch classes filtered by campus ID (caid)
    $lots = Masterlot::where('model', $modelid)->get();
    
    return response()->json([
        'data' => $lots,
    ]);
}

private function buildLotQuery(?string $searchValue)
{
    $query = Masterlot::select(
            'masterlot.*',
            'models.mname',
            'customers.cname'
        )
        ->leftJoin('models', 'masterlot.model', '=', 'models.id')
        ->leftJoin('customers', 'masterlot.customer', '=', 'customers.id');

    if (!empty($searchValue)) {
        $query->where(function ($q) use ($searchValue) {
            $q->where('masterlot.lotnum', 'like', "%{$searchValue}%")
              ->orWhere('models.mname', 'like', "%{$searchValue}%")
              ->orWhere('customers.cname', 'like', "%{$searchValue}%");
        });
    }

    return $query;
}

private function formatLotRow($lot)
{
    $currentTracking = Lottracking::with('statusInfo')
        ->where('lot', $lot->id)
        ->whereNull('endtime')
        ->first();

    if (!$currentTracking) {
        $statusLabel = 'In Queue';
        $statusColor = '#6B7280';
        $age = null;
    } else {
        $statusLabel = $currentTracking->statusInfo->statusn;
        $statusColor = $currentTracking->statusInfo->color;
        $age = round(Carbon::parse($currentTracking->starttime)->diffInHours(Carbon::now()) / 24, 1);
    }

    return [
        'LotNumber'   => $lot->lotnum,
        'Units'       => $lot->unitsno,
        'Customer'    => $lot->cname,
        'Model'       => $lot->mname,
        'Status'      => $statusLabel,
        'StatusColor' => $statusColor,
        'Age'         => $age,
    ];
}

public function exportExcel(Request $request)
{
    $searchValue = $request->get('search', '');
    $lots = $this->buildLotQuery($searchValue)->orderBy('masterlot.lotnum')->get();
    $rows = $lots->map(fn($lot) => $this->formatLotRow($lot));

    return Excel::download(new LotsExport($rows), 'lots_export_' . now()->format('Ymd_His') . '.xlsx');
}

public function exportPdf(Request $request)
{
    $searchValue = $request->get('search', '');
    $lots = $this->buildLotQuery($searchValue)->orderBy('masterlot.lotnum')->get();
    $rows = $lots->map(fn($lot) => $this->formatLotRow($lot));

    $pdf = Pdf::loadView('reports.lots_pdf', [
        'rows'   => $rows,
        'search' => $searchValue,
    ]);
    return $pdf->download('lots_export_' . now()->format('Ymd_His') . '.pdf');
}

}
