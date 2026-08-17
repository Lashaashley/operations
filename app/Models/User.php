<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Spatie\LaravelPasskeys\Models\Concerns\HasPasskeys;
use Spatie\LaravelPasskeys\Models\Concerns\InteractsWithPasskeys;

#[Fillable([
    'name',
    'email',
    'role',
    'password',
    'profile_photo',
    'allowedprol',
    'approvelvl',
    'password_changed_at',
    'password_expires_at',
    'must_change_password',
    'failed_login_attempts',
    'locked_until',
    'google2fa_secret',
    'MFA',
    'Status',
])]
#[Hidden(['password', 'remember_token', 'google2fa_secret',])]
class User extends Authenticatable implements HasPasskeys
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, InteractsWithPasskeys;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
             'email_verified_at' => 'datetime',
    'password' => 'hashed', // line 37
    'password_changed_at' => 'datetime',
    'password_expires_at' => 'datetime',
    'must_change_password' => 'boolean',
    'locked_until' => 'datetime',
        ];
    }
    
/**
 * Check if password has been used before
 */
public function hasUsedPassword(string $newPassword, int $historyCount = 5): bool
{
    $recentPasswords = $this->passwordHistories()
        ->latest('created_at')
        ->take($historyCount)
        ->get();
    
    foreach ($recentPasswords as $history) {
        if (Hash::check($newPassword, $history->password)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Save password to history
 */
public function savePasswordHistory(string $hashedPassword): void
{
    $this->passwordHistories()->create([
        'password' => $hashedPassword,
        'created_at' => now(),
    ]);
    
    // Keep only last 5 passwords (configurable)
    $keepCount = config('auth.password_history_count', 5);
    $oldPasswords = $this->passwordHistories()
        ->oldest('created_at')
        ->skip($keepCount)
        ->take(1000)
        ->get();
    
    foreach ($oldPasswords as $old) {
        $old->delete();
    }
}

/**
 * Check if password has expired
 */
public function isPasswordExpired(): bool
{
    if (!$this->password_expires_at) {
        return false;
    }
    
    return now()->greaterThan($this->password_expires_at);
}

/**
 * Check if account is locked
 */
public function isLocked(): bool
{
    if (!$this->locked_until) {
        return false;
    }
    
    return now()->lessThan($this->locked_until);
}

/**
 * Update password with all tracking
 */
public function updatePassword(string $newPassword, int $expiryDays = 90): void
{
    $hashedPassword = Hash::make($newPassword);
    
    // Save to history
    $this->savePasswordHistory($hashedPassword);
    
    // Update user
    $this->password = $hashedPassword;
    $this->password_changed_at = now();
    $this->password_expires_at = now()->addDays($expiryDays);
    $this->must_change_password = false;
    $this->failed_login_attempts = 0;
    $this->locked_until = null;
    $this->save();
}
// Add this to your User model
public function moduleAssignments()
{
    return $this->hasMany(Moduleasd::class, 'WorkNo', 'id');
}

 
}
