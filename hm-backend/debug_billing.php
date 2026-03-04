<?php

/**
 * Debug script to check same-day billing consolidation
 * Run: php debug_billing.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Treatment;
use App\Models\Bill;
use Illuminate\Support\Facades\DB;

echo "\n=== SAME-DAY BILLING DEBUG ===\n\n";

// Get recent test patient
$patientId = 776; // Change this
$testDate = '2026-02-12'; // Change this

echo "Checking Patient ID: {$patientId}, Date: {$testDate}\n\n";

// Check treatments
echo "--- TREATMENTS ---\n";
$treatments = Treatment::where('patient_id', $patientId)
    ->whereDate('visit_date', $testDate)
    ->orderBy('id')
    ->get(['id', 'treatment_type', 'bill_id', 'visit_date', 'created_at']);

foreach ($treatments as $t) {
    echo "Treatment #{$t->id}: type={$t->treatment_type}, bill_id={$t->bill_id}, created={$t->created_at}\n";
}

// Check bills table
echo "\n--- BILLS TABLE (all bills for this date) ---\n";
$bills = Bill::whereIn('treatment_id', $treatments->pluck('id'))
    ->orWhereIn('id', $treatments->pluck('bill_id'))
    ->orderBy('id')
    ->get(['id', 'treatment_id', 'patient_id', 'total_amount', 'created_at']);

foreach ($bills as $b) {
    $itemCount = DB::table('bill_items')->where('bill_id', $b->id)->count();
    $consultCount = DB::table('bill_items')
        ->where('bill_id', $b->id)
        ->where('category', 'consultation')
        ->count();
    
    echo "Bill #{$b->id}: treatment_id={$b->treatment_id}, total={$b->total_amount}, items={$itemCount}, consultations={$consultCount}\n";
}

// Check which treatments link to which bills
echo "\n--- CONSOLIDATION CHECK ---\n";
$billIds = $treatments->pluck('bill_id')->unique();
echo "Unique bill_ids used by treatments: " . $billIds->implode(', ') . "\n";

if ($billIds->count() === 1) {
    echo "✅ SUCCESS: All same-day treatments use the SAME bill!\n";
} else {
    echo "❌ PROBLEM: Treatments use {$billIds->count()} different bills (should be 1)\n";
}

echo "\n=== END DEBUG ===\n\n";
