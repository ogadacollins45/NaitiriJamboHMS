<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n=== INVESTIGATING BILLS 724 & 725 ===\n\n";

foreach([724, 725] as $billId) {
    $bill = DB::table('bills')->where('id', $billId)->first();
    
    if ($bill) {
        echo "Bill #{$billId}:\n";
        echo "  treatment_id (created it): {$bill->treatment_id}\n";
        echo "  patient_id: {$bill->patient_id}\n";
        echo "  created_at: {$bill->created_at}\n";
        
        $linkedTreatments = DB::table('treatments')
            ->where('bill_id', $billId)
            ->get(['id', 'treatment_type', 'created_at']);
        
        echo "  Treatments with bill_id={$billId}:\n";
        if ($linkedTreatments->count() > 0) {
            foreach ($linkedTreatments as $t) {
                echo "    - T#{$t->id} (type: {$t->treatment_type}, created: {$t->created_at})\n";
            }
        } else {
            echo "    - NONE (orphan bill!)\n";
        }
        
        $items = DB::table('bill_items')->where('bill_id', $billId)->count();
        echo "  Bill items: {$items}\n\n";
    }
}

// Check treatments 724 and 725
foreach([724, 725] as $tId) {
    $t = DB::table('treatments')->where('id', $tId)->first();
    if ($t) {
        echo "Treatment #{$tId}:\n";
        echo "  bill_id: " . ($t->bill_id ?? 'NULL') . "\n";
        echo "  type: " . ($t->treatment_type ?? 'null') . "\n";
        echo "  patient: {$t->patient_id}\n";
        echo "  visit_date: {$t->visit_date}\n";
        echo "  created_at: {$t->created_at}\n\n";
    }
}

echo "=== END ===\n\n";
