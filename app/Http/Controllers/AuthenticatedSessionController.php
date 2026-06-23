<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): View
    {
        return view('auth.login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(Request $request): RedirectResponse
    {
        // Add validation for email and password fields
        $validatedData = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ], [
            'email.required' => 'The email field is required.',
            'email.email' => 'Please enter a valid email address.',
            'password.required' => 'The password field is required.'
        ]);

        // Attempt to authenticate the user
        $remember = $request->has('remember'); // true if checkbox is checked

        if (Auth::attempt(['email' => $request->email, 'password' => $request->password], $remember)) {
            // Authentication passed
            return redirect()->intended(route('dashboard')); // Redirect to the intended page or dashboard
        } else {
            // Authentication failed
            return back()->withErrors([
                'email' => 'These credentials do not match our records.',
            ]);
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
{
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    // Redirect to login page
    return redirect()->route('login');
}

}
