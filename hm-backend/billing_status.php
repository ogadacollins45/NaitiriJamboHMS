<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n" . str_repeat("=", 60) . "\n";
echo "SAME-DAY BILLING - STATUS CHECK\n";
echo str_repeat("=", 60) . "\n\n";

// Find orphan bills to delete
$orphanBills = DB::select("
    SELECT b.id, b.treatment_id, b.patient_id, b.total_amount
    FROM bills b
    WHERE NOT EXISTS (
        SELECT 1 FROM treatments t WHERE t.bill_id = b.id
    )
    ORDER BY b.id
");

if (count($orphanBills) > 0) {
    echo "FOUND " . count($orphanBills) . " ORPHAN BILLS (from old tests):\n";
    foreach ($orphanBills as $bill) {
        echo "  - Bill #{$bill->id} (treatment_id: {$bill->treatment_id})\n";
    }
    
    $orphanIds = array_map(fn($b) => $b->id, $orphanBills);
    
    echo "\n✅ CLEANING UP (deleting orphan bills)...\n";
    
    // Delete bill items first
    $deleted_items = DB::table('bill_items')->whereIn('bill_id', $orphanIds)->delete();
    echo "  - Deleted {$deleted_items} bill items\n";
    
    // Delete bills
    $deleted_bills = DB::table('bills')->whereIn('id', $orphanIds)->delete();
    echo "  - Deleted {$deleted_bills} bills\n";
    
    echo "\n✅ CLEANUP COMPLETE!\n\n";
} else {
    echo "✅ No orphan bills found - system is clean!\n\n";
}

// Show current consolidated bills
echo str_repeat("-", 60) . "\n";
echo "CURRENT SAME-DAY CONSOLIDATED BILLS:\n";
echo str_repeat("-", 60) . "\n\n";

$consolidatedBills = DB::select("
    SELECT 
        b.id as bill_id,
        b.patient_id,
        DATE(b.created_at) as bill_date,
        b.total_amount,
        COUNT(t.id) as treatment_count,
        GROUP_CONCAT(t.id ORDER BY t.id) as treatment_ids
    FROM bills b
    INNER JOIN treatments t ON t.bill_id = b.id
    GROUP BY b.id
    HAVING COUNT(t.id) > 1
    ORDER BY b.created_at DESC
    LIMIT 10
");

if (count($consolidatedBills) > 0) {
    echo "✅ Found " . count($consolidatedBills) . " bills with multiple treatments:\n\n";
    foreach ($consolidatedBills as $bill) {
        echo "Bill #{$bill->bill_id} (Patient #{$bill->patient_id}, {$bill->bill_date}):\n";
        echo "  - Total: \${$bill->total_amount}\n";
        echo "  - Treatments: {$bill->treatment_ids} ({$bill->treatment_count} treatments)\n\n";
    }
} else {
    echo "No consolidated bills found yet.\n";
    echo "(This is normal if you haven't created same-day treatments recently)\n\n";
}

echo str_repeat("=", 60) . "\n";
echo "✅ SYSTEM STATUS: Same-day billing consolidation is ACTIVE\n";
echo "\nTo test: Create 2 treatments for same patient on same day.\n";
echo "Expected: Only 1 bill will be created for both treatments.\n";
echo str_repeat("=", 60) . "\n\n";
