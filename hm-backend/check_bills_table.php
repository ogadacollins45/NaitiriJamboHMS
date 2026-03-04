<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$patientId = 776;
$testDate = '2026-02-12';

echo "\n=== BILLS TABLE INVESTIGATION ===\n\n";

// Get all bills for this patient on this date
$bills = DB::select("
    SELECT b.id, b.treatment_id, b.patient_id, b.total_amount, 
           (SELECT GROUP_CONCAT(t.id) FROM treatments t WHERE t.bill_id = b.id) as linked_treatments
    FROM bills b
    WHERE b.patient_id = ?
    AND DATE(b.created_at) = ?
    ORDER BY b.id
", [$patientId, $testDate]);

echo "Bills found: " . count($bills) . "\n\n";

foreach ($bills as $bill) {
    echo "Bill ID: {$bill->id}\n";
    echo "  treatment_id (primary): {$bill->treatment_id}\n";
    echo "  linked_treatments (via bill_id): {$bill->linked_treatments}\n";
    echo "  total_amount: {$bill->total_amount}\n";
    echo "\n";
}

if (count($bills) > 1) {
    echo "⚠️  WARNING: Found " . count($bills) . " bills in the bills table!\n";
    echo "This might be confusing in the UI even though treatments are correctly consolidated.\n\n";
    
    echo "EXPLANATION:\n";
    echo "- The 'bills' table may have multiple rows\n";
    echo "- But treatments link via 'bill_id', so they're actually consolidated\n";
    echo "- Check 'linked_treatments' column to see which treatments share each bill\n";
}

echo "\n=== END ===\n\n";
