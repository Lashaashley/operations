<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Roles extends Model
{
    use HasFactory;

    protected $table = 'tblroles';
    protected $primaryKey = 'ID';
    protected $fillable = ['rolename', 'rdesc'];
    
    /**
     * Get the modules associated with this role
     */
    public function modules()
    {
        return $this->hasMany(Rmodules::class, 'roleid', 'ID');
    }
    
    /**
     * Get users who have this role (by matching button IDs)
     */
    public function users()
    {
        return User::whereHas('moduleAssignments', function($query) {
            $buttonIds = $this->modules()->pluck('rbuttonid')->toArray();
            $query->whereIn('buttonid', $buttonIds);
        })->distinct()->get();
    }
}