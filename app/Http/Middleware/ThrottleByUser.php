<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ThrottleByUser
{
    /**
     * Handle an incoming request.
     * 
     * Limits: 
     * - 10 requests per minute for imports
     * - 30 requests per minute for reports
     * - 5 approval actions per minute
     */
    public function handle(Request $request, Closure $next, $maxAttempts = 10, $decayMinutes = 1)
    {
        $user = Auth::user();
        
        if (!$user) {
            return $next($request);
        }

        $key = $this->resolveRequestKey($request, $user);
        $attempts = Cache::get($key, 0);

        if ($attempts >= $maxAttempts) {
            Log::warning("Rate limit exceeded", [
                'user_id' => $user->id,
                'route' => $request->path(),
                'attempts' => $attempts,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please try again later.',
                'retry_after' => $decayMinutes * 60
            ], 429);
        }

        Cache::put($key, $attempts + 1, now()->addMinutes($decayMinutes));

        return $next($request);
    }

    protected function resolveRequestKey(Request $request, $user)
    {
        return 'throttle:' . $user->id . ':' . $request->path();
    }
}