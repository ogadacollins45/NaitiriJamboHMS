<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CHECKING SYSTEM ===\n\n";

// Check latest prescription
$prescription = \App\Models\Prescription::orderBy('id', 'desc')->first();
if ($prescription) {
    echo "Latest Prescription:\n";
    echo "  ID: {$prescription->id}\n";
    echo "  Treatment ID: {$prescription->treatment_id}\n";
    echo "  Status: {$prescription->pharmacy_status}\n";
    echo "  Dispensed at: " . ($prescription->dispensed_at ?? 'NULL') . "\n\n";
}

// Check if pending prescriptions exist
$pending = \App\Models\Prescription::where('pharmacy_status', 'sent_to_pharmacy')
    ->whereNull('dispensed_at')
    ->count();
echo "Pending prescriptions (sent to pharmacy, not dispensed): {$pending}\n\n";

// Check bills
$bill = \App\Models\Bill::orderBy('id', 'desc')->first();
if ($bill) {
    echo "Latest Bill:\n";
    echo "  ID: {$bill->id}\n";
    echo "  Treatment ID: {$bill->treatment_id}\n";
    echo "  Total: {$bill->total_amount}\n";
    
    $items = $bill->items;
    echo "  Items: {$items->count()}\n";
    foreach ($items as $item) {
        echo "    - {$item->category}: {$item->description} = \${$item->subtotal}\n";
    }
}
