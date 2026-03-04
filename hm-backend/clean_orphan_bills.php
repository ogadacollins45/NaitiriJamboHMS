<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n=== CLEANING ORPHAN BILLS ===\n\n";

// Find orphan bills (bills with no treatments linked via bill_id)
$orphanBills = DB::select("
    SELECT b.id, b.treatment_id, b.patient_id, b.total_amount, b.created_at
    FROM bills b
    WHERE NOT EXISTS (
        SELECT 1 FROM treatments t WHERE t.bill_id = b.id
    )
    ORDER BY b.id DESC
    LIMIT 20
");

if (count($orphanBills) === 0) {
    echo "✅ No orphan bills found!\n";
} else {
    echo "Found " . count($orphanBills) . " orphan bills:\n\n";
    
    foreach ($orphanBills as $bill) {
        echo "Bill ID: {$bill->id}, treatment_id: {$bill->treatment_id}, total: {$bill->total_amount}, created: {$bill->created_at}\n";
    }
    
    echo "\n⚠️  These bills have no treatments linked to them via bill_id.\n";
    echo "They might be from old tests before the consolidation feature was implemented.\n\n";
    
    $orphanIds = array_map(fn($b) => $b->id, $orphanBills);
    
    // Count items
    $itemCount = DB::table('bill_items')->whereIn('bill_id', $orphanIds)->count();
    echo "Total bill_items linked to these orphan bills: {$itemCount}\n\n";
    
    if ($itemCount === 0) {
        echo "Since these bills have NO items, they can be safely deleted.\n";
        echo "Run this to delete them:\n";
        echo "DELETE FROM bills WHERE id IN (" . implode(',', $orphanIds) . ");\n";
    } else {
        echo "⚠️  WARNING: Some orphan bills have items. Review before deleting!\n";
    }
}

echo "\n=== END ===\n\n";
