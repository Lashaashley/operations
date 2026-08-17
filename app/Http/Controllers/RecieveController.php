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

}
