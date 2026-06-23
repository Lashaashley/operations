<?php

namespace App\Http\Controllers;

use App\Models\Roles;
use App\Models\Button;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class RolesController extends Controller
{
    public function index()
    {
        $buttons = Button::orderBy('ID')->get();
        return view('students.roles', compact('buttons'));
    }

    public function store(Request $request)
{
    // Validate the request
    $validator = Validator::make($request->all(), [
        'rolename' => 'required|string|max:255|unique:tblroles,rolename',
        'rdesc' => 'nullable|string|max:255',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errors' => $validator->errors(),
        ], 422);
    }

    // Insert into the database
    Roles::create([
        'rolename' => $request->rolename,
        'rdesc' => $request->rdesc,
    ]);

    return response()->json([
        'message' => 'Role Created!',
    ]);
}
public function getAll()
{
    $roles = Roles::paginate(3); // 3 records per page

    return response()->json([
        'data' => $roles->items(),
        'pagination' => [
            'current_page' => $roles->currentPage(),
            'last_page' => $roles->lastPage(),
            'per_page' => $roles->perPage(),
            'total' => $roles->total(),

        ],
    ]);
}
public function update(Request $request, $id)
{
    Log::info('Update request data:', $request->all()); // Add logging for debugging
    
    $roles = Roles::findOrFail($id);
    
    $data = $request->validate([
        'rolename' => 'required|string|max:255',
        'rdesc' => 'nullable|string|max:255',
    ]);

    
    Log::info('Validated data:', $data); // Add logging for debugging
    
    $roles->update($data);
    
    Log::info('After update:', $roles->toArray()); // Add logging for debugging

    return response()->json([
        'message' => 'Role updated successfully',
        'data' => $roles
    ]);
}

public function getAllBranches()
{
    // Fetch all branches
    $roles = Roles::all();

    return response()->json([
        'data' => $roles,
    ]);
}
}
