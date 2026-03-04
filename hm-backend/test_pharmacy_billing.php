<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Treatment;
use App\Models\Prescription;
use App\Services\BillingService;

echo "\n" . str_repeat("=", 70) . "\n";
echo "TESTING PHARMACY PRESCRIPTION BILLING FIX\n";
echo str_repeat("=", 70) . "\n\n";

// Find a recent patient with multiple same-day treatments
$testCase = DB::select("
    SELECT 
        patient_id,
        DATE(visit_date) as day,
        GROUP_CONCAT(id ORDER BY id) as treatment_ids,
        GROUP_CONCAT(bill_id ORDER BY id) as bill_ids
    FROM treatments
    WHERE visit_date >= CURDATE()
    GROUP BY patient_id, DATE(visit_date)
    HAVING COUNT(*) > 1
    LIMIT 1
")[0] ?? null;

if (!$testCase) {
    echo "❌ No same-day treatments found today for testing.\n";
    echo "Please create 2 treatments for the same patient today, then run this script.\n\n";
    exit;
}

echo "Test Case Found:\n";
echo "  Patient: #{$testCase->patient_id}\n";
echo "  Day: {$testCase->day}\n";
echo "  Treatments: {$testCase->treatment_ids}\n";
echo "  Bill IDs: {$testCase->bill_ids}\n\n";

$treatmentIds = explode(',', $testCase->treatment_ids);
$billIds = array_filter(explode(',', $testCase->bill_ids));

echo str_repeat("-", 70) . "\n";
echo "SIMULATION: Adding prescription to revisit treatment\n";
echo str_repeat("-", 70) . "\n\n";

// Use the second treatment (should be the revisit)
$revisitTreatmentId = $treatmentIds[1] ?? null;

if (!$revisitTreatmentId) {
    echo "❌ Could not find revisit treatment.\n";
    exit;
}

echo "Simulating prescription dispensation for Treatment #{$revisitTreatmentId}...\n\n";

// Check what bill this treatment currently has
$revisitTreatment = Treatment::find($revisitTreatmentId);
echo "Before prescription:\n";
echo "  Treatment #{$revisitTreatmentId} bill_id: " . ($revisitTreatment->bill_id ?? 'NULL') . "\n\n";

// Simulate what PrescriptionObserver does
$billingService = app(BillingService::class);
echo "Calling getOrCreateBillForTreatment({$revisitTreatmentId})...\n";
$bill = $billingService->getOrCreateBillForTreatment($revisitTreatmentId);

echo "Returned Bill: #{$bill->id}\n";
echo "  Patient: #{$bill->patient_id}\n";
echo "  Treatment ID (primary): #{$bill->treatment_id}\n\n";

// Check how many bills exist for this patient/day
$billsForDay = DB::select("
    SELECT DISTINCT bill_id
    FROM treatments
    WHERE patient_id = ?
    AND DATE(visit_date) = ?
    AND bill_id IS NOT NULL
", [$testCase->patient_id, $testCase->day]);

echo "Bills for this patient/day: " . count($billsForDay) . "\n";
foreach ($billsForDay as $b) {
    echo "  - Bill #{$b->bill_id}\n";
}

if (count($billsForDay) == 1) {
    echo "\n✅ SUCCESS: Only ONE bill for same-day treatments!\n";
    echo "The pharmacy prescription fix is working correctly.\n\n";
} else {
    echo "\n❌ PROBLEM: Multiple bills found!\n";
    echo "The fix needs adjustment.\n\n";
}

echo str_repeat("=", 70) . "\n\n";
