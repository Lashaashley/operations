<?php

namespace App\Http\Controllers;

use App\Models\Structure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class StaticController extends Controller
{
    public function create()
    {
        return view('students.static');
    }

    public function store(Request $request)
{
    // Validate the request
    $validator = Validator::make($request->all(), [
        'sname' => 'required|string|max:255',
        'motto' => 'required|string|max:255',
        'file' => 'nullable|image|max:2048',
        'pobox' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'Address' => 'required|string|max:255',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errors' => $validator->errors(),
        ], 422);
    }



     $profilePhotoPath = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            // Store in storage/app/public/profile-photos
            $file->storeAs('students', $filename, 'public');
            
            // Also copy to public/storage/profile-photos
            $file->move(public_path('storage/students'), $filename);
            
            $profilePhotoPath = 'students/' . $filename;
        }

    // Insert into the database
    Structure::create([
        'name' => $request->sname,
        'motto' => $request->motto,
        'logo' => $profilePhotoPath,
        'pobox' => $request->pobox,
        'email' => $request->email,
        'physaddres' => $request->Address,
    ]);

    return response()->json([
        'message' => 'Org Structure Saved!',
    ]);
}

public function getAll()
{
    $structures = Structure::all();
    return response()->json([
        'data' => $structures->map(function($structure) {
            return [
                'ID' => $structure->ID,
                'name' => $structure->name,
                'logo' => $structure->logo ? asset('storage/' . $structure->logo) : null,
                'motto' => $structure->motto,
                'pobox' => $structure->pobox,
                'email' => $structure->email,
                'physaddres' => $structure->physaddres,
            ];
        })
    ]);
}

public function update(Request $request, $id)
{
    //Log::info('Update request data:', $request->all()); // Add logging for debugging
    
    $structure = Structure::findOrFail($id);
    
    $data = $request->validate([
        'name' => 'required|string|max:255',
        'motto' => 'nullable|string|max:255',
        'pobox' => 'nullable|string|max:255',
        'email' => 'nullable|email|max:255',
        'physaddres' => 'nullable|string|max:255',
        'logo' => 'nullable|image|max:2048',
    ]);

    if ($request->hasFile('logo')) {
        if ($structure->logo) {
            Storage::disk('public')->delete($structure->logo);
        }
        $data['logo'] = $request->file('logo')->store('students', 'public');
    }

    //Log::info('Validated data:', $data); // Add logging for debugging
    
    $structure->update($data);
    
   // Log::info('After update:', $structure->toArray()); // Add logging for debugging

    return response()->json([
        'message' => 'School information updated successfully',
        'data' => $structure
    ]);
}



}

