<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n" . str_repeat("=", 70) . "\n";
echo "CLEANUP ORPHAN BILLS & VERIFY FIX\n";
echo str_repeat("=", 70) . "\n\n";

// Find orphan bills (bills with no treatments linked via bill_id)
$orphanBills = DB::select("
    SELECT b.id, b.treatment_id, b.patient_id, b.total_amount
    FROM bills b
    WHERE NOT EXISTS (
        SELECT 1 FROM treatments t WHERE t.bill_id = b.id
    )
    ORDER BY b.id DESC
");

if (count($orphanBills) > 0) {
    echo "Found " . count($orphanBills) . " orphan bills to clean up:\n\n";
    
    foreach ($orphanBills as $bill) {
        echo "Bill ID: {$bill->id}, treatment_id: {$bill->treatment_id}, ";
        echo "patient: {$bill->patient_id}, total: \${$bill->total_amount}\n";
    }
    
    $orphanIds = array_map(fn($b) => $b->id, $orphanBills);
    
    // Delete bill items first
    $deletedItems = DB::table('bill_items')->whereIn('bill_id', $orphanIds)->delete();
    echo "\n✅ Deleted {$deletedItems} bill items\n";
    
    // Delete orphan bills
    $deletedBills = DB::table('bills')->whereIn('id', $orphanIds)->delete();
    echo "✅ Deleted {$deletedBills} orphan bills\n\n";
} else {
    echo "✅ No orphan bills found - database is clean!\n\n";
}

echo str_repeat("-", 70) . "\n";
echo "VERIFICATION: Same-day billing consolidation status\n";
echo str_repeat("-", 70) . "\n\n";

// Check for same-day treatments
$consolidated = DB::select("
    SELECT 
        patient_id,
        DATE(visit_date) as day,
        COUNT(DISTINCT id) as treatment_count,
        COUNT(DISTINCT bill_id) as unique_bills,
        GROUP_CONCAT(id ORDER BY id) as treatment_ids,
        GROUP_CONCAT(DISTINCT bill_id ORDER BY bill_id) as bill_ids
    FROM treatments
    WHERE visit_date >= DATE_SUB(NOW(), INTERVAL 3 DAY)
    GROUP BY patient_id, DATE(visit_date)
    HAVING COUNT(*) > 1
    ORDER BY visit_date DESC
    LIMIT 5
");

if (count($consolidated) > 0) {
    echo "Recent patients with multiple same-day treatments:\n\n";
    foreach ($consolidated as $record) {
        echo "Patient #{$record->patient_id} on {$record->day}:\n";
        echo "  Treatments: {$record->treatment_ids} ({$record->treatment_count} total)\n";
        echo "  Bills: {$record->bill_ids} ({$record->unique_bills} unique)\n";
        
        if ($record->unique_bills == 1) {
            echo "  ✅ SUCCESS: Single consolidated bill!\n\n";
        } else {
            echo "  ❌ PROBLEM: Multiple bills detected!\n\n";
        }
    }
} else {
    echo "No patients with multiple same-day treatments in last 3 days.\n\n";
}

echo str_repeat("=", 70) . "\n";
echo "✅ CLEANUP COMPLETE - Ready for testing!\n";
echo str_repeat("=", 70) . "\n\n";
