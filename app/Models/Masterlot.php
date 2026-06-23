<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Masterlot extends Model
{
    use HasFactory;

    protected $table = 'masterlot';
    protected $primaryKey = 'id';
    protected $fillable = ['customer', 'lotnum', 'unitsno', 'model'];

    public function trackingHistory()
{
    return $this->hasMany(LotTracking::class, 'lot');
}

public function currentTracking()
{
    // The one with no endtime = current active status
    return $this->hasOne(LotTracking::class, 'lot')->whereNull('endtime')->latest('starttime');
}
public function units()
{
    return $this->hasMany(Unit::class, 'lot');
}
}


