<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Storagezones extends Model
{
     use HasFactory;

    protected $table = 'storagezones';
    protected $primaryKey = 'id';
    protected $fillable = ['storagename'];
}
