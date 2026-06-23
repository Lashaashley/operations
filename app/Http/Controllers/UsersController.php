<?php

namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Foundation\Auth\User as AuthUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class UsersController extends Controller
{
    public function index()
    {
        
        
        return view('students.newuser');
    }
    public function indexfun()
    {
        return view('students.musers');
    }

     public function store(Request $request)
{
    // Validation
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email|max:255',
        /*'newpass' => [
            'required',
            'string',
            'min:8',
            'confirmed',
            function ($attribute, $value, $fail) {
                // Check password complexity: 3 out of 4 rules
                $rules = [
                    'uppercase' => preg_match('/[A-Z]/', $value),
                    'lowercase' => preg_match('/[a-z]/', $value),
                    'numbers' => preg_match('/[0-9]/', $value),
                    'symbols' => preg_match('/[~!@#$%^*_\-+=`|(){}\[\]:;"<>,.?\/&]/', $value),
                ];
                
                $metRules = count(array_filter($rules));
                
                if ($metRules < 3) {
                    $fail('Password must match at least 3 of 4 character rules (uppercase, lowercase, numbers, symbols).');
                }
            },
        ],*/
        'confirm' => 'required|same:newpass',
        
        'profilepic' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
    ], [
        'newpass.required' => 'Password is required',
        'newpass.min' => 'Password must be at least 8 characters',
        'newpass.confirmed' => 'Password confirmation does not match',
        'confirm.same' => 'Passwords do not match',
        'email.unique' => 'This email is already registered',
        'profilepic.image' => 'Profile photo must be an image',
        'profilepic.max' => 'Profile photo must not exceed 2MB'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 'error',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        // Handle profile photo upload
        $profilePhotoPath = null;
        if ($request->hasFile('profilepic')) {
            $file = $request->file('profilepic');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            
            // Store in storage/app/public/profile-photos
            $file->storeAs('profile-photos', $filename, 'public');
            
            // Also copy to public/storage/profile-photos
            $file->move(public_path('storage/profile-photos'), $filename);
            
            $profilePhotoPath = 'profile-photos/' . $filename;
        }

        

        // Hash the password
        $hashedPassword = Hash::make($request->newpass);
        
        // Password expiry configuration (in days)
        $passwordExpiryDays = config('auth.password_expiry_days', 90);

        // Create user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $hashedPassword,
            'profile_photo' => $profilePhotoPath,
            
            'password_changed_at' => now(),
            'password_expires_at' => now()->addDays($passwordExpiryDays),
            'must_change_password' => false,
            'failed_login_attempts' => 0,
            'locked_until' => null
        ]);

        // Save password to history
        \App\Models\PasswordHistory::create([
            'user_id' => $user->id,
            'password' => $hashedPassword,
            'created_at' => now()
        ]);
         Log::info('User created successfully', [
            'user_id' => $user->id,
            'email' => $user->email,
            'password_expires_at' => $user->password_expires_at
        ]);
        logAuditTrail(
             session('user_id') ?? Auth::id(), // Current authenticated user who created this user
            'INSERT',
            'users',
            $user->id,
            null, // No old values for new record
            [
                'name' => $user->name,
                'email' => $user->email,
                'profile_photo' => $user->profile_photo,
                
                'password_expires_at' => $user->password_expires_at,
            ],
            [
                'action_type' => 'user_creation',
                'password_expiry_days' => $passwordExpiryDays,
                'has_profile_photo' => !is_null($profilePhotoPath),
                
            ]
        );
       

       

        return response()->json([
            'status' => 'success',
            'message' => 'User created successfully! Password will expire in ' . $passwordExpiryDays . ' days.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile_photo' => $user->profile_photo 
                    ? asset('storage/' . $user->profile_photo) 
                    : null,
                'password_expires_at' => $user->password_expires_at->format('Y-m-d')
            ]
        ], 201);

    } catch (\Exception $e) {
        Log::error('User creation failed', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        logAuditTrail(
             session('user_id') ?? Auth::id(),
            'ERROR',
            'users',
            null,
            null,
            [
                'attempted_email' => $request->email,
                'attempted_name' => $request->name,
            ],
            [
                'action_type' => 'user_creation_failed',
                'error_message' => $e->getMessage(),
            ]
        );

        return response()->json([
            'status' => 'error',
            'message' => 'Failed to create user. Please try again.'
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
            0 => 'name',
            1 => 'id',
            2 => 'email',
            3 => 'password_expires_at'
        ];

        // ✅ Base query with relationships
         $query = User::select(['id', 'name', 'email', 'profile_photo', 'password_expires_at']);

        

        // Search functionality
        if (!empty($searchValue)) {
            $query->where(function($q) use ($searchValue) {
                $q->where('users.name', 'like', "%{$searchValue}%")
                  ->orWhere('users.id', 'like', "%{$searchValue}%")
                  ->orWhere('users.email', 'like', "%{$searchValue}%")
                  ->orWhere('users.password_expires_at', 'like', "%{$searchValue}%");
            });

            Log::info('AgentsController getData: Search applied', [
                'searchValue' => $searchValue
            ]);
        }

        // Get total records before pagination
        $totalRecords = User::where('id', '!=', '1')->count();
        $filteredRecords = $query->count();

        Log::info('AgentsController getData: Record counts', [
            'totalRecords' => $totalRecords,
            'filteredRecords' => $filteredRecords
        ]);

        // Apply ordering
        $orderColumnName = $columns[$orderColumn] ?? 'id';
        $query->orderBy($orderColumnName, $orderDir);

        Log::info('AgentsController getData: Ordering applied', [
            'column' => $orderColumnName,
            'direction' => $orderDir
        ]);

        // Apply pagination
        $agents = $query->skip($start)->take($length)->get();

        
        // Format data for DataTable
        $data = [];
        foreach ($agents as $agent) {
            $agentData = [
                'full_name' => $agent->name,
                'profile_photo' => $agent->profile_photo,
                'id' => $agent->id,
                'email' => $agent->email,
                'password_expires_at' => $agent->password_expires_at ?? 'N/A',
                'actions' => $agent->id
            ];
            
            $data[] = $agentData;
        }

       

        $response = [
            'draw' => intval($draw),
            'recordsTotal' => $totalRecords,
            'recordsFiltered' => $filteredRecords,
            'data' => $data
        ];

        Log::info('AgentsController getData: Response prepared', [
            'response_structure' => [
                'draw' => $response['draw'],
                'recordsTotal' => $response['recordsTotal'],
                'recordsFiltered' => $response['recordsFiltered'],
                'data_count' => count($response['data'])
            ]
        ]);

        return response()->json($response);

    } catch (\Exception $e) {
        Log::error('AgentsController getData error', [
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
public function edit($id)
{
    try {
        $user = User::findOrFail($id);
        
        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile_photo' => $user->profile_photo
            ]
        ]);
    } catch (\Exception $e) {
        Log::error('Failed to load user for editing', [
            'user_id' => $id,
            'error' => $e->getMessage()
        ]);
        
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to load user data'
        ], 500);
    }
}
    /**
     * Update user
     */
   public function update(Request $request, $id)
{
    $user = User::findOrFail($id);
    
    // Capture old values before update for audit trail
    $oldValues = [
        'name' => $user->name,
        'email' => $user->email,
        'profile_photo' => $user->profile_photo,
        
        'password_expires_at' => $user->password_expires_at,
    ];
    
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email,' . $id . '|max:255',
        'newpass' => 'nullable|string|min:8|confirmed',
       
        'profilepic' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
    ]);
    
    if ($validator->fails()) {
        return response()->json([
            'status' => 'error',
            'errors' => $validator->errors()
        ], 422);
    }
    
    try {
        DB::beginTransaction();
        
        // Track if password was changed
        $passwordChanged = false;
        $passwordExpiryDays = null;
        
        // Track if profile photo was changed
        $profilePhotoChanged = false;
        $oldProfilePhoto = $user->profile_photo;
        
        // Handle profile photo update
        if ($request->hasFile('profilepic')) {
            // Delete old photo
            if ($user->profile_photo) {
                Storage::disk('public')->delete($user->profile_photo);
            }
            
            // Upload new photo
            $user->profile_photo = $request->file('profilepic')
                ->store('profile-photos', 'public');
            $profilePhotoChanged = true;
        }
        
        // Update user data
        $user->name = $request->name;
        $user->email = $request->email;
        
        // Update password if provided
        if ($request->filled('newpass')) {
            // Validate password complexity
            if (!$this->validatePasswordComplexity($request->newpass)) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Password does not meet complexity requirements'
                ], 422);
            }
            
            $user->password = Hash::make($request->newpass);
            $user->password_expires_at = now()->addMonths(3); // Set expiry
            $passwordChanged = true;
            $passwordExpiryDays = 90; // 3 months
        }
        
        // Update allowed payrolls
       
        
        $user->save();
        
        // Prepare new values for audit trail
        $newValues = [
            'name' => $user->name,
            'email' => $user->email,
            'profile_photo' => $user->profile_photo,
            
            'password_expires_at' => $user->password_expires_at,
        ];
        
        // Log audit trail
        logAuditTrail(
            session('user_id') ?? Auth::id(), // Current authenticated user who updated this user
            'UPDATE',
            'users',
            $user->id,
            $oldValues,
            $newValues,
            [
                'action_type' => 'user_update',
                'password_changed' => $passwordChanged,
                'password_expiry_days' => $passwordExpiryDays,
                'profile_photo_changed' => $profilePhotoChanged,
                'old_profile_photo' => $oldProfilePhoto,
                'new_profile_photo' => $user->profile_photo,
                
                'name_changed' => $oldValues['name'] !== $newValues['name'],
                'email_changed' => $oldValues['email'] !== $newValues['email'],
                
            ]
        );
        
        DB::commit();
        
        Log::info('User updated successfully', [
            'user_id' => $id,
            'updated_by' => session('user_id') ?? Auth::id(),
            'changes' => [
                'name_changed' => $oldValues['name'] !== $newValues['name'],
                'email_changed' => $oldValues['email'] !== $newValues['email'],
                'password_changed' => $passwordChanged,
                'profile_photo_changed' => $profilePhotoChanged,
                
            ]
        ]);
        
        return response()->json([
            'status' => 'success',
            'message' => 'User updated successfully!'
        ]);
        
    } catch (\Exception $e) {
        DB::rollBack();
        
        Log::error('User update failed', [
            'user_id' => $id,
            'updated_by' => session('user_id') ?? Auth::id(),
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to update user.'
        ], 500);
    }
}

private function validatePasswordComplexity($password)
{
    $hasUppercase = preg_match('/[A-Z]/', $password);
    $hasLowercase = preg_match('/[a-z]/', $password);
    $hasNumber = preg_match('/[0-9]/', $password);
    $hasSymbol = preg_match('/[~!@#$%^*_\-+=`|(){}[\]:;"\'<>,.?\/]/', $password);
    
    $rulesMatched = $hasUppercase + $hasLowercase + $hasNumber + $hasSymbol;
    
    return strlen($password) >= 8 && $rulesMatched >= 3;
}

// Method to get payroll types


    /**
     * Delete user
     */
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);

            // Delete profile photo
            if ($user->profile_photo) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $user->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'User deleted successfully!'
            ]);

        } catch (\Exception $e) {
            Log::error('User deletion failed', [
                'user_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete user.'
            ], 500);
        }
    }
}

