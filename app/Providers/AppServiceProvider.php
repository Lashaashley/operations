<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\FingerprintService::class, function ($app) {
        return new \App\Services\FingerprintService();
    });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Blade::component('custom-admin-layout', \App\View\Components\CustomAdminLayout::class);
    }
}
