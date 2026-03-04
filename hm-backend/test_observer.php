<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== TESTING PHARMACY BILLING ===\n\n";

// Find prescription #23
$prescription = \App\Models\Prescription::find(23);

if ($prescription) {
    echo "Found Prescription #23\n";
    echo "Status: {$prescription->pharmacy_status}\n";
    echo "Dispensed at (before): " . ($prescription->dispensed_at ?? 'NULL') . "\n\n";
    
    // Manually set dispensed_at to trigger observer
    echo "Setting dispensed_at to now()...\n";
    $prescription->update(['dispensed_at' => now(), 'dispensed_by_staff_id' => 1]);
    
    echo "Done! Observer should have triggered.\n\n";
    
    // Check bill
    $bill = \App\Models\Bill::where('treatment_id', $prescription->treatment_id)->first();
    if ($bill) {
        echo "Bill #{$bill->id} for Treatment #{$bill->treatment_id}:\n";
        echo "Total: \${$bill->total_amount}\n";
        echo "Items ({$bill->items->count()}):\n";
        foreach ($bill->items as $item) {
            echo "  - {$item->category}: {$item->description} = \${$item->subtotal}\n";
        }
    }
} else {
    echo "Prescription #23 not found\n";
}
