<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModuleAsd extends Model
{
    use HasFactory;
    
    protected $table = 'moduleasd';
    
    protected $primaryKey = 'ID';
    
    public $timestamps = false;
    
    protected $fillable = [
        'WorkNo',
        'buttonid',
        'roleid'
    ];

    /**
     * Get the button associated with this module
     */
    public function button()
    {
        return $this->belongsTo(Button::class, 'buttonid', 'ID');
    }

    /**
     * Get the user associated with this module
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'WorkNo', 'id');
    }
}