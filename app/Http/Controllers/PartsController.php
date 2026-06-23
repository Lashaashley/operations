<?php

namespace App\Http\Controllers;

use App\Models\Parts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PartsController extends Controller
{
    public function getPartsBymodel(Request $request) {
    $modelid = $request->input('modelid');
    
    // Fetch classes filtered by campus ID (caid)
    $parts = Parts::where('model', $modelid)->get();
    
    return response()->json([
        'data' => $parts,
    ]);
}
}
