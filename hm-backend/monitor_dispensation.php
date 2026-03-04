<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== REAL-TIME MONITORING ===\n";
echo "Watching for new dispensations...\n\n";

$lastCount = \App\Models\PharmacyDispensation::count();
echo "Current dispensation count: $lastCount\n";
echo "Waiting for new dispensation (Ctrl+C to stop)...\n\n";

while (true) {
    $currentCount = \App\Models\PharmacyDispensation::count();
    
    if ($currentCount > $lastCount) {
        $newDisp = \App\Models\PharmacyDispensation::orderBy('id', 'desc')->first();
        
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "NEW DISPENSATION DETECTED!\n";
        echo str_repeat("=", 60) . "\n";
        echo "Dispensation ID: {$newDisp->id}\n";
        echo "Prescription ID: {$newDisp->prescription_id}\n";
        echo "Patient ID: {$newDisp->patient_id}\n";
        echo "Total Amount: \${$newDisp->total_amount}\n";
        
        // Find the prescription
        $prescription = \App\Models\Prescription::find($newDisp->prescription_id);
        if ($prescription) {
            echo "\n✓ Found Prescription #{$prescription->id}\n";
            echo "  Treatment ID: {$prescription->treatment_id}\n";
            echo "  Patient ID: {$prescription->patient_id}\n";
            
            // Find the bill
            $bill = \App\Models\Bill::where('treatment_id', $prescription->treatment_id)->first();
            if ($bill) {
                echo "\n✓ Found Bill #{$bill->id}\n";
                echo "  Total: \${$bill->total_amount}\n";
                
                // Check for pharmacy items in bill
                $pharmacyItems = \App\Models\BillItem::where('bill_id', $bill->id)
                    ->where('pharmacy_dispensation_id', $newDisp->id)
                    ->get();
                    
                echo "\n" . ($pharmacyItems->count() > 0 ? "✓" : "✗") . " Pharmacy bill items: {$pharmacyItems->count()}\n";
                
                if ($pharmacyItems->count() > 0) {
                    foreach ($pharmacyItems as $item) {
                        echo "  - {$item->description}: \${$item->amount} x {$item->quantity}\n";
                    }
                } else {
                    echo "  ⚠️  NO PHARMACY ITEMS ADDED TO BILL!\n";
                    echo "  This means the Observer did NOT trigger or failed!\n";
                }
            } else {
                echo "\n✗ NO BILL FOUND for treatment #{$prescription->treatment_id}!\n";
            }
        } else {
            echo "\n✗ NO PRESCRIPTION FOUND with ID {$newDisp->prescription_id}!\n";
            echo "  This is the problem - prescription_id doesn't link to Prescription table!\n";
        }
        
        echo "\n" . str_repeat("=", 60) . "\n\n";
        
        $lastCount = $currentCount;
    }
    
    sleep(1);
}
