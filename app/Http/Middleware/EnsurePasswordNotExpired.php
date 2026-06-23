<?php

namespace App\Http\Middleware;

use Closure;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class EnsurePasswordNotExpired
{
    public function handle($request, Closure $next)
    {
        if (Auth::check() && Auth::user()->isPasswordExpired()) {
            session([
                'password_expired_user_id' => Auth::id(),
                'password_expired_email' => Auth::user()->email,
            ]);

            Auth::logout();

            return redirect()->route('password.expired');
        }

        return $next($request);
    }
}

