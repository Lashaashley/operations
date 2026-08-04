<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Parts extends Model
{
    use HasFactory;

    protected $table = 'parts';
    protected $primaryKey = 'id';
    protected $fillable = ['partnum', 'partdesc', 'customer', 'model','lot', 'quantity', 'boxcase', 'station'];
}
