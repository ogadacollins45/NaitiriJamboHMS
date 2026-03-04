<?php
/**
 * Run this in tinker: php artisan tinker
 * Then: include('diagnose_billing.php');
 */

echo "=== BILLING DIAGNOSTIC ===\n\n";

// 1. Find treatments with dispensed prescriptions
echo "1. TREATMENTS WITH DISPENSED PRESCRIPTIONS:\n";
$treatmentsWithRx = \App\Models\Treatment::whereHas('prescriptions', function($q) {
    $q->where('pharmacy_status', 'dispensed');
})->with(['prescriptions' => function($q) {
    $q->where('pharmacy_status', 'dispensed')->with('items.mappedDrug');
}])->get();

foreach ($treatmentsWithRx as $t) {
    echo "  Treatment #{$t->id} - Patient: {$t->patient_id}\n";
    foreach ($t->prescriptions as $p) {
        echo "    Prescription #{$p->id} - Status: {$p->pharmacy_status}\n";
        foreach ($p->items as $item) {
            $drugName = $item->drug_name_text;
            $mappedQty = $item->mapped_quantity ?? 0;
            $mappedDrug = $item->mappedDrug;
            $price = $mappedDrug ? $mappedDrug->default_unit_price : 0;
            $total = $mappedQty * $price;
            
            echo "      - {$drugName} | Mapped: {$mappedQty} | ";
            echo "Drug: " . ($mappedDrug ? $mappedDrug->generic_name : 'NULL') . " | ";
            echo "Price: {$price} | Total: {$total}\n";
        }
    }
    echo "\n";
}

if ($treatmentsWithRx->isEmpty()) {
    echo "  NO TREATMENTS WITH DISPENSED PRESCRIPTIONS FOUND!\n\n";
}

// 2. Find treatments with lab requests
echo "2. TREATMENTS WITH LAB REQUESTS:\n";
$treatmentsWithLabs = \App\Models\Treatment::whereHas('labRequests')->with(['labRequests.tests.template'])->get();

foreach ($treatmentsWithLabs as $t) {
    echo "  Treatment #{$t->id} - Patient: {$t->patient_id}\n";
    foreach ($t->labRequests as $lr) {
        echo "    Lab Request #{$lr->id} - Status: {$lr->status}\n";
        foreach ($lr->tests as $test) {
            $template = $test->template;
            $testName = $template ? $template->name : 'NULL';
            $price = $template ? $template->price : 0;
            echo "      - {$testName} | Price: {$price}\n";
        }
    }
    echo "\n";
}

if ($treatmentsWithLabs->isEmpty()) {
    echo "  NO TREATMENTS WITH LAB REQUESTS FOUND!\n\n";
}

// 3. Check specific treatments that were billed
echo "3. CHECKING RECENTLY BILLED TREATMENTS (28, 29, 30):\n";
foreach ([28, 29, 30] as $treatmentId) {
    $treatment = \App\Models\Treatment::find($treatmentId);
    if (!$treatment) {
        echo "  Treatment #{$treatmentId} - NOT FOUND\n";
        continue;
    }
    
    echo "  Treatment #{$treatmentId}:\n";
    
    // Check prescriptions
    $prescriptions = \App\Models\Prescription::where('treatment_id', $treatmentId)
        ->where('pharmacy_status', 'dispensed')
        ->with('items.mappedDrug')
        ->get();
    echo "    Dispensed Prescriptions: {$prescriptions->count()}\n";
    
    // Check lab requests
    $labRequests = \App\Models\LabRequest::where('treatment_id', $treatmentId)
        ->with('tests.template')
        ->get();
    echo "    Lab Requests: {$labRequests->count()}\n";
    
    if ($labRequests->count() > 0) {
        foreach ($labRequests as $lr) {
            echo "      Lab Request #{$lr->id} has {$lr->tests->count()} tests\n";
        }
    }
    echo "\n";
}

// 4. Find a good treatment to test with
echo "4. SUGGESTED TREATMENT IDS TO TEST:\n";
if ($treatmentsWithRx->isNotEmpty()) {
    echo "  Treatments with dispensed drugs: " . $treatmentsWithRx->pluck('id')->join(', ') . "\n";
}
if ($treatmentsWithLabs->isNotEmpty()) {
    echo "  Treatments with lab tests: " . $treatmentsWithLabs->pluck('id')->join(', ') . "\n";
}

echo "\n=== DIAGNOSTIC COMPLETE ===\n";
