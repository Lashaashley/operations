<?php
// app/Models/UserAuthenticator.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAuthenticator extends Model
{
    use HasFactory;

    protected $table = 'user_authenticators';

    protected $fillable = [
        'user_id',
        'credential_id',
        'public_key',
        'signature',
        'device_name',
        'device_type',
        'last_used_at',
        'is_active',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Get the user that owns the authenticator
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark this authenticator as used
     */
    public function markAsUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Scope a query to only include active authenticators
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include authenticators by device type
     */
    public function scopeDeviceType($query, $type)
    {
        return $query->where('device_type', $type);
    }
}