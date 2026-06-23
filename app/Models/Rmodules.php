<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rmodules extends Model
{
    use HasFactory;
    
    protected $table = 'rmodules';
    
    protected $primaryKey = 'ID';
    
    public $timestamps = false;
    
    protected $fillable = [
        'roleid',
        'rbuttonid'
    ];

    /**
     * Get the button associated with this module
     */
    public function button()
    {
        return $this->belongsTo(Button::class, 'rbuttonid', 'ID');
    }

    /**
     * Get the user associated with this module
     */
    public function role()
    {
        return $this->belongsTo(Roles::class, 'roleid', 'id');
    }
}