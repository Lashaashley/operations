<?php
// app/Models/UnboxingRecord.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class UnboxingRecord extends Model
{
    protected $table = 'unboxing_records';
    protected $fillable = [
        'part_id', 'lot', 'boxcase', 'required_qty',
        'counted_qty', 'status', 'comment', 'checked_by', 'checked_at'
    ];
}