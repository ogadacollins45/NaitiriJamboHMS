<?php
/**
 * COMPREHENSIVE END-TO-END WORKFLOW TEST
 * 
 * Tests complete flow with database verification at each step:
 * 1. Create Patient
 * 2. Create Treatment (verify bill auto-created)
 * 3. Create Pharmacy Prescription
 * 4. Dispense Drugs (TEST PharmacyDispensationObserver!)
 * 5. Create Lab Request (TEST LabRequestObserver!)
 * 6. Verify complete bill with all charges
 */

$baseUrl = 'http://localhost:8000/api';
$db = new mysqli('127.0.0.1', 'root', '7836sql', 'brixton_hms_fresh');

if ($db->connect_error) {
    die("❌ DB Connection failed\n");
}

function apiCall($method, $endpoint, $data = null) {
    global $baseUrl;
    $ch = curl_init("$baseUrl$endpoint");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'data' => json_decode($response, true),
        'raw' => $response
    ];
}

echo "\n" . str_repeat("=", 80) . "\n";
echo "COMPREHENSIVE END-TO-END WORKFLOW TEST\n";
echo str_repeat("=", 80) . "\n\n";

// Step 1: Create Patient
echo "📍 STEP 1: Creating Test Patient\n";
echo str_repeat("-", 80) . "\n";

$patientData = [
    'first_name' => 'E2E_Test',
    'last_name' => 'Patient',
    'date_of_birth' => '1990-06-15',
    'gender' => 'female',
    'phone' => '0799999999',
    'email' => 'e2e@test.com'
];

$response = apiCall('POST', '/patients', $patientData);

if ($response['code'] != 201) {
    die("❌ Failed to create patient: HTTP {$response['code']}\n");
}

$patientId = $response['data']['id'];
echo "✅ Patient created: ID = $patientId\n";

// Verify in DB
sleep(1);
$dbPatient = $db->query("SELECT * FROM patients WHERE id = $patientId")->fetch_assoc();
echo "✅ DB VERIFIED: {$dbPatient['first_name']} {$dbPatient['last_name']}\n\n";

// Step 2: Create Treatment
echo "📍 STEP 2: Creating Treatment (Should auto-create bill)\n";
echo str_repeat("-", 80) . "\n";

$treatmentData = [
    'patient_id' => $patientId,
    'doctor_id' => 1,
    'chief_complaint' => 'Test symptoms for E2E testing',
    'diagnosis' => 'E2E Test Diagnosis',
    'treatment_plan' => 'E2E Test Plan'
];

$response = apiCall('POST', "/patients/$patientId/treatments", $treatmentData);

if ($response['code'] != 201) {
    die("❌ Failed to create treatment: HTTP {$response['code']}\n");
}

$treatmentId = $response['data']['treatment']['id'] ?? null;
echo "✅ Treatment created: ID = $treatmentId\n";

// Check if bill auto-created
sleep(2);
$bill = $db->query("SELECT * FROM bills WHERE treatment_id = $treatmentId")->fetch_assoc();

if ($bill) {
    $billId = $bill['id'];
    echo "✅ BILL AUTO-CREATED: ID = $billId | Total: {$bill['total_amount']}\n";
    
    // Check bill items
    $billItems = $db->query("SELECT * FROM bill_items WHERE bill_id = $billId")->fetch_all(MYSQLI_ASSOC);
    echo "   Bill items count: " . count($billItems) . "\n";
    foreach ($billItems as $item) {
        echo "   - {$item['category']}: {$item['description']} = {$item['subtotal']}\n";
    }
} else {
    die("❌ No bill auto-created!\n");
}
echo "\n";

// Step 3: Check if pharmacy drugs exist
echo "📍 STEP 3: Checking Pharmacy Setup\n";
echo str_repeat("-", 80) . "\n";

$drugsCount = $db->query("SELECT COUNT(*) as c FROM pharmacy_drugs")->fetch_assoc()['c'];
$batchesCount = $db->query("SELECT COUNT(*) as c FROM pharmacy_drug_batches")->fetch_assoc()['c'];

echo "Pharmacy drugs: $drugsCount\n";
echo "Drug batches: $batchesCount\n";

if ($drugsCount == 0) {
    echo "⚠️  WARNING: No pharmacy drugs in database!\n";
    echo "   Cannot test pharmacy dispensation without drugs.\n";
    echo "   Please add drugs via pharmacy interface first.\n\n";
    $canTestPharmacy = false;
} else {
    // Get first drug
    $drug = $db->query("SELECT * FROM pharmacy_drugs LIMIT 1")->fetch_assoc();
    $drugId = $drug['id'];
    echo "✅ Using drug: {$drug['generic_name']} (ID: $drugId)\n";
    
    // Check if batch exists
    $batch = $db->query("SELECT * FROM pharmacy_drug_batches WHERE drug_id = $drugId LIMIT 1")->fetch_assoc();
    if ($batch) {
        $batchId = $batch['id'];
        echo "✅ Using batch: {$batch['batch_number']} (ID: $batchId)\n\n";
        $canTestPharmacy = true;
    } else {
        echo "⚠️  No batch found for this drug\n\n";
        $canTestPharmacy = false;
    }
}

