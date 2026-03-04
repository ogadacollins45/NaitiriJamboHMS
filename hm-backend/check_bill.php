<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get Bill 36 with all related data
$bill = \App\Models\Bill::with(['items', 'patient', 'treatment'])->find(36);

if (!$bill) {
    echo "Bill #36 not found\n";
    exit(1);
}

echo "================================\n";
echo "BILL #36 DETAILS\n";
echo "================================\n";
echo "Patient: {$bill->patient->first_name} {$bill->patient->last_name}\n";
echo "Treatment ID: {$bill->treatment_id}\n";
echo "Total Amount: {$bill->total_amount}\n";
echo "Status: {$bill->status}\n";
echo "Created: {$bill->created_at}\n";
echo "\n";

echo "================================\n";
echo "BILL ITEMS (" . $bill->items->count() . " items)\n";
echo "================================\n";

if ($bill->items->count() == 0) {
    echo "⚠️  NO ITEMS FOUND IN BILL!\n";
} else {
    $totalFromItems = 0;
    foreach ($bill->items as $item) {
        echo "- {$item->description}\n";
        echo "  Category: {$item->category}\n";
        echo "  Amount: {$item->amount}\n";
        echo "  Quantity: {$item->quantity}\n";
        echo "  Subtotal: {$item->subtotal}\n";
        
        // Show what this item is linked to
        if ($item->prescription_id) echo "  Linked to: Prescription #{$item->prescription_id}\n";
        if ($item->lab_request_id) echo "  Linked to: Lab Request #{$item->lab_request_id}\n";
        if ($item->lab_test_id) echo "  Linked to: Lab Test #{$item->lab_test_id}\n";
        
        echo "\n";
        $totalFromItems += $item->subtotal ?? $item->amount;
    }
    
    echo "--------------------------------\n";
    echo "Sum of items: {$totalFromItems}\n";
    echo "Bill total: {$bill->total_amount}\n";
    
    if (abs($totalFromItems - $bill->total_amount) > 0.01) {
        echo "⚠️  MISMATCH: Items don't add up to total!\n";
    }
}

echo "\n";
echo "================================\n";
echo "TREATMENT DETAILS\n";
echo "================================\n";

if ($bill->treatment) {
    $treatment = $bill->treatment;
    echo "Treatment ID: {$treatment->id}\n";
    echo "Diagnosis: {$treatment->diagnosis}\n";
    
    $labRequests = \App\Models\LabRequest::where('treatment_id', $treatment->id)->get();
    echo "Lab Requests: " . $labRequests->count() . "\n";
    foreach ($labRequests as $req) {
        echo "  - Lab Request #{$req->id} ({$req->status})\n";
        $tests = $req->tests;
        foreach ($tests as $test) {
            $template = $test->template;
            echo "    * {$template->name} - {$template->cost}\n";
        }
    }
    
    $prescriptions = \App\Models\Prescription::where('treatment_id', $treatment->id)->get();
    echo "Prescriptions: " . $prescriptions->count() . "\n";
    foreach ($prescriptions as $pres) {
        echo "  - Prescription #{$pres->id}\n";
        echo "    Drug: {$pres->drug_name}\n";
        echo "    Qty: {$pres->quantity}\n";
    }
}

