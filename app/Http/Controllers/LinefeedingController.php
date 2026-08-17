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
use App\Models\LineFeedingConfirmation;
use App\Models\LineFeedingRecord;
use Illuminate\Support\Facades\Hash;
use Spatie\LaravelPasskeys\Actions\FindPasskeyToAuthenticateAction;

class LinefeedingController extends Controller
{
    public function index()
    {
        return view('students.linefeeding');
    }


    public function getstationsbylot(Request $request) {
    $lotid = $request->input('lotid');
    
    // Select distinct boxcase columns where the lot matches
    $stations = Parts::where('lot', $lotid)
        ->distinct()
        ->get(['station']);
    
    return response()->json([
        'data' => $stations,
    ]);
}
// ── Load parts for a station, with unboxed qty + confirmation state ──
    public function getPartsForStation(Request $request)
{
    $validator = Validator::make($request->all(), [
        'lot_id'  => 'required|integer',
        'station' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $lotId   = $request->input('lot_id');
    $station = $request->input('station');

    try {
        $parts = Parts::where('lot', $lotId)->where('station', $station)->get();

        $unboxRecords = UnboxingRecord::where('lot', $lotId)
            ->whereIn('part_id', $parts->pluck('id'))
            ->get()->keyBy('part_id');

        $lfRecords = LineFeedingRecord::where('lot', $lotId)
            ->where('station', $station)
            ->whereIn('part_id', $parts->pluck('id'))
            ->get()->keyBy('part_id');

        $data = $parts->map(function ($part) use ($unboxRecords, $lfRecords) {
            $unbox = $unboxRecords->get($part->id);
            $lf    = $lfRecords->get($part->id);

            return [
                'part_id'         => $part->id,
                'partnum'         => $part->partnum,
                'partdesc'        => $part->partdesc,
                'required_qty'    => $part->quantity,
                'unboxed_qty'     => $unbox->counted_qty ?? 0,
                'unbox_status'    => $unbox->status ?? null,   // status AT unboxing time
                'unbox_comment'   => $unbox->comment ?? null,
                // ── line feeding's own OK/NOK, independent of unboxing ──
                'lf_status'       => $lf->status ?? 'OK',       // default OK unless flagged
                'lf_comment'      => $lf->comment ?? '',
                'lf_is_checked'   => $lf !== null,
            ];
        });

        $confirmation = LineFeedingConfirmation::where('lot', $lotId)->where('station', $station)->first();

        return response()->json([
            'data' => $data,
            'confirmation' => $confirmation ? [
                'logistics_confirmed'    => !is_null($confirmation->logistics_tech_id),
                'logistics_tech_name'    => optional(\App\Models\User::find($confirmation->logistics_tech_id))->name,
                'assembly_confirmed'     => !is_null($confirmation->assembly_tech_id),
                'assembly_tech_name'     => optional(\App\Models\User::find($confirmation->assembly_tech_id))->name,
                'is_completed'           => !is_null($confirmation->completed_at),
            ] : ['logistics_confirmed' => false, 'assembly_confirmed' => false, 'is_completed' => false],
        ]);

    } catch (\Exception $e) {
        Log::error('getPartsForStation error', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to load parts.'], 500);
    }
}

public function saveLineFeedingRow(Request $request)
{
    $validator = Validator::make($request->all(), [
        'part_id' => 'required|integer|exists:parts,id',
        'lot_id'  => 'required|integer',
        'station' => 'required|string',
        'status'  => 'required|in:OK,NOK',
        'comment' => 'nullable|string|max:255',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    try {
        LineFeedingRecord::updateOrCreate(
            ['part_id' => $request->part_id, 'lot' => $request->lot_id, 'station' => $request->station],
            [
                'status'     => $request->status,
                'comment'    => $request->comment,
                'checked_by' => Auth::id(),
                'checked_at' => now(),
            ]
        );

        Log::info('LineFeedingRecord saved', [
            'part_id' => $request->part_id, 'lot' => $request->lot_id,
            'station' => $request->station, 'status' => $request->status,
        ]);

        return response()->json(['success' => true]);

    } catch (\Exception $e) {
        Log::error('saveLineFeedingRow error', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to save.'], 500);
    }
}


    // ── Confirm identity for one role (logistics or assembly) ──
    // DRAFT: uses password re-entry as a stand-in for fingerprint.
    // Swap the verification block below for WebAuthn (user_authenticators) later —
    // everything else (table shape, endpoint, JS) stays the same.
    public function confirmStationTech(Request $request)
{
    $validator = Validator::make($request->all(), [
        'lot_id'  => 'required|integer',
        'station' => 'required|string',
        'role'    => 'required|in:logistics,assembly',
        'options' => 'required|json',
        'passkey' => 'required|json',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $lotId   = $request->input('lot_id');
    $station = $request->input('station');
    $role    = $request->input('role');

    $passkey = app(FindPasskeyToAuthenticateAction::class)->execute(
        $request->input('passkey'),
        $request->input('options'),
    );

    if (!$passkey) {
        Log::warning('LineFeeding: fingerprint not recognized', [
            'role' => $role, 'lot' => $lotId, 'station' => $station,
        ]);
        return response()->json(['error' => 'Fingerprint not recognized. Please try again.'], 422);
    }

    $confirmingUser = $passkey->authenticatable;

    if ($confirmingUser->role !== $role) {
        Log::warning('LineFeeding: role mismatch on fingerprint confirmation', [
            'user_id' => $confirmingUser->id,
            'user_role' => $confirmingUser->role,
            'expected_role' => $role,
            'lot' => $lotId, 'station' => $station,
        ]);
        return response()->json([
            'error' => "That fingerprint belongs to {$confirmingUser->name}, who isn't registered as a {$role} technician.",
        ], 422);
    }

    try {
        $confirmation = LineFeedingConfirmation::firstOrCreate(
            ['lot' => $lotId, 'station' => $station]
        );

        if ($role === 'logistics') {
            $confirmation->update([
                'logistics_tech_id'      => $confirmingUser->id,
                'logistics_confirmed_at' => now(),
            ]);
        } else {
            $confirmation->update([
                'assembly_tech_id'      => $confirmingUser->id,
                'assembly_confirmed_at' => now(),
            ]);
        }

        Log::info('LineFeeding: tech confirmed via fingerprint', [
            'user_id' => $confirmingUser->id, 'role' => $role, 'lot' => $lotId, 'station' => $station,
        ]);

        $bothConfirmed = !is_null($confirmation->logistics_tech_id) && !is_null($confirmation->assembly_tech_id);

        return response()->json([
            'success'        => true,
            'role'           => $role,
            'confirmed_name' => $confirmingUser->name,
            'both_confirmed' => $bothConfirmed,
        ]);
    } catch (\Exception $e) {
        Log::error('confirmStationTech error', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to confirm.'], 500);
    }
}


    // ── Complete the station — requires both confirmations ──
    public function completeStation(Request $request)
{
    $validator = Validator::make($request->all(), [
        'lot_id'  => 'required|integer',
        'station' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $lotId   = $request->input('lot_id');
    $station = $request->input('station');

    try {
        $confirmation = LineFeedingConfirmation::where('lot', $lotId)->where('station', $station)->first();

        if (!$confirmation || !$confirmation->logistics_tech_id || !$confirmation->assembly_tech_id) {
            return response()->json(['error' => 'Both technicians must confirm before completing.'], 422);
        }

        // Ensure every part at this station has a line feeding decision recorded
        $totalParts   = Parts::where('lot', $lotId)->where('station', $station)->count();
        $checkedParts = LineFeedingRecord::where('lot', $lotId)->where('station', $station)->count();

        if ($checkedParts < $totalParts) {
            return response()->json([
                'error' => "Not all parts reviewed ({$checkedParts}/{$totalParts}). Mark OK/NOK for each part first."
            ], 422);
        }

        $confirmation->update(['completed_at' => now()]);

        $nokCount = LineFeedingRecord::where('lot', $lotId)->where('station', $station)->where('status', 'NOK')->count();

        Log::info('LineFeeding: station completed', ['lot' => $lotId, 'station' => $station, 'nok_count' => $nokCount]);

        return response()->json([
            'success'   => true,
            'message'   => $nokCount > 0
                ? "Station completed with {$nokCount} issue(s) flagged."
                : 'Station completed — all parts OK.',
            'nok_count' => $nokCount,
        ]);

    } catch (\Exception $e) {
        Log::error('completeStation error', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to complete station.'], 500);
    }
}

public function lineFeedingReport(Request $request)
{
    $validator = Validator::make($request->all(), [
        'lot_id' => 'required|integer|exists:masterlot,id',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $lotId = $request->input('lot_id');

    try {
        $structure = Structure::first();
        $logoPath  = null;
        if ($structure && $structure->logo) {
            $fullLogoPath = public_path('storage/' . $structure->logo);
            if (file_exists($fullLogoPath)) $logoPath = $fullLogoPath;
        }

        $lot = Masterlot::select('masterlot.*', 'customers.cname', 'models.mname')
            ->leftJoin('customers', 'masterlot.customer', '=', 'customers.id')
            ->leftJoin('models',    'masterlot.model',    '=', 'models.id')
            ->findOrFail($lotId);

        // ── All stations that exist for this lot's parts ─────────────
        $allStations = Parts::where('lot', $lotId)
            ->select('station')
            ->distinct()
            ->pluck('station');

        // ── Stations that have been completed (line_feeding_confirmations) ──
        $completedStations = DB::table('line_feeding_confirmations')
            ->where('lot', $lotId)
            ->whereNotNull('completed_at')
            ->pluck('station')
            ->toArray();

        // ── Pending stations = all stations - completed ones ──────────
        $pendingStations = $allStations->diff($completedStations)->values();

        $pendingStationRows = $pendingStations->map(function ($station) use ($lotId) {
            $requiredParts = Parts::where('lot', $lotId)->where('station', $station)->count();
            $requiredQty   = Parts::where('lot', $lotId)->where('station', $station)->sum('quantity');

            $fedCount = DB::table('line_feeding_records')
                ->where('lot', $lotId)->where('station', $station)->count();

            $confirmation = DB::table('line_feeding_confirmations')
                ->where('lot', $lotId)->where('station', $station)->first();

            $status = 'Not Started';
            if ($confirmation) {
                if ($confirmation->logistics_tech_id && $confirmation->assembly_tech_id) {
                    $status = 'Awaiting Completion';
                } elseif ($confirmation->logistics_tech_id || $confirmation->assembly_tech_id) {
                    $status = 'Partially Confirmed';
                } elseif ($fedCount > 0) {
                    $status = 'In Progress';
                }
            } elseif ($fedCount > 0) {
                $status = 'In Progress';
            }

            return [
                'station'          => $station,
                'required_parts'   => $requiredParts,
                'required_qty'     => $requiredQty,
                'parts_reviewed'   => $fedCount,
                'status'           => $status,
            ];
        });

        // ── Line feeding NOKs ──────────────────────────────────────
        $lfNoks = DB::table('line_feeding_records')
            ->join('parts', 'line_feeding_records.part_id', '=', 'parts.id')
            ->join('users', 'line_feeding_records.checked_by', '=', 'users.id')
            ->where('line_feeding_records.lot', $lotId)
            ->where('line_feeding_records.status', 'NOK')
            ->select(
                'parts.partnum', 'parts.partdesc',
                'line_feeding_records.station',
                'line_feeding_records.comment',
                'line_feeding_records.checked_at',
                'users.name as checked_by_name'
            )
            ->orderBy('line_feeding_records.station')
            ->get()
            ->map(fn($row) => (array) $row + ['source' => 'Line Feeding']);

        // ── Unboxing NOKs still relevant (still flagged, for cross-reference) ──
        $unboxNoks = DB::table('unboxing_records')
            ->join('parts', 'unboxing_records.part_id', '=', 'parts.id')
            ->join('users', 'unboxing_records.checked_by', '=', 'users.id')
            ->where('unboxing_records.lot', $lotId)
            ->where('unboxing_records.status', 'NOK')
            ->select(
                'parts.partnum', 'parts.partdesc',
                'parts.station',
                'unboxing_records.comment',
                'unboxing_records.checked_at',
                'users.name as checked_by_name'
            )
            ->orderBy('parts.station')
            ->get()
            ->map(fn($row) => (array) $row + ['source' => 'Unboxing']);

        $allNoks = collect($lfNoks)->concat($unboxNoks)->sortBy('station')->groupBy('station');

        Log::info('LineFeedingReport generated', [
            'lot_id' => $lotId,
            'nok_count' => $allNoks->flatten(1)->count(),
            'pending_stations' => $pendingStations->count(),
        ]);

        $pdf = Pdf::loadView('reports.line-feeding', [
            'structure'          => $structure,
            'logoPath'           => $logoPath,
            'lot'                => $lot,
            'nokGroups'          => $allNoks,
            'pendingStationRows' => $pendingStationRows,
            'totalStations'      => $allStations->count(),
            'completedCount'     => count($completedStations),
            'generatedAt'        => now()->format('d M Y, H:i'),
        ])
        ->setPaper('a4', 'portrait')
        ->setOptions([
            'defaultFont'          => 'sans-serif',
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled'      => false,
            'dpi'                  => 150,
        ]);

        return response()->json([
            'success' => true,
            'pdf'     => base64_encode($pdf->output()),
            'lot_num' => $lot->lotnum,
        ]);

    } catch (\Exception $e) {
        Log::error('LineFeedingReport failed', ['lot_id' => $lotId, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
        return response()->json(['error' => 'Failed to generate report.'], 500);
    }
}
}