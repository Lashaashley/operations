<?php

// app/Models/LineFeedingConfirmation.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class LineFeedingConfirmation extends Model
{
    protected $table = 'line_feeding_confirmations';
    protected $fillable = [
        'lot', 'station',
        'logistics_tech_id', 'logistics_confirmed_at',
        'assembly_tech_id',  'assembly_confirmed_at',
        'completed_at',
    ];
}