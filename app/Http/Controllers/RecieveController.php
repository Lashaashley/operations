<?php


namespace App\Http\Controllers;
use App\Models\LotActivityTracker;
use App\Models\Receiving;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class RecieveController extends Controller
{
    public function index()
    {
        return view('students.reclot');
    }

    public function index2()
    {
        return view('students.recreports');
    }

    
    public function whatshappening()
    {
        return view('students.whatshappening');
    }

    // Called repeatedly (heartbeat) while user has a lot selected on the page
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
    $action = 'Receiving Kits';

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

public function getActivity(Request $request)
{
    try {
        $staleThreshold = now()->subSeconds(30);

        LotActivityTracker::whereNull('ended_at')
            ->where('last_heartbeat', '<', $staleThreshold)
            ->update(['ended_at' => DB::raw('last_heartbeat')]);

        $active = LotActivityTracker::with(['user', 'lotInfo'])
            ->whereNull('ended_at')
            ->orderBy('started_at', 'asc') // longest-running first within each group
            ->get()
            ->map(fn($a) => [
                'id'         => $a->id,
                'user'       => $a->user->name ?? 'Unknown',
                'lotnum'     => $a->lotInfo->lotnum ?? '—',
                'action'     => $a->action,
                'started_at' => $a->started_at,
                'started_at_iso' => \Carbon\Carbon::parse($a->started_at)->toIso8601String(),
                'is_active'  => true,
            ]);

        $history = LotActivityTracker::with(['user', 'lotInfo'])
            ->whereNotNull('ended_at')
            ->orderBy('ended_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($a) {
                $start = \Carbon\Carbon::parse($a->started_at);
                $end   = \Carbon\Carbon::parse($a->ended_at);
                $diff  = $start->diff($end);

                $duration = trim(
                    ($diff->h ? $diff->h . 'h ' : '') .
                    ($diff->i ? $diff->i . 'm '  : '') .
                    ($diff->h === 0 && $diff->i === 0 ? $diff->s . 's' : '')
                ) ?: '< 1s';

                return [
                    'user'       => $a->user->name ?? 'Unknown',
                    'lotnum'     => $a->lotInfo->lotnum ?? '—',
                    'action'     => $a->action,
                    'started_at' => $a->started_at,
                    'ended_at'   => $a->ended_at,
                    'duration'   => $duration,
                    'is_active'  => false,
                ];
            });

        // Group active by action — used for the "by department" card layout
        $activeGrouped = $active->groupBy('action');

        return response()->json([
            'active'         => $active,
            'active_grouped' => $activeGrouped,
            'history'        => $history,
            'summary' => [
                'active_count'    => $active->count(),
                'distinct_lots'   => $active->pluck('lotnum')->unique()->count(),
                'longest_running' => $active->first()['started_at_iso'] ?? null,
            ],
        ]);

    } catch (\Exception $e) {
        Log::error('LotActivityTracker getActivity failed', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to load activity.'], 500);
    }
}



public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'lot_id'                   => 'required|string|max:255',
        'contnumber'               => 'required|string|max:255',
        'unitsno'                  => 'required|string|max:255',
        'timeout'                  => 'required|string|max:255',
        'timein'                   => 'required|string|max:255',
        'sealno'                   => 'required|string|max:255',
        'units'                    => 'required|array|min:1',
        'units.*.caseno'           => 'required|string|max:50|unique:receiving,caseno',
        'units.*.status'           => 'required|string|max:50',
        'units.*.storagezone'           => 'required|string|max:50',
        'units.*.comment'          => 'nullable|string|max:50',
        'units.*.images.*' => 'nullable|image|max:8192',
    ], [
        'units.required' => 'At least one case must be added.',
    ]);

    // Enforce units count matches unitsno exactly
    if ($validator->passes()) {
        $expected = (int) $request->unitsno;
        $actual   = count($request->units ?? []);

        if ($expected !== $actual) {
            $validator->errors()->add(
                'units',
                "Number of case rows ({$actual}) must match No. of Cases ({$expected})."
            );
        }

        // Check for duplicate chassis/engine numbers within the submission
        $casenoNumbers = array_column($request->units, 'caseno');

        if (count($casenoNumbers) !== count(array_unique($casenoNumbers))) {
            $validator->errors()->add('units', 'Duplicate Cases detected in submission.');
        }
    }

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    // Check chassis/engine numbers aren't already used in other lots
    $existingChassis = DB::table('receiving')
        ->whereIn('caseno', array_column($request->units, 'caseno'))
        ->pluck('caseno')
        ->toArray();

    if (!empty($existingChassis)) {
        return response()->json([
            'errors' => [
                'units' => [
                    'Case already exist: ' . implode(', ', $existingChassis)
                ]
            ]
        ], 422);
    }

    try {
        DB::transaction(function () use ($request) {
            foreach ($request->units as $unit) {
                Receiving::create([
                    'lot'     => $request->lot_id,
                    'containerno' => $request->contnumber,
                    'sealno'     => $request->sealno,
                    'caseno'     => $unit['caseno'],
                    'zone'     => $unit['storagezone'],
                    'status'     => $unit['status'],
                    'comment'    => $unit['comment'] ?? null,
                    'timein'     => $request->timein,
                    'timeout'    => $request->timeout,
                ]);
                if (!empty($unit['images'])) {
        foreach ($unit['images'] as $image) {
            $path = $image->store('receiving', 'public');

            DB::table('receiving_images')->insert([
                'receiving_id' => $unit->id,
                'image_path'   => $path,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }
    }
            }
        });

        Log::info('Container Received', [
            'lot_id'     => $request->lot_id,
            'unit_count' => count($request->units)
        ]);

        return response()->json([
            'message' => 'Lot Received!'
        ]);

    } catch (\Exception $e) {
        Log::error('Receiving creation failed', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        return response()->json([
            'errors' => ['general' => ['Failed to create records. Please try again.']]
        ], 500);
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

        // Column mapping for ordering
        $columns = [
            0 => 'customers.cname',
            1 => 'models.mname',
            2 => 'masterlot.lotnum',
            3 => 'receiving.containerno',
            4 => 'receiving.caseno',
            6 => 'users.name',
            7 => 'receiving.comment'
        ];

        // Base query - get all NOK records with their related data
        $query = DB::table('receiving')
            ->join('users', 'receiving.checked_by', '=', 'users.id')
            ->join('masterlot', 'receiving.lot', '=', 'masterlot.id')
            ->leftJoin('models', 'masterlot.model', '=', 'models.id')
            ->leftJoin('customers', 'masterlot.customer', '=', 'customers.id')
            ->where('receiving.status', 'NOK')
            ->select(
                'receiving.id as record_id',
                'receiving.containerno',
                'receiving.caseno',
                'receiving.comment',
                'receiving.status',
                'receiving.created_at',
                'receiving.zone',
                'users.name as checked_by_name',
                'masterlot.lotnum as lot_number',
                'models.mname as model_name',
                'customers.cname as cust_name'
            );

        // Apply search filter
        if (!empty($searchValue)) {
            $query->where(function($q) use ($searchValue) {
                $q->where('masterlot.lotnum', 'like', "%{$searchValue}%")
                  ->orWhere('receiving.zone', 'like', "%{$searchValue}%")
                  ->orWhere('customers.cname', 'like', "%{$searchValue}%")
                  ->orWhere('models.mname', 'like', "%{$searchValue}%")
                  ->orWhere('users.name', 'like', "%{$searchValue}%");
            });
        }

        // Get total records count (without pagination)
        $totalRecords = DB::table('receiving')
            ->where('status', 'NOK')
            ->count();

        // Get filtered records count
        $filteredRecords = $query->count();

        // Apply ordering
        $orderColumnName = $columns[$orderColumn] ?? 'receiving.created_at';
        $query->orderBy($orderColumnName, $orderDir);

        // Apply pagination
        $records = $query->skip($start)->take($length)->get();

        // Format data for DataTable
        $data = [];
        foreach ($records as $record) {
            $data[] = [
                'Customer' => $record->cust_name ?? 'N/A',
                'Model' => $record->model_name ?? 'N/A',
                'LotNumber' => $record->lot_number,
                'Container' => $record->containerno,
                'Case' => $record->caseno,
                'CheckedAt' => $record->created_at ? date('d M Y, H:i', strtotime($record->created_at)) : 'N/A',
                'CheckedBy' => $record->checked_by_name,
                'Comment' => $record->comment ?? '—',
                'actions' => $record->record_id,
            ];
        }

        return response()->json([
            'draw' => intval($draw),
            'recordsTotal' => $totalRecords,
            'recordsFiltered' => $filteredRecords,
            'data' => $data
        ]);

    } catch (\Exception $e) {
        Log::error('Unboxing Issues getData error', [
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

}
