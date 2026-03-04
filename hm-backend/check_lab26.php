<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CHECKING LAB REQUEST #26 ===\n\n";

$labRequest = \App\Models\LabRequest::with('treatment')->find(26);

if ($labRequest) {
    echo "Lab Request #26:\n";
    echo "  Treatment ID: {$labRequest->treatment_id}\n";
    echo "  Patient ID: {$labRequest->patient_id}\n";
    echo "  Status: {$labRequest->status}\n";
    echo "  Created: {$labRequest->created_at}\n\n";
    
    if ($labRequest->treatment) {
        echo "Treatment #{$labRequest->treatment_id}:\n";
        echo "  Patient ID: {$labRequest->treatment->patient_id}\n";
        echo "  Created: {$labRequest->treatment->created_at}\n\n";
    }
    
    // Check bills
    echo "Bills for patient {$labRequest->patient_id}:\n";
    $bills = \App\Models\Bill::where('patient_id', $labRequest->patient_id)
        ->orderBy('id', 'desc')
        ->get();
    
    foreach ($bills as $bill) {
        echo "  Bill #{$bill->id} -> Treatment #{$bill->treatment_id}, Total: \${$bill->total_amount}\n";
    }
} else {
    echo "Lab Request #26 not found\n";
}
