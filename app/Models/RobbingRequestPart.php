<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RobbingRequestPart extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'robbing_request_parts';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'robbing_request_id',
        'part_id',
        'quantity',
        'reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'robbing_request_id' => 'integer',
        'part_id' => 'integer',
        'quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the robbing request that this part belongs to.
     */
    public function robbingRequest(): BelongsTo
    {
        return $this->belongsTo(RobbingRequest::class, 'robbing_request_id');
    }

    /**
     * Get the part associated with this request part.
     */
    public function part(): BelongsTo
    {
        return $this->belongsTo(Parts::class, 'part_id');
    }

    /**
     * Scope a query to include parts for a specific request.
     */
    public function scopeForRequest($query, int $requestId)
    {
        return $query->where('robbing_request_id', $requestId);
    }

    /**
     * Scope a query to include parts with quantity above a threshold.
     */
    public function scopeQuantityGreaterThan($query, int $threshold)
    {
        return $query->where('quantity', '>', $threshold);
    }

    /**
     * Get the formatted quantity with proper unit if available.
     */
    public function getFormattedQuantityAttribute(): string
    {
        return number_format($this->quantity) . ' units';
    }

    /**
     * Check if this part has a reason provided.
     */
    public function hasReason(): bool
    {
        return !empty($this->reason);
    }

    /**
     * Get a truncated version of the reason if it's too long.
     */
    public function getTruncatedReasonAttribute(int $length = 50): string
    {
        if (!$this->reason) {
            return '';
        }

        return strlen($this->reason) > $length
            ? substr($this->reason, 0, $length) . '...'
            : $this->reason;
    }
}