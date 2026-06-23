<?php

// app/Models/LotTracking.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Lottracking extends Model
{
    protected $table = 'lottracking';
    protected $fillable = ['lot', 'status', 'starttime', 'endtime'];

    public function statusInfo()
    {
        return $this->belongsTo(Status::class, 'status');
    }
}