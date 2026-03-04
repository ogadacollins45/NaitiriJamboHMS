<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CHECKING TREATMENT #40 / BILL #36 ===\n\n";

$bill = \App\Models\Bill::find(36);
echo "Bill #36:\n";
echo "  Treatment ID: {$bill->treatment_id}\n";
echo "  Patient ID: {$bill->patient_id}\n";
echo "  Total: {$bill->total_amount}\n\n";

$treatment = \App\Models\Treatment::find(40);
echo "Treatment #40:\n";
echo "  Patient ID: {$treatment->patient_id}\n";
echo "  Diagnosis: {$treatment->diagnosis}\n\n";

// Check lab requests for treatment 40
$labRequests = \App\Models\LabRequest::where('treatment_id', 40)->get();
echo "Lab Requests for Treatment #40:\n";
if ($labRequests->count() == 0) {
    echo "  ⚠️  NONE FOUND!\n";
} else {
    foreach ($labRequests as $lr) {
        echo "  - Lab Request #{$lr->id} ({$lr->status})\n";
        foreach ($lr->tests as $test) {
            $template = $test->template;
            echo "    * Test: {$template->name} - Price: \${$template->price}\n";
        }
    }
}

echo "\n";

// Check prescriptions for treatment 40
$prescriptions = \App\Models\Prescription::where('treatment_id', 40)->get();
echo "Prescriptions for Treatment #40:\n";
foreach ($prescriptions as $pres) {
    echo "  - Prescription #{$pres->id}\n";
    echo "    Drug: '{$pres->drug_name}'\n";
    echo "    Qty: {$pres->quantity}\n";
}

echo "\n";

// Check bill items
echo "Bill Items for Bill #36:\n";
$items = $bill->items;
foreach ($items as $item) {
    echo "  - {$item->description}: \${$item->amount} x {$item->quantity} = \${$item->subtotal}\n";
}