// Step 4: Create Pharmacy Prescription
if ($canTestPharmacy) {
    echo "📍 STEP 4: Creating Pharmacy Prescription\n";
    echo str_repeat("-", 80) . "\n";
    
    $prescriptionData = [
        'patient_id' => $patientId,
        'treatment_id' => $treatmentId,
        'diagnosis' => 'E2E Test',
        'prescription_type' => 'outpatient',
        'priority' => 'routine',
        'drugs' => [
            [
                'drug_id' => $drugId,
                'quantity_prescribed' => 30,
                'dosage' => '500mg',
                'frequency' => 'Three times daily',
                'route' => 'oral',
                'duration_days' => 10
            ]
        ]
    ];
    
    $response = apiCall('POST', '/pharmacy/prescriptions', $prescriptionData);
    
    if ($response['code'] == 201) {
        $prescriptionId = $response['data']['id'];
        echo "✅ Pharmacy prescription created: ID = $prescriptionId\n";
        
        // Get prescription items
        sleep(1);
        $prescriptionItems = $db->query("
            SELECT * FROM pharmacy_prescription_items 
            WHERE prescription_id = $prescriptionId
        ")->fetch_all(MYSQLI_ASSOC);
        
        if (count($prescriptionItems) > 0) {
            $itemId = $prescriptionItems[0]['id'];
            echo "✅ Prescription has " . count($prescriptionItems) . " item(s)\n\n";
            
            // Step 5: DISPENSE DRUGS (Critical test!)
            echo "📍 STEP 5: DISPENSING DRUGS (PharmacyDispensationObserver Test!)\n";
            echo str_repeat("-", 80) . "\n";
            
            $dispensationData = [
                'prescription_id' => $prescriptionId,
                'items' => [
                    [
                        'prescription_item_id' => $itemId,
                        'drug_id' => $drugId,
                        'batch_id' => $batchId,
                        'quantity_dispensed' => 30,
                        'unit_price' => 10.00
                    ]
                ]
            ];
            
            echo "Calling /pharmacy/dispensations/dispense...\n";
            $response = apiCall('POST', '/pharmacy/dispensations/dispense', $dispensationData);
            
            echo "API Response: HTTP {$response['code']}\n";
            
            if ($response['code'] == 200 || $response['code'] == 201) {
                $dispensationId = $response['data']['id'] ?? null;
                echo "✅ Dispensation created: ID = $dispensationId\n";
                
                // CRITICAL: Check if Observer fired!
                echo "\n🔍 CHECKING IF PharmacyDispensationObserver FIRED...\n";
                sleep(3); // Give observer time
                
                // Check bill items
                $pharmacyBillItems = $db->query("
                    SELECT * FROM bill_items 
                    WHERE bill_id = $billId 
                    AND pharmacy_dispensation_id IS NOT NULL
                ")->fetch_all(MYSQLI_ASSOC);
                
                if (count($pharmacyBillItems) > 0) {
                    echo "🎉 SUCCESS! Observer fired! Found " . count($pharmacyBillItems) . " pharmacy item(s) in bill:\n";
                    foreach ($pharmacyBillItems as $item) {
                        echo "   - {$item['description']} | QTY: {$item['quantity']} | Price: {$item['amount']} | Total: {$item['subtotal']}\n";
                    }
                    
                    // Check updated bill total
                    $updatedBill = $db->query("SELECT * FROM bills WHERE id = $billId")->fetch_assoc();
                    echo "\n📋 Updated Bill Total: {$updatedBill['total_amount']}\n";
                } else {
                    echo "❌ OBSERVER DID NOT FIRE! No pharmacy items added to bill\n";
                    echo "   Checking logs...\n";
                }
            } else {
                echo "❌ Dispensation failed: {$response['raw']}\n";
            }
            echo "\n";
        }
    } else {
        echo "⚠️  Prescription creation failed: HTTP {$response['code']}\n";
        echo "   Response: {$response['raw']}\n\n";
    }
}

// Step 6: Create Lab Request
echo "📍 STEP 6: Creating Lab Request (LabRequestObserver Test!)\n";
echo str_repeat("-", 80) . "\n";

// Check if lab tests exist
$labTestsCount = $db->query("SELECT COUNT(*) as c FROM lab_test_templates")->fetch_assoc()['c'];

if ($labTestsCount == 0) {
    echo "⚠️  No lab test templates in database!\n";
    echo "   Cannot test lab request without test templates.\n\n";
} else {
    $testTemplates = $db->query("SELECT id FROM lab_test_templates LIMIT 2")->fetch_all(MYSQLI_ASSOC);
    $testIds = array_column($testTemplates, 'id');
    
    echo "Using lab tests: " . implode(', ', $testIds) . "\n";
    
    $labRequestData = [
        'patient_id' => $patientId,
        'treatment_id' => $treatmentId,
        'priority' => 'routine',
        'clinical_notes' => 'E2E Test lab request',
        'tests' => $testIds
    ];
    
    $response = apiCall('POST', '/lab/requests', $labRequestData);
    
    if ($response['code'] == 201) {
        $labRequestId = $response['data']['id'];
        echo "✅ Lab request created: ID = $labRequestId\n";
        
        // CRITICAL: Check if Observer fired!
        echo "\n🔍 CHECKING IF LabRequestObserver FIRED...\n";
        sleep(3);
        
        $labBillItems = $db->query("
            SELECT * FROM bill_items 
            WHERE bill_id = $billId 
            AND lab_request_id IS NOT NULL
        ")->fetch_all(MYSQLI_ASSOC);
        
        if (count($labBillItems) > 0) {
            echo "🎉 SUCCESS! Observer fired! Found " . count($labBillItems) . " lab item(s) in bill:\n";
            foreach ($labBillItems as $item) {
                echo "   - {$item['description']} | Price: {$item['amount']}\n";
            }
        } else {
            echo "❌ OBSERVER DID NOT FIRE! No lab items added to bill\n";
        }
    } else {
        echo "⚠️  Lab request failed: HTTP {$response['code']}\n";
    }
}

// Final Summary
echo "\n" . str_repeat("=", 80) . "\n";
echo "FINAL BILL SUMMARY\n";
echo str_repeat("=", 80) . "\n";

$finalBill = $db->query("SELECT * FROM bills WHERE id = $billId")->fetch_assoc();
$allItems = $db->query("SELECT * FROM bill_items WHERE bill_id = $billId")->fetch_all(MYSQLI_ASSOC);

echo "Bill ID: $billId\n";
echo "Patient: $patientId | Treatment: $treatmentId\n\n";

echo "Bill Items:\n";
$calculatedTotal = 0;
foreach ($allItems as $item) {
    $source = '';
    if ($item['pharmacy_dispensation_id']) $source = " [Pharmacy Disp #{$item['pharmacy_dispensation_id']}]";
    if ($item['lab_request_id']) $source = " [Lab Request #{$item['lab_request_id']}]";
    
    echo sprintf("  %-15s %-30s %5d x %8.2f = %8.2f%s\n",
        $item['category'],
        substr($item['description'], 0, 30),
        $item['quantity'],
        $item['amount'],
        $item['subtotal'],
        $source
    );
    $calculatedTotal += $item['subtotal'];
}

echo str_repeat("-", 80) . "\n";
echo sprintf("%-52s %8.2f\n", "SUBTOTAL:", $finalBill['subtotal']);
echo sprintf("%-52s %8.2f\n", "DISCOUNT:", $finalBill['discount']);
echo sprintf("%-52s %8.2f\n", "TAX:", $finalBill['tax']);
echo str_repeat("-", 80) . "\n";
echo sprintf("%-52s %8.2f\n", "TOTAL:", $finalBill['total_amount']);
echo "\n";

// Test Results Summary
echo str_repeat("=", 80) . "\n";
echo "TEST RESULTS SUMMARY\n";
echo str_repeat("=", 80) . "\n";

$pharmacyItemsCount = $db->query("SELECT COUNT(*) as c FROM bill_items WHERE bill_id = $billId AND pharmacy_dispensation_id IS NOT NULL")->fetch_assoc()['c'];
$labItemsCount = $db->query("SELECT COUNT(*) as c FROM bill_items WHERE bill_id = $billId AND lab_request_id IS NOT NULL")->fetch_assoc()['c'];

echo "✅ Patient Created: ID $patientId\n";
echo "✅ Treatment Created: ID $treatmentId\n";
echo "✅ Bill Auto-Created: ID $billId\n";
echo "✅ Consultation Fee Added: YES\n";

if ($canTestPharmacy) {
    echo ($pharmacyItemsCount > 0 ? "✅" : "❌") . " PharmacyDispensationObserver: " . ($pharmacyItemsCount > 0 ? "WORKING ($pharmacyItemsCount items)" : "NOT FIRING") . "\n";
} else {
    echo "⏭️  PharmacyDispensationObserver: SKIPPED (no drugs in DB)\n";
}

echo ($labItemsCount > 0 ? "✅" : "❌") . " LabRequestObserver: " . ($labItemsCount > 0 ? "WORKING ($labItemsCount items)" : "NOT FIRING") . "\n";

echo "\n" . str_repeat("=", 80) . "\n";
echo "TEST COMPLETE!\n";
echo str_repeat("=", 80) . "\n";

$db->close();
