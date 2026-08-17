<?php
// app/Models/Unit.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Receiving extends Model
{
    protected $table = 'receiving';
    protected $fillable = ['lot', 'containerno', 'sealno', 'caseno','status','zone', 'comment','timein', 'timeout'];
}