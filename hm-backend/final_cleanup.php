<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n" . str_repeat("=", 70) . "\n";
echo "FINAL CLEANUP - Remove All Orphan Bills\n";
echo str_repeat("=", 70) . "\n\n";

// Find orphan bills
$orphanBills = DB::select("
    SELECT b.id, b.treatment_id, b.patient_id, b.total_amount, b.created_at
    FROM bills b
    WHERE NOT EXISTS (
        SELECT 1 FROM treatments t WHERE t.bill_id = b.id
    )
    ORDER BY b.created_at DESC
");

if (count($orphanBills) > 0) {
    echo "Found " . count($orphanBills) . " orphan bills:\n\n";
    
    foreach ($orphanBills as $bill) {
        echo "Bill #{$bill->id} (created: {$bill->created_at}):\n";
        echo "  treatment_id: {$bill->treatment_id}\n";
        echo "  patient: {$bill->patient_id}\n";
        echo "  total: \${$bill->total_amount}\n\n";
    }
    
    $orphanIds = array_map(fn($b) => $b->id, $orphanBills);
    
    // Delete bill items
    $deletedItems = DB::table('bill_items')->whereIn('bill_id', $orphanIds)->delete();
    echo "✅ Deleted {$deletedItems} bill items\n";
    
    // Delete orphan bills
    $deletedBills = DB::table('bills')->whereIn('id', $orphanIds)->delete();
    echo "✅ Deleted {$deletedBills} orphan bills\n\n";
    
    echo str_repeat("=", 70) . "\n";
    echo "✅ CLEANUP COMPLETE!\n";
    echo str_repeat("=", 70) . "\n\n";
} else {
    echo "✅ No orphan bills found!\n\n";
}
