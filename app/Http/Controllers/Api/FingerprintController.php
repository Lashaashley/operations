<?php
// app/Http/Controllers/Api/FingerprintController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserAuthenticator;
use App\Services\FingerprintService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelPasskeys\Actions\GeneratePasskeyRegisterOptionsAction;
use Spatie\LaravelPasskeys\Actions\StorePasskeyAction;
use Spatie\LaravelPasskeys\Actions\GeneratePasskeyAuthenticationOptionsAction;
use Spatie\LaravelPasskeys\Actions\FindPasskeyToAuthenticateAction;
use Illuminate\Support\Str;

class FingerprintController extends Controller
{
    protected $rpId;
    protected $rpName;
    protected $fingerprintService;

    public function __construct(FingerprintService $fingerprintService)
    {
        $this->rpId = config('app.domain') ?? request()->getHost();
        $this->rpName = config('app.name') ?? 'OPP System';
        $this->fingerprintService = $fingerprintService;
    }

    /**
     * Check if user has registered authenticators
     */
    public function check(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'has_authenticator' => false,
                    'authenticators' => [],
                ]);
            }
            
            $authenticators = $this->fingerprintService->getUserAuthenticators();
            
            return response()->json([
                'has_authenticator' => $this->fingerprintService->userHasAuthenticator(),
                'authenticators' => $authenticators->map(function($auth) {
                    return [
                        'id' => $auth->credential_id,
                        'credential_id' => $auth->credential_id,
                        'device_name' => $auth->device_name,
                        'device_type' => $auth->device_type,
                        'public_key' => $auth->public_key,
                        'last_used_at' => $auth->last_used_at?->toIso8601String(),
                        'created_at' => $auth->created_at->toIso8601String(),
                    ];
                }),
            ]);
        } catch (\Exception $e) {
            Log::error('Check authenticators error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load authenticators: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get registration options for a specific device
     */

 public function registerOptions(Request $request)
{
    /** @var User $user */
    $user = Auth::user();

    if (!$user) {
        return response()->json(['success' => false, 'message' => 'Not authenticated'], 401);
    }

    $options = app(GeneratePasskeyRegisterOptionsAction::class)->execute($user);

    Log::info('Passkey register options generated', ['options' => $options]);

    // $options is already a JSON string from the package — don't re-wrap it in response()->json()
    return response($options, 200)->header('Content-Type', 'application/json');
}

    /**
     * Verify registration for a new device
     */

   public function registerVerify(Request $request)
{
    $request->validate([
        'options' => 'required|json',
        'passkey' => 'required|json',
        'device_name' => 'nullable|string|max:255',
    ]);

    /** @var User $user */
    $user = Auth::user();

    if (!$user) {
        return response()->json(['success' => false, 'message' => 'Not authenticated'], 401);
    }

    try {
        app(StorePasskeyAction::class)->execute(
            $user,
            $request->input('passkey'),
            $request->input('options'),
            $request->getHost(),
            ['name' => $request->input('device_name', 'Unknown Device')],
        );
    } catch (\Throwable $e) {
        Log::error('Passkey registration failed', [
            'message' => $e->getMessage(),
            'previous' => $e->getPrevious()?->getMessage(),
            'previous_class' => $e->getPrevious() ? get_class($e->getPrevious()) : null,
            'trace' => $e->getTraceAsString(),
        ]);
        return response()->json(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()], 500);
    }

    return response()->json(['success' => true, 'message' => 'Fingerprint registered successfully']);
}
    /**
     * Get challenge for authentication
     */
    /**
 * Get challenge for authentication
 */
public function getChallenge(Request $request)
{
    $options = app(GeneratePasskeyAuthenticationOptionsAction::class)->execute();

    // Already a JSON string — don't re-wrap with response()->json()
    return response($options, 200)->header('Content-Type', 'application/json');
}
public function verifyAssertion(Request $request)
{
    $request->validate([
        'options' => 'required|json',
        'passkey' => 'required|json',
    ]);

    $passkey = app(FindPasskeyToAuthenticateAction::class)->execute(
        $request->input('passkey'),
        $request->input('options'),
    );

    if (!$passkey) {
        Log::warning('Passkey authentication failed — no matching passkey or verification failed');
        return response()->json([
            'success' => false,
            'message' => 'Fingerprint authentication failed.',
        ], 401);
    }

    $user = $passkey->authenticatable;

    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    return response()->json([
        'success' => true,
        'message' => 'Fingerprint verified successfully',
        'redirect' => url('/dashboard'),
    ]);
}

    /**
     * Verify authentication assertion
     */
    

    /**
     * Remove a specific authenticator
     */
    public function removeAuthenticator(Request $request, $id)
{
    /** @var User $user */
    $user = Auth::user();

    // Scoped to the logged-in user's own passkeys — prevents deleting someone else's by guessing an id
    $passkey = $user->passkeys()->where('id', $id)->first();

    if (!$passkey) {
        return response()->json(['success' => false, 'message' => 'Authenticator not found'], 404);
    }

    $passkey->delete();

    return response()->json(['success' => true, 'message' => 'Authenticator removed successfully']);
}

    /**
     * Get all authenticators for the authenticated user
     */
    public function getAuthenticators(Request $request)
{
    /** @var User $user */
    $user = Auth::user();

    if (!$user) {
        return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
    }

    $passkeys = $user->passkeys()->orderByDesc('last_used_at')->get();

    return response()->json([
        'success' => true,
        'authenticators' => $passkeys->map(function ($passkey) {
            return [
                'id' => $passkey->id,
                'device_name' => $passkey->name,
                'last_used_at' => $passkey->last_used_at?->toIso8601String(),
                'created_at' => $passkey->created_at->toIso8601String(),
            ];
        }),
    ]);
}
}