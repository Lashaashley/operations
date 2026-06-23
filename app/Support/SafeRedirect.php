<?php

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

namespace App\Support;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Log;

class SafeRedirect
{
    /**
     * The only URL paths that are valid post-login destinations.
     *
     * Use relative paths (no scheme/host). The helper enforces that the
     * final destination is always on the same host as the application.
     *
     * Add routes here as the application grows. Do NOT add wildcard entries.
     */
    protected static array $allowedPaths = [
        '/dashboard',
    ];

    /**
     * The fallback destination used when the requested URL is not on the
     * allowed list or is not a same-host URL.
     */
    protected static string $fallback = '/dashboard';

    /**
     * Validate a redirect destination and return a safe URL.
     *
     * Accepts either:
     *   - A full URL (must match the application's host exactly)
     *   - A relative path (must be on the allowed list)
     *
     * Any other input returns the fallback URL.
     *
     * @param  string|null  $destination
     * @return string  A fully-qualified safe URL
     */
    public static function validate(?string $destination): string
{
    if (empty($destination)) {
        return self::fallbackUrl();
    }

    $parsed = parse_url($destination);

    if (isset($parsed['host'])) {
        $appHost  = parse_url(config('app.url'), PHP_URL_HOST);
        $destHost = strtolower($parsed['host']);

        if ($destHost !== strtolower($appHost)) {
            Log::warning('SafeRedirect: blocked external redirect', [
                'destination' => $destination,
                'reason'      => 'host_mismatch',
            ]);
            return self::fallbackUrl();
        }

        if (isset($parsed['scheme']) && $parsed['scheme'] !== 'https') {
            Log::warning('SafeRedirect: blocked non-https redirect', [
                'destination' => $destination,
                'reason'      => 'scheme_not_https',
            ]);
            return self::fallbackUrl();
        }

        $path = $parsed['path'] ?? '/';
    } else {
        $path = $parsed['path'] ?? '/';
    }

    $path = '/' . ltrim($path, '/');
    $path = self::normalisePath($path);

    if (!self::isAllowedPath($path)) {
        Log::info('SafeRedirect: path not on allowlist, using fallback', [
            'requested_path' => $path,
        ]);
        return self::fallbackUrl();
    }

    // ✅ rtrim ensures no double slash regardless of APP_URL value
    return rtrim(config('app.url'), '/') . $path;
}
    /**
     * Validate a destination from Laravel's session-based intended URL.
     *
     * This is the safe replacement for redirect()->intended().
     * It reads the intended URL from the session but validates it before use.
     */
    public static function intended(string $default = '/dashboard'): string
    {
        $intended = session()->pull('url.intended');
        return self::validate($intended ?? $default);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    protected static function fallbackUrl(): string
{
    return rtrim(config('app.url'), '/') . self::$fallback;
}

    protected static function isAllowedPath(string $path): bool
    {
        foreach (self::$allowedPaths as $allowed) {
            // Exact match or prefix match (e.g. /dashboard/payroll/123)
            if ($path === $allowed || str_starts_with($path, $allowed . '/')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Normalise a URL path to prevent traversal attacks.
     * e.g. /foo/../bar becomes /bar
     */
    protected static function normalisePath(string $path): string
    {
        $parts  = explode('/', $path);
        $result = [];

        foreach ($parts as $part) {
            if ($part === '..') {
                array_pop($result);
            } elseif ($part !== '.' && $part !== '') {
                $result[] = $part;
            }
        }

        return '/' . implode('/', $result);
    }
}