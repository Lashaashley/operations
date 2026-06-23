<?php
// app/Models/Unit.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $table = 'receiving';
    protected $fillable = ['lot', 'containerno', 'sealno', 'caseno','status', 'comment','timein', 'timeout'];
}