<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== PRESCRIPTION STATUS CHECK ===\n\n";

// Check all prescriptions
$prescriptions = App\Models\Prescription::orderBy('id', 'desc')->limit(10)->get();

echo "Last 10 prescriptions:\n";
foreach ($prescriptions as $p) {
    echo "ID: {$p->id} | Treatment: {$p->treatment_id} | Status: {$p->pharmacy_status}\n";
}

echo "\n=== DISPENSED PRESCRIPTIONS ===\n\n";

$dispensed = App\Models\Prescription::where('pharmacy_status', 'dispensed')
    ->with(['items'])
    ->get();

echo "Total dispensed: {$dispensed->count()}\n\n";

foreach ($dispensed as $p) {
    echo "Prescription #{$p->id} (Treatment #{$p->treatment_id}):\n";
    foreach ($p->items as $item) {
        echo "  - {$item->drug_name_text}: Qty={$item->mapped_quantity}, Price={$item->unit_price}, Total={$item->subtotal}\n";
    }
}
