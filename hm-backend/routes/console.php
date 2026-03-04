<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use App\Services\DatabaseManagementService;

Schedule::call(function () {
    (new DatabaseManagementService())->createBackup();
})->dailyAt('00:00')->name('daily_backup');

