<?php

namespace App\Http\Controllers;

use App\Models\Models;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ModelsController extends Controller
{
      public function create()
{
    $models = Models::distinct()->get(['id', 'customer', 'mname']);
    dd($models); // Debug data
    return view('students.static', compact('models'));
}
public function store(Request $request)
{
    // Validate the request
    $validator = Validator::make($request->all(), [
        'modelname' => 'required|string|max:255',
        'brid' => 'required|string|max:255',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errors' => $validator->errors(),
        ], 422);
    }

    // Insert into the database
    Models::create([
        'customer' => $request->brid,
        'mname' => $request->modelname,
    ]);

    return response()->json([
        'message' => 'Model Saved!',
    ]);
}

public function getAll()
{
    // Join houses with branches to include branchname
    $models = Models::join('customers', 'models.customer', '=', 'customers.id')
        ->select('models.*', 'customers.cname') // Select desired columns
        ->paginate(3); // Paginate the results

    return response()->json([
        'data' => $models->items(),
        'pagination' => [
            'current_page' => $models->currentPage(),
            'last_page' => $models->lastPage(),
            'per_page' => $models->perPage(),
            'total' => $models->total(),
        ],
    ]);
}

public function getAllDepts()
{
    // Fetch all branches
    $models = Models::all();

    return response()->json([
        'data' => $models,
    ]);
}

public function getClassesByCampus(Request $request) {
    $campusId = $request->input('campusId');
    
    // Fetch classes filtered by campus ID (caid)
    $models = Models::where('customer', $campusId)->get();
    
    return response()->json([
        'data' => $models,
    ]);
}

public function update(Request $request, $id)
{
    Log::info('Update request data:', $request->all()); // Add logging for debugging
    
    $models = Models::findOrFail($id);
    
    $data = $request->validate([
        'brid' => 'required|string|max:255',
        'DepartmentName' => 'required|string|max:255',
    ]);

    
    Log::info('Validated data:', $data); // Add logging for debugging
    
    $models->update($data);
    
    Log::info('After update:', $models->toArray()); // Add logging for debugging

    return response()->json([
        'message' => 'Model updated successfully',
        'data' => $models
    ]);
}

}
