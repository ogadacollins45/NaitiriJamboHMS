<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;



class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (env('APP_ENV') === 'production') {
        URL::forceScheme('https');
    }
        
        // Observer Registrations
        
        // DISABLED: PharmacyDispensationObserver causes double billing
        // Prescriptions are already handled by PrescriptionObserver below
        // \App\Models\PharmacyDispensation::observe(\App\Observers\PharmacyDispensationObserver::class);
        
        \App\Models\LabRequest::observe(\App\Observers\LabRequestObserver::class);
        
        // SIMPLE PHARMACY: Prescription observer triggers billing when dispensed
        \App\Models\Prescription::observe(\App\Observers\PrescriptionObserver::class);
    }
}
