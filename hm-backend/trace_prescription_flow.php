<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== ANALYZING PRESCRIPTION WORKFLOW ===\n\n";

// Step 1: Check what PrescriptionController creates
echo "1. PRESCRIPTION TABLE (from doctor)\n";
echo "   Model: Prescription\n";
echo "   Count: " . \App\Models\Prescription::count() . "\n";
$latestPres = \App\Models\Prescription::orderBy('id', 'desc')->first();
if ($latestPres) {
    echo "   Latest: ID=" . $latestPres->id . ", Treatment=" . $latestPres->treatment_id . ", Patient=" . $latestPres->patient_id . "\n";
}
echo "\n";

// Step 2: Check PharmacyOrder (bridge table)
echo "2. PHARMACY_ORDERS TABLE (bridge)\n";
echo "   Model: PharmacyOrder\n";
echo "   Count: " . \App\Models\PharmacyOrder::count() . "\n";
$latestOrder = \App\Models\PharmacyOrder::orderBy('id', 'desc')->first();
if ($latestOrder) {
    echo "   Latest: ID=" . $latestOrder->id . ", Prescription ID=" . $latestOrder->prescription_id . ", Status=" . $latestOrder->status . "\n";
    // Check if prescription_id links to Prescription or PharmacyPrescription
    $pres = \App\Models\Prescription::find($latestOrder->prescription_id);
    if ($pres) {
        echo "   → Links to Prescription table (Treatment ID: " . $pres->treatment_id . ")\n";
    } else {
        echo "   → prescription_id doesn't match Prescription table\n";
    }
}
echo "\n";

// Step 3: Check PharmacyPrescription (alternative system?)
echo "3. PHARMACY_PRESCRIPTIONS TABLE (pharmacy system)\n";
echo "   Model: PharmacyPrescription\n";
try {
    echo "   Count: " . \App\Models\PharmacyPrescription::count() . "\n";
    $latestPharmPres = \App\Models\PharmacyPrescription::orderBy('id', 'desc')->first();
    if ($latestPharmPres) {
        echo "   Latest: ID=" . $latestPharmPres->id . "\n";
        // Check if it has treatment_id
        if (isset($latestPharmPres->treatment_id)) {
            echo "   Has treatment_id: " . $latestPharmPres->treatment_id . "\n";
        } else {
            echo "   NO treatment_id column\n";
        }
    } else {
        echo "   No records\n";
    }
} catch (\Exception $e) {
    echo "   Error: " . $e->getMessage() . "\n";
}
echo "\n";

// Step 4: Check PharmacyDispensation
echo "4. PHARMACY_DISPENSATIONS TABLE (dispensing)\n";
echo "   Model: PharmacyDispensation\n";
echo "   Count: " . \App\Models\PharmacyDispensation::count() . "\n";
$latestDisp = \App\Models\PharmacyDispensation::orderBy('id', 'desc')->first();
if ($latestDisp) {
    echo "   Latest: ID=" . $latestDisp->id . ", Prescription ID=" . $latestDisp->prescription_id . "\n";
    
    // Check what prescription_id points to
    $pharmPres = \App\Models\PharmacyPrescription::find($latestDisp->prescription_id);
    if ($pharmPres) {
        echo "   → prescription_id links to PharmacyPrescription\n";
    } else {
        echo "   → prescription_id doesn't match PharmacyPrescription\n";
        // Maybe it links to regular Prescription?
        $pres = \App\Models\Prescription::find($latestDisp->prescription_id);
        if ($pres) {
            echo "   → Actually links to Prescription table (Treatment: " . $pres->treatment_id . ")\n";
        }
    }
} else {
    echo "   No records (this is the problem!)\n";
}

echo "\n";
echo "=== CONCLUSION ===\n";
echo "The workflow is:\n";
echo "1. Doctor creates Prescription (has treatment_id) ✓\n";
echo "2. Creates PharmacyOrder (links to Prescription) ✓\n";
echo "3. Pharmacy should create PharmacyDispensation...\n";
echo "4. But PharmacyDispensation expects PharmacyPrescription ✗\n";
echo "\nThis is the disconnect!\n";
