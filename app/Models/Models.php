<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Models extends Model
{
    use HasFactory;

    protected $table = 'models';
    protected $primaryKey = 'id';
    protected $fillable = ['customer', 'mname'];
}
