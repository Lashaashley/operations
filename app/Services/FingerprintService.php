<?php
// app/Services/FingerprintService.php

namespace App\Services;

use App\Models\User;
use App\Models\UserAuthenticator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;

class FingerprintService
{
    /**
     * Check if current user has authenticators
     */
    public function userHasAuthenticator(): bool
    {
        $user = Auth::user();
        
        if (!$user) {
            return false;
        }
        
        return UserAuthenticator::where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Get user's authenticators
     */
    public function getUserAuthenticators()
    {
        $user = Auth::user();
        
        if (!$user) {
            return collect();
        }
        
        return UserAuthenticator::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderBy('last_used_at', 'desc')
            ->get();
    }

    /**
     * Get authenticators for a specific user
     */
    public function getAuthenticatorsForUser($userId)
    {
        return UserAuthenticator::where('user_id', $userId)
            ->where('is_active', true)
            ->orderBy('last_used_at', 'desc')
            ->get();
    }

    /**
     * Register a new authenticator
     */
    public function registerAuthenticator(
        int $userId,
        string $credentialId,
        string $publicKey,
        string $signature,
        string $deviceName,
        string $deviceType = 'unknown'
    ): UserAuthenticator {
        return UserAuthenticator::create([
            'user_id' => $userId,
            'credential_id' => $credentialId,
            'public_key' => $publicKey,
            'signature' => $signature,
            'device_name' => $deviceName,
            'device_type' => $deviceType,
            'last_used_at' => now(),
            'is_active' => true,
        ]);
    }

    /**
     * Get user by credential ID
     */
    public function getUserByCredential(string $credentialId): ?User
    {
        $authenticator = UserAuthenticator::where('credential_id', $credentialId)
            ->where('is_active', true)
            ->first();
        
        return $authenticator?->user;
    }

    /**
     * Get authenticator by credential ID
     */
    public function getAuthenticatorByCredential(string $credentialId): ?UserAuthenticator
    {
        return UserAuthenticator::where('credential_id', $credentialId)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Mark authenticator as used
     */
    public function markAuthenticatorAsUsed(string $credentialId): void
    {
        UserAuthenticator::where('credential_id', $credentialId)
            ->where('is_active', true)
            ->update(['last_used_at' => now()]);
    }

    /**
     * Remove an authenticator
     */
    public function removeAuthenticator(int $authenticatorId, int $userId): bool
    {
        $authenticator = UserAuthenticator::where('id', $authenticatorId)
            ->where('user_id', $userId)
            ->first();
        
        if (!$authenticator) {
            return false;
        }
        
        return $authenticator->delete();
    }

    /**
     * Store registration challenge in session
     */
    public function storeRegistrationChallenge(string $challenge, string $deviceName, string $deviceType): void
    {
        Session::put('fingerprint_registration_challenge', $challenge);
        Session::put('fingerprint_device_name', $deviceName);
        Session::put('fingerprint_device_type', $deviceType);
    }

    /**
     * Get registration challenge from session
     */
    public function getRegistrationChallenge(): ?array
    {
        $challenge = Session::get('fingerprint_registration_challenge');
        $deviceName = Session::get('fingerprint_device_name');
        $deviceType = Session::get('fingerprint_device_type');

        Session::forget([
            'fingerprint_registration_challenge',
            'fingerprint_device_name',
            'fingerprint_device_type',
        ]);

        if (!$challenge) {
            return null;
        }

        return [
            'challenge' => $challenge,
            'device_name' => $deviceName ?? 'Unknown Device',
            'device_type' => $deviceType ?? 'unknown',
        ];
    }

    /**
     * Set authentication challenge in session
     */
    public function setAuthenticationChallenge(string $challenge): void
    {
        Session::put('fingerprint_auth_challenge', $challenge);
    }

    /**
     * Get authentication challenge from session
     */
    public function getAuthenticationChallenge(): ?string
    {
        $challenge = Session::get('fingerprint_auth_challenge');
        Session::forget('fingerprint_auth_challenge');
        
        return $challenge;
    }

    /**
     * Check if a credential is already registered
     */
    public function credentialExists(string $credentialId): bool
    {
        return UserAuthenticator::where('credential_id', $credentialId)->exists();
    }

    /**
     * Deactivate an authenticator (soft delete alternative)
     */
    public function deactivateAuthenticator(int $authenticatorId, int $userId): bool
    {
        $authenticator = UserAuthenticator::where('id', $authenticatorId)
            ->where('user_id', $userId)
            ->first();
        
        if (!$authenticator) {
            return false;
        }
        
        $authenticator->is_active = false;
        return $authenticator->save();
    }

    /**
     * Reactivate an authenticator
     */
    public function reactivateAuthenticator(int $authenticatorId, int $userId): bool
    {
        $authenticator = UserAuthenticator::where('id', $authenticatorId)
            ->where('user_id', $userId)
            ->first();
        
        if (!$authenticator) {
            return false;
        }
        
        $authenticator->is_active = true;
        return $authenticator->save();
    }

    /**
     * Get count of authenticators for a user
     */
    public function getAuthenticatorCount(int $userId): int
    {
        return UserAuthenticator::where('user_id', $userId)
            ->where('is_active', true)
            ->count();
    }

    /**
     * Get the most recently used authenticator for a user
     */
    public function getMostRecentAuthenticator(int $userId): ?UserAuthenticator
    {
        return UserAuthenticator::where('user_id', $userId)
            ->where('is_active', true)
            ->orderBy('last_used_at', 'desc')
            ->first();
    }
}