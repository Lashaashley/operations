<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Moduleasd;
use App\Models\Roles;
use App\Models\Rmodules;
use App\Models\Button;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
class ModulesController extends Controller
{
    /**
     * Display module assignment page
     */
    public function index()
{
    $users = User::select('id', 'name')->get();
    $buttons = Button::orderBy('ID')->get();
    $roles = Roles::orderBy('ID')->get();
    
    return view('students.massign', compact('users', 'buttons', 'roles'));
}
    /**
     * Get assigned modules for a user
     */
    public function getUserModules(Request $request)
    {
        $request->validate([
            'workNo' => 'required|exists:users,id'
        ]);

        try {
            $buttonIds = Moduleasd::where('WorkNo', $request->workNo)
                ->pluck('buttonid')
                ->toArray();

            return response()->json([
                'status' => 'success',
                'buttonIds' => $buttonIds
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching user modules', [
                'user' => $request->workNo,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch user modules'
            ], 500);
        }
    }

    public function getRoleModules(Request $request)
    {
        $request->validate([
            'roleid' => 'required|exists:tblroles,ID'
        ]);

        try {
            $buttonIds = Rmodules::where('roleid', $request->roleid)
                ->pluck('rbuttonid')
                ->toArray();

            return response()->json([
                'status' => 'success',
                'buttonIds' => $buttonIds
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching user modules', [
                'user' => $request->workNo,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch user modules'
            ], 500);
        }
    }

    /**
     * Assign modules to user
     */
    public function assignModules(Request $request)
{
    $userId = session('user_id') ?? Auth::id();
    $validator = Validator::make($request->all(), [
        'workNo' => 'required|exists:users,id',
        'roleid' => 'required|exists:tblroles,ID'
    ], [
        'workNo.required' => 'Please select a user',
        'workNo.exists' => 'Selected user does not exist',
        'roleid.required' => 'Please select a role',
        'roleid.exists' => 'Selected role does not exist'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 'error',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        DB::beginTransaction();

        // Fetch button IDs from Rmodules based on selected role
        $buttonIds = Rmodules::where('roleid', $request->roleid)
                            ->pluck('rbuttonid')
                            ->toArray();

        // Check if role has any modules assigned
        if (empty($buttonIds)) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'The selected role has no modules assigned to it.'
            ], 422);
        }

        // Delete existing modules for this user
        Moduleasd::where('WorkNo', $request->workNo)->delete();

        // Insert new modules based on the role's button IDs
        $modulesToInsert = [];
        foreach ($buttonIds as $buttonId) {
            $modulesToInsert[] = [
                'roleid'=> $request->roleid,
                'WorkNo' => $request->workNo,
                'buttonid' => $buttonId
            ];
        }

        Moduleasd::insert($modulesToInsert);

        DB::commit();

        $user = User::find($request->workNo);
        $role = Roles::find($request->roleid);

        /*logAuditTrail(
        $userId,
        'INSERT',
        'user_roles',
        $request->workNo,
        null,
        null,
        [
            'user_id' => $request->workNo,
            'user_name' => $user->name,
            'role_id' => $request->roleid,
            'role_name' => $role->rolename,
            'modules_count' => count($buttonIds),
            'ip_address' => $request->ip()
        ]
    );*/

        return response()->json([
            'status' => 'success',
            'message' => 'Role "' . $role->rolename . '" assigned successfully to ' . $user->name . '!',
            'assigned_count' => count($buttonIds)
        ]);

    } catch (\Exception $e) {
        DB::rollBack();

        Log::error('Role assignment failed', [
            'user' => $request->workNo,
            'role' => $request->roleid,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'status' => 'error',
            'message' => 'Failed to assign role. Please try again.'
        ], 500);
    }
}


    public function saveModules(Request $request)
{
    $userId = session('user_id') ?? Auth::id();
    
    $validator = Validator::make($request->all(), [
        'roleid' => 'required|exists:tblroles,ID',
        'modules' => 'required|array|min:1',
        'modules.*' => 'exists:buttons,ID'
    ], [
        'roleid.required' => 'Please select a Role',
        'roleid.exists' => 'Selected Role does not exist',
        'modules.required' => 'Please select at least one module',
        'modules.min' => 'Please select at least one module',
        'modules.*.exists' => 'Selected module does not exist'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 'error',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        DB::beginTransaction();

        // Get distinct WorkNo (users) who currently have this role assigned
        $usersWithRole = Moduleasd::where('roleid', $request->roleid)
                                  ->distinct()
                                  ->pluck('WorkNo')
                                  ->toArray();

        // Delete existing modules for this role from both tables
        Rmodules::where('roleid', $request->roleid)->delete();
        Moduleasd::where('roleid', $request->roleid)->delete();

        // Insert new modules into Rmodules (role-module relationship)
        $modulesToInsert = [];
        foreach ($request->modules as $buttonId) {
            $modulesToInsert[] = [
                'roleid' => $request->roleid,
                'rbuttonid' => $buttonId
            ];
        }
        Rmodules::insert($modulesToInsert);

        // Insert new modules into Moduleasd for each user who had this role
        $modulesToInsert2 = [];
        if (!empty($usersWithRole)) {
            foreach ($usersWithRole as $workNo) {
                foreach ($request->modules as $buttonId) {
                    $modulesToInsert2[] = [
                        'WorkNo' => $workNo,
                        'roleid' => $request->roleid,
                        'buttonid' => $buttonId
                    ];
                }
            }
            
            if (!empty($modulesToInsert2)) {
                Moduleasd::insert($modulesToInsert2);
            }
        }

        DB::commit();

        $role = Roles::find($request->roleid);

        Log::info('Modules assigned successfully', [
            'role_id' => $request->roleid,
            'role_name' => $role->rolename,
            'modules_count' => count($request->modules),
            'users_affected' => count($usersWithRole)
        ]);

       /* logAuditTrail(
            $userId,
            'UPDATE',
            'Role_modules',
            $request->roleid,
            null,
            null,
            [
                'action' => 'Role Modules Updated',
                'role_id' => $request->roleid,
                'role_name' => $role->rolename,
                'modules_count' => count($request->modules),
                'users_affected' => count($usersWithRole),
                'ip_address' => $request->ip()
            ]
        );*/

        return response()->json([
            'status' => 'success',
            'message' => 'Modules assigned successfully to ' . $role->rolename . '! ' . count($usersWithRole) . ' user(s) updated.',
            'assigned_count' => count($request->modules),
            'users_affected' => count($usersWithRole)
        ]);

    } catch (\Exception $e) {
        DB::rollBack();

        Log::error('Module assignment failed', [
            'role' => $request->roleid,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'status' => 'error',
            'message' => 'Failed to assign modules. Please try again.'
        ], 500);
    }
}

    /**
     * Remove specific module from user
     */
    public function removeModule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'workNo' => 'required|exists:users,id',
            'buttonId' => 'required|exists:buttons,ID'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Moduleasd::where('WorkNo', $request->workNo)
                ->where('buttonid', $request->buttonId)
                ->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Module removed successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Module removal failed', [
                'user' => $request->workNo,
                'button' => $request->buttonId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to remove module'
            ], 500);
        }
    }
}