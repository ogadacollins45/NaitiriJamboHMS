<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n" . str_repeat("=", 70) . "\n";
echo "SAME-DAY TREATMENT ANALYSIS\n";
echo str_repeat("=", 70) . "\n\n";

// Find patients with multiple treatments today
$today = date('Y-m-d');
$patientsWithMultipleTreatments = DB::select("
    SELECT 
        patient_id, 
        DATE(visit_date) as visit_day,
        COUNT(*) as treatment_count,
        GROUP_CONCAT(id ORDER BY id) as treatment_ids,
        GROUP_CONCAT(treatment_type ORDER BY id) as treatment_types,
        GROUP_CONCAT(bill_id ORDER BY id) as bill_ids
    FROM treatments
    WHERE DATE(visit_date) = ?
    GROUP BY patient_id, DATE(visit_date)
    HAVING COUNT(*) > 1
", [$today]);

if (count($patientsWithMultipleTreatments) > 0) {
    echo "✅ Found " . count($patientsWithMultipleTreatments) . " patient(s) with multiple treatments today:\n\n";
    
    foreach ($patientsWithMultipleTreatments as $record) {
        echo "Patient #{$record->patient_id} on {$record->visit_day}:\n";
        echo "  Treatment IDs: {$record->treatment_ids}\n";
        echo "  Types: {$record->treatment_types}\n";
        echo "  Bill IDs: {$record->bill_ids}\n\n";
        
        $treatmentIds = explode(',', $record->treatment_ids);
        $billIds = explode(',', $record->bill_ids);
        
        // Check how many unique bills
        $uniqueBills = array_unique(array_filter($billIds));
        echo "  Unique Bills: " . count($uniqueBills) . " (" . implode(', ', $uniqueBills) . ")\n";
        
        if (count($uniqueBills) > 1) {
            echo "  ❌ PROBLEM: Multiple bills for same-day treatments!\n\n";
            
            // Show details of each bill
            foreach ($uniqueBills as $billId) {
                $bill = DB::table('bills')->where('id', $billId)->first();
                $consultationCount = DB::table('bill_items')
                    ->where('bill_id', $billId)
                    ->where('category', 'consultation')
                    ->count();
                    
                echo "    Bill #{$billId}:\n";
                echo "      treatment_id (primary): {$bill->treatment_id}\n";
                echo "      total_amount: \${$bill->total_amount}\n";
                echo "      consultation fees: {$consultationCount}\n\n";
            }
        } else {
            echo "  ✅ SUCCESS: All treatments use the same bill!\n\n";
        }
    }
} else {
    echo "No patients with multiple treatments today.\n";
    echo "Testing with recent data instead...\n\n";
    
    // Check last 7 days
    $recentMultiple = DB::select("
        SELECT 
            patient_id, 
            DATE(visit_date) as visit_day,
            COUNT(*) as treatment_count,
            GROUP_CONCAT(id ORDER BY id) as treatment_ids,
            GROUP_CONCAT(treatment_type ORDER BY id) as treatment_types,
            GROUP_CONCAT(bill_id ORDER BY id) as bill_ids
        FROM treatments
        WHERE visit_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY patient_id, DATE(visit_date)
        HAVING COUNT(*) > 1
        ORDER BY visit_date DESC
        LIMIT 5
    ");
    
    foreach ($recentMultiple as $record) {
        echo "Patient #{$record->patient_id} on {$record->visit_day}:\n";
        echo "  Treatments: {$record->treatment_ids}\n";
        echo "  Types: {$record->treatment_types}\n";
        echo "  Bill IDs: {$record->bill_ids}\n";
        
        $uniqueBills = array_unique(array_filter(explode(',', $record->bill_ids)));
        if (count($uniqueBills) > 1) {
            echo "  ❌ MULTIPLE BILLS: " . implode(', ', $uniqueBills) . "\n\n";
        } else {
            echo "  ✅ SINGLE BILL: " . implode(', ', $uniqueBills) . "\n\n";
        }
    }
}

echo str_repeat("=", 70) . "\n\n";
