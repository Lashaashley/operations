<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Structure extends Model
{
    use HasFactory;
    
    protected $table = 'cstructure';
    protected $primaryKey = 'ID';
    protected $fillable = ['name', 'motto', 'logo', 'pobox', 'email', 'physaddres'];
    
    // Accessor for logo URL
    public function getLogoUrlAttribute()
    {
        if ($this->logo) {
            return asset('storage/' . $this->logo);
        }
        return null;
    }
}