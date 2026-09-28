<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RobbingRequest extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'robbing_requests';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'lot_affected',
        'lot_robbed',
        'source_issue_id',
        'status',
        'requested_by',
        'requested_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'lot_affected' => 'integer',
        'lot_robbed' => 'integer',
        'source_issue_id' => 'integer',
        'requested_by' => 'integer',
        'requested_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The status constants for the robbing request.
     */
    const STATUS_PENDING = 'Pending';
    const STATUS_APPROVED = 'Approved';
    const STATUS_REJECTED = 'Rejected';
    const STATUS_COMPLETED = 'Completed';

    /**
     * Get the status badge color for the request.
     */
    public function getStatusBadgeColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'warning',
            self::STATUS_APPROVED => 'success',
            self::STATUS_REJECTED => 'danger',
            self::STATUS_COMPLETED => 'info',
            default => 'secondary',
        };
    }

    /**
     * Get the status label with proper formatting.
     */
    public function getStatusLabelAttribute(): string
    {
        return str_replace('_', ' ', $this->status);
    }

    /**
     * Get the parts associated with this robbing request.
     */
   /* public function parts(): HasMany
    {
        return $this->hasMany(RobbingRequestPart::class, 'robbing_request_id');
    }*/

    /**
     * Get the user who requested this robbing.
     */
   /* public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }*/

    /**
     * Get the affected lot.
     */
  /*  public function affectedLot(): BelongsTo
    {
        return $this->belongsTo(Lot::class, 'lot_affected');
    }*/

    /**
     * Get the robbed lot.
     */
   /* public function robbedLot(): BelongsTo
    {
        return $this->belongsTo(Lot::class, 'lot_robbed');
    } */

    /**
     * Get the source issue.
     */
  /*  public function sourceIssue(): BelongsTo
    {
        return $this->belongsTo(Issue::class, 'source_issue_id');
    }*/

    /**
     * Scope a query to only include pending requests.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope a query to only include approved requests.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Scope a query to only include completed requests.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope a query to only include rejected requests.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    /**
     * Check if the request is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if the request is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    /**
     * Check if the request is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if the request is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Approve the request.
     */
    public function approve(): bool
    {
        return $this->update(['status' => self::STATUS_APPROVED]);
    }

    /**
     * Reject the request.
     */
    public function reject(): bool
    {
        return $this->update(['status' => self::STATUS_REJECTED]);
    }

    /**
     * Complete the request.
     */
    public function complete(): bool
    {
        return $this->update(['status' => self::STATUS_COMPLETED]);
    }

    /**
     * Get the total quantity of parts in this request.
     */
    public function getTotalPartsAttribute(): int
    {
        return $this->parts()->sum('quantity');
    }

    /**
     * Get the total number of distinct parts in this request.
     */
    public function getDistinctPartsCountAttribute(): int
    {
        return $this->parts()->count();
    }
}