<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== PHARMACY DISPENSATION MONITORING ===\n\n";

// Check if PharmacyDispensation observer is registered
echo "Checking observers registration...\n";
echo "- PharmacyDispensationObserver: " . (class_exists('App\Observers\PharmacyDispensationObserver') ? "✓ Exists" : "✗ Missing") . "\n";
echo "- LabRequestObserver: " . (class_exists('App\Observers\LabRequestObserver') ? "✓ Exists" : "✗ Missing") . "\n\n";

echo "Ready to monitor. Please proceed with:\n";
echo "1. Add a prescription for a patient\n";
echo "2. Go to pharmacy and dispense the prescription\n";
echo "3. I will track all database changes\n\n";

echo "Watching for new PharmacyDispensations...\n";
echo "Current count: " . \App\Models\PharmacyDispensation::count() . "\n\n";

// Monitor prescription and dispensation creation
$lastPrescriptionCount = \App\Models\Prescription::count();
$lastDispensationCount = \App\Models\PharmacyDispensation::count();

echo "Starting monitoring loop (press Ctrl+C to stop)...\n\n";

while (true) {
    $currentPrescriptionCount = \App\Models\Prescription::count();
    $currentDispensationCount = \App\Models\PharmacyDispensation::count();
    
    if ($currentPrescriptionCount > $lastPrescriptionCount) {
        $newPrescriptions = \App\Models\Prescription::orderBy('id', 'desc')->limit($currentPrescriptionCount - $lastPrescriptionCount)->get();
        foreach ($newPrescriptions as $pres) {
            echo "[" . date('H:i:s') . "] ✓ NEW PRESCRIPTION #$pres->id\n";
            echo "  Treatment ID: $pres->treatment_id\n";
            echo "  Patient ID: $pres->patient_id\n";
            $bill = \App\Models\Bill::where('treatment_id', $pres->treatment_id)->first();
            echo "  Bill ID: " . ($bill ? $bill->id : "NONE") . "\n\n";
        }
        $lastPrescriptionCount = $currentPrescriptionCount;
    }
    
    if ($currentDispensationCount > $lastDispensationCount) {
        $newDispensations = \App\Models\PharmacyDispensation::with('prescription')->orderBy('id', 'desc')->limit($currentDispensationCount - $lastDispensationCount)->get();
        foreach ($newDispensations as $disp) {
            echo "[" . date('H:i:s') . "] ★ NEW DISPENSATION #$disp->id\n";
            echo "  Prescription ID: $disp->prescription_id\n";
            if ($disp->prescription) {
                echo "  Treatment ID: " . $disp->prescription->treatment_id . "\n";
                $bill = \App\Models\Bill::where('treatment_id', $disp->prescription->treatment_id)->first();
                echo "  Bill ID: " . ($bill ? $bill->id : "NONE") . "\n";
                
                // Check bill items
                if ($bill) {
                    $pharmacyItems = \App\Models\BillItem::where('bill_id', $bill->id)
                        ->where('pharmacy_dispensation_id', $disp->id)
                        ->count();
                    echo "  Pharmacy items in bill: $pharmacyItems\n";
                    if ($pharmacyItems == 0) {
                        echo "  ⚠️  WARNING: Dispensation created but NO items added to bill!\n";
                    }
                }
            }
            echo "\n";
        }
        $lastDispensationCount = $currentDispensationCount;
    }
    
    sleep(1);
}
