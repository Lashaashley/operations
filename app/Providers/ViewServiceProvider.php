<?php

namespace App\Providers;

use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;
use App\Http\View\Composers\MenuComposer;

class ViewServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        
    }

    public function boot(): void
    {
       
        
       

        // Share menu data with sidebar
        View::composer([
            'components.left-sidebar', // ✅ Check this matches your blade file name exactly
            'layouts.app',
        ], MenuComposer::class);
        
       
    }
}