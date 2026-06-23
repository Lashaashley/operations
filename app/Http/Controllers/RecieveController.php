<?php


namespace App\Http\Controllers;
use App\Models\LotActivityTracker;
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
        // Stale threshold — no heartbeat in 30 seconds = consider them gone
        $staleThreshold = now()->subSeconds(30);

        // Auto-close stale sessions that never got a clean "endSession" call
        LotActivityTracker::whereNull('ended_at')
            ->where('last_heartbeat', '<', $staleThreshold)
            ->update(['ended_at' => DB::raw('last_heartbeat')]);

        // Active = no ended_at, recent heartbeat
        $active = LotActivityTracker::with(['user', 'lotInfo'])
            ->whereNull('ended_at')
            ->orderBy('started_at', 'desc')
            ->get()
            ->map(fn($a) => [
                'user'       => $a->user->name ?? 'Unknown',
                'lotnum'     => $a->lotInfo->lotnum ?? '—',
                'action'     => $a->action,
                'started_at' => $a->started_at,
                'is_active'  => true,
            ]);

        // History = has ended_at, most recent first, limit to last 20
        $history = LotActivityTracker::with(['user', 'lotInfo'])
            ->whereNotNull('ended_at')
            ->orderBy('ended_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn($a) => [
                'user'       => $a->user->name ?? 'Unknown',
                'lotnum'     => $a->lotInfo->lotnum ?? '—',
                'action'     => $a->action,
                'started_at' => $a->started_at,
                'ended_at'   => $a->ended_at,
                'is_active'  => false,
            ]);

        return response()->json([
            'active'  => $active,
            'history' => $history,
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
        'contnumber'                  => 'required|string|max:255',
        'unitsno'                  => 'required|string|max:255',
        'timeout'                  => 'required|string|max:255',
        'timein'                  => 'required|string|max:255',
        'units'                    => 'required|array|min:1',
        'units.*.caseno'   => 'required|string|max:50|unique:receiving,caseno',
        'units.*.status'    => 'required|string|max:50 ',
        'units.*.comment'    => 'nullable|string|max:50 ',
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
    $existingChassis = DB::table('units')
        ->whereIn('chassis_number', array_column($request->units, 'chassis_number'))
        ->pluck('chassis_number')
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

}
