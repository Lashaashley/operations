<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customers;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CustomersController extends Controller
{
     public function index()
{
    $customers = Customers::distinct()->get(['ID', 'cname']);
    dd($customers); // Debug data
    return view('students.static', compact('customers'));
}
 public function store(Request $request)
{
    // Validate the request
    $validator = Validator::make($request->all(), [
        'branchname' => 'required|string|max:255',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errors' => $validator->errors(),
        ], 422);
    }

    // Insert into the database
    Customers::create([
        'cname' => $request->branchname,
    ]);

    return response()->json([
        'message' => 'Customer Created!',
    ]);
}

public function getAll()
{
    $customers = Customers::paginate(3); // 3 records per page

    return response()->json([
        'data' => $customers->items(),
        'pagination' => [
            'current_page' => $customers->currentPage(),
            'last_page' => $customers->lastPage(),
            'per_page' => $customers->perPage(),
            'total' => $customers->total(),

        ],
    ]);
}

public function getAllcustomers()
{
    // Fetch all branches
    $customers = Customers::all();

    return response()->json([
        'data' => $customers,
    ]);
}

public function update(Request $request, $id)
{
    Log::info('Update request data:', $request->all()); // Add logging for debugging
    
    $customers = Customers::findOrFail($id);
    
    $data = $request->validate([
        'branchname' => 'required|string|max:255',
    ]);

    
    Log::info('Validated data:', $data); // Add logging for debugging
    
    $customers->update($data);
    
    Log::info('After update:', $customers->toArray()); // Add logging for debugging

    return response()->json([
        'message' => 'Customer updated successfully',
        'data' => $customers
    ]);
}

}
