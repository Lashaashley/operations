<?php
// app/Models/Unit.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $table = 'units';
    protected $fillable = ['lot', 'chassis_number', 'engine_number'];
}