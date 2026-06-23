<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Button extends Model
{
    use HasFactory;
    
    protected $table = 'buttons';
    
    protected $primaryKey = 'ID';
    
    public $timestamps = false;
    
    protected $fillable = [
        'Bname',
        'href',
        'icon',
        'isparent',
        'parentid'
    ];

    /**
     * Get child buttons (submenu items)
     */
    public function children()
    {
        return $this->hasMany(Button::class, 'parentid', 'ID')
                    ->orderBy('ID');
    }

    /**
     * Get parent button
     */
    public function parent()
    {
        return $this->belongsTo(Button::class, 'parentid', 'ID');
    }

    /**
     * Check if button is a parent
     */
    public function isParent(): bool
    {
        return strtoupper($this->isparent) === 'YES';
    }
}