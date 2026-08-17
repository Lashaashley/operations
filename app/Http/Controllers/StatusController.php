<?php

namespace App\Http\Controllers;

use App\Models\Status;
use App\Models\Storagezones;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class StatusController extends Controller
{
    public function create()
{
    $status = Status::distinct()->get(['id', 'statusn']);
    dd($status); // Debug data
    return view('students.static', compact('status'));
}

public function store(Request $request)
{
    // Validate the request
    $validator = Validator::make($request->all(), [
        'stname' => 'required|string|max:255',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errors' => $validator->errors(),
        ], 422);
    }

    // Insert into the database
    Status::create([
        'statusn' => $request->stname,
    ]);

    return response()->json([
        'message' => 'Status Saved!',
    ]);
}

public function zonestore(Request $request)
{
    // Validate the request
    $validator = Validator::make($request->all(), [
        'storagename' => 'required|string|max:255',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errors' => $validator->errors(),
        ], 422);
    }

    // Insert into the database
    Storagezones::create([
        'storagename' => $request->storagename,
    ]);

    return response()->json([
        'message' => 'Zone Saved!',
    ]);
}

public function getAll()
{
    $status = Status::paginate(3); // 3 records per page

    return response()->json([
        'data' => $status->items(),
        'pagination' => [
            'current_page' => $status->currentPage(),
            'last_page' => $status->lastPage(),
            'per_page' => $status->perPage(),
            'total' => $status->total(),

        ],
    ]);
}

public function getAllzones()
{
    $zones = Storagezones::paginate(3); // 3 records per page

    return response()->json([
        'data' => $zones->items(),
        'pagination' => [
            'current_page' => $zones->currentPage(),
            'last_page' => $zones->lastPage(),
            'per_page' => $zones->perPage(),
            'total' => $zones->total(),

        ],
    ]);
}

public function getAllStatus()
{
    // Fetch all branches
    $status = Status::all();

    return response()->json([
        'data' => $status,
    ]);
}

public function getAllZone()
{
    // Fetch all branches
    $zones = Storagezones::all();

    return response()->json([
        'data' => $zones,
    ]);
}


public function update(Request $request, $id)
{
    Log::info('Update request data:', $request->all()); // Add logging for debugging
    
    $status = Status::findOrFail($id);
    
    $data = $request->validate([
        'branchname' => 'required|string|max:255',
    ]);

    
    Log::info('Validated data:', $data); // Add logging for debugging
    
    $status->update($data);
    
    Log::info('After update:', $status->toArray()); // Add logging for debugging

    return response()->json([
        'message' => 'Status updated successfully',
        'data' => $status
    ]);
}

}
