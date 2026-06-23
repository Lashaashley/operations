<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class LotActivityTracker extends Model
{
    protected $table = 'lot_activity_tracker';
    protected $fillable = ['user_id', 'lot', 'action', 'last_heartbeat', 'started_at', 'ended_at'];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function lotInfo()
    {
        return $this->belongsTo(\App\Models\Masterlot::class, 'lot');
    }
}