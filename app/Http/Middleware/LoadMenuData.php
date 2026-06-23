<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Log;
use App\Services\MenuService;
use Symfony\Component\HttpFoundation\Response;

class LoadMenuData
{
    protected $menuService;

    public function __construct(MenuService $menuService)
    {
        $this->menuService = $menuService;
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            
            
            $menuItems = $this->menuService->getUserMenu();
            
           
            
            View::share('menuItems', $menuItems);
        }
        
        return $next($request);
    }
}