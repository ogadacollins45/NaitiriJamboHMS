<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== INVESTIGATING BILL MISMATCH ===\n\n";

// Get Lab Request 22
$labRequest = \App\Models\LabRequest::find(22);
echo "Lab Request #22:\n";
echo "  Treatment ID: {$labRequest->treatment_id}\n";

// Get the correct bill for this treatment
$correctBill = \App\Models\Bill::where('treatment_id', $labRequest->treatment_id)->first();
echo "  Correct Bill ID for Treatment #{$labRequest->treatment_id}: " . ($correctBill ? $correctBill->id : "NONE") . "\n\n";

// Find which bills have items for this lab request
$billItems = \App\Models\BillItem::where('lab_request_id', 22)->get();
echo "Bill Items created for Lab Request #22:\n";
if ($billItems->count() == 0) {
    echo "  ⚠️  NO BILL ITEMS FOUND!\n";
} else {
    foreach ($billItems as $item) {
        echo "  - Bill #{$item->bill_id}: {$item->description} (Amount: {$item->amount})\n";
    }
}

echo "\n";

// Check if there's an issue with bill IDs
$allBills = \App\Models\Bill::whereBetween('id', [30, 40])->get();
echo "All Bills (ID 30-40):\n";
foreach ($allBills as $bill) {
    echo "  Bill #{$bill->id} -> Treatment #{$bill->treatment_id} (Patient: {$bill->patient_id})\n";
}
