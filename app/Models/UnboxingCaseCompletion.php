<?php

// app/Models/UnboxingCaseCompletion.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class UnboxingCaseCompletion extends Model
{
    protected $table = 'unboxing_case_completion';
    protected $fillable = ['lot', 'boxcase', 'completed_by', 'completed_at'];
}