<?php

namespace App\Http\View\Composers;

use Illuminate\View\View;
use App\Services\MenuService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class MenuComposer
{
    protected $menuService;

    public function __construct(MenuService $menuService)
    {
        $this->menuService = $menuService;
        Log::info('MenuComposer: Constructor called');
    }

    /**
     * Bind data to the view.
     */
    public function compose(View $view): void
    {
        Log::info('MenuComposer: compose() method called', [
            'view_name' => $view->name(),
            'auth_check' => Auth::check(),
            'auth_id' => Auth::id(),
            'session_user_id' => session('user_id')
        ]);

        // Only load menu if user is authenticated
        if (!Auth::check()) {
            Log::warning('MenuComposer: User not authenticated');
            $view->with('menuItems', []);
            return;
        }

        try {
            Log::info('MenuComposer: Calling MenuService->getUserMenu()');
            
            $menuItems = $this->menuService->getUserMenu();
            
            Log::info('MenuComposer: Menu loaded', [
                'user_id' => session('user_id'),
                'menu_count' => count($menuItems),
                'menu_items' => $menuItems
            ]);
            
            $view->with('menuItems', $menuItems);
        } catch (\Exception $e) {
            Log::error('MenuComposer Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            $view->with('menuItems', []);
        }
    }
}