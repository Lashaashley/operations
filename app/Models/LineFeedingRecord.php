<?php
// app/Models/LineFeedingRecord.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class LineFeedingRecord extends Model
{
    protected $table = 'line_feeding_records';
    protected $fillable = ['part_id', 'lot', 'station', 'status', 'comment', 'checked_by', 'checked_at'];
}