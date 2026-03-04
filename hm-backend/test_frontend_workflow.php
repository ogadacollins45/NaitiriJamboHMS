<?php
/**
 * Complete Frontend Workflow Test
 * Simulates exact data flow from frontend → API → Database
 * Tests: Patient → Treatment → Pharmacy → Lab → Billing (with Observers)
 */

$baseUrl = 'http://localhost:8000/api';
$dbHost = '127.0.0.1';
$dbUser = 'root';
$dbPass = '7836sql';
$dbName = 'brixton_hms_fresh';

// MySQL connection
$db = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($db->connect_error) {
    die("❌ DB Connection failed: " . $db->connect_error);
}

echo "\n" . str_repeat("=", 70) . "\n";
echo "COMPLETE FRONTEND WORKFLOW TEST\n";
echo str_repeat("=", 70) . "\n\n";

// Helper function for API calls
function apiCall($method, $endpoint, $data = null, $baseUrl) {
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

// Helper for MySQL checks
function checkDB($db, $table, $condition = "1=1") {
    $result = $db->query("SELECT * FROM $table WHERE $condition ORDER BY id DESC LIMIT 1");
    return $result ? $result->fetch_assoc() : null;
}

echo "📊 BASELINE DATABASE STATE\n";
echo str_repeat("-", 70) . "\n";
$baselinePatients = $db->query("SELECT COUNT(*) as c FROM patients")->fetch_assoc()['c'];
$baselineTreatments = $db->query("SELECT COUNT(*) as c FROM treatments")->fetch_assoc()['c'];
$baselineBills = $db->query("SELECT COUNT(*) as c FROM bills")->fetch_assoc()['c'];
$baselineBillItems = $db->query("SELECT COUNT(*) as c FROM bill_items")->fetch_assoc()['c'];
echo "Patients: $baselinePatients | Treatments: $baselineTreatments | Bills: $baselineBills | Bill Items: $baselineBillItems\n\n";

// ========================================================================
// STEP 1: Create Patient (as frontend would)
// ========================================================================
echo "🔷 STEP 1: CREATE PATIENT\n";
echo str_repeat("-", 70) . "\n";

$patientData = [
    'first_name' => 'John',
    'last_name' => 'Doe',
    'date_of_birth' => '1985-05-15',
    'gender' => 'male',
    'phone' => '0722123456',
    'email' => 'john.doe@test.com',
    'address' => '123 Test Street',
    'blood_group' => 'O+',
    'allergies' => 'None',
    'emergency_contact_name' => 'Jane Doe',
    'emergency_contact_phone' => '0733456789'
];

$response = apiCall('POST', '/patients', $patientData, $baseUrl);
echo "API Response: HTTP {$response['code']}\n";

if ($response['code'] == 201) {
    $patientId = $response['data']['id'];
    echo "✅ Patient created: ID = $patientId\n";
    
    // Verify in database
    sleep(1);
    $dbPatient = checkDB($db, 'patients', "id = $patientId");
    if ($dbPatient) {
        echo "✅ DATABASE CONFIRMED: {$dbPatient['first_name']} {$dbPatient['last_name']}\n\n";
    } else {
        echo "❌ DATABASE ERROR: Patient not found!\n\n";
        exit(1);
    }
} else {
    echo "❌ API Error: " . ($response['raw'] ?? 'No response') . "\n\n";
    exit(1);
}

// ========================================================================
// STEP 2: Create Treatment with Consultation
// ========================================================================
echo "🔷 STEP 2: CREATE TREATMENT\n";
echo str_repeat("-", 70) . "\n";

$treatmentData = [
    'patient_id' => $patientId,
    'doctor_id' => 1, // Assuming doctor ID 1 exists
    'chief_complaint' => 'Severe headache and fever',
    'examination_notes' => 'Temperature: 38.5°C, BP: 120/80',
    'diagnosis' => 'Possible viral infection',
    'treatment_plan' => 'Rest, hydration, and medication',
    'prescriptions' => []
];

$response = apiCall('POST', "/patients/$patientId/treatments", $treatmentData, $baseUrl);
echo "API Response: HTTP {$response['code']}\n";

if ($response['code'] == 201) {
    $treatmentId = $response['data']['treatment']['id'] ?? null;
    echo "✅ Treatment created: ID = $treatmentId\n";
    
    // Verify treatment in database
    sleep(1);
    $dbTreatment = checkDB($db, 'treatments', "id = $treatmentId");
    if ($dbTreatment) {
        echo "✅ DATABASE CONFIRMED: Treatment exists\n";
    }
    
    // Check if bill was auto-created
    $dbBill = checkDB($db, 'bills', "treatment_id = $treatmentId");
    if ($dbBill) {
        $billId = $dbBill['id'];
        echo "✅ BILL AUTO-CREATED: Bill ID = $billId\n";
        echo "   Subtotal: {$dbBill['subtotal']}\n";
        
        // Check bill items
        $billItems = $db->query("SELECT * FROM bill_items WHERE bill_id = $billId")->fetch_all(MYSQLI_ASSOC);
        echo "   Bill Items: " . count($billItems) . "\n";
        foreach ($billItems as $item) {
            echo "   - {$item['category']}: {$item['description']} | Qty: {$item['quantity']} | Amount: {$item['amount']}\n";
        }
    } else {
        echo "⚠️  No bill auto-created yet\n";
    }
    echo "\n";
} else {
    echo "❌ API Error\n\n";
    exit(1);
}

// ========================================================================
// STEP 3: Create Pharmacy Prescription (as frontend would)
// ========================================================================
echo "🔷 STEP 3: CREATE PHARMACY PRESCRIPTION\n";
echo str_repeat("-", 70) . "\n";

$prescriptionData = [
    'patient_id' => $patientId,
    'treatment_id' => $treatmentId,
    'diagnosis' => 'Viral infection',
    'prescription_type' => 'outpatient',
    'priority' => 'routine',
    'drugs' => [
        [
            'drug_id' => 1, // Assuming drug ID 1 exists
            'quantity_prescribed' => 20,
            'dosage' => '500mg',
            'frequency' => 'Twice daily',
            'route' => 'oral',
            'duration_days' => 7,
            'special_instructions' => 'Take after meals'
        ]
    ]
];

$response = apiCall('POST', '/pharmacy/prescriptions', $prescriptionData, $baseUrl);
echo "API Response: HTTP {$response['code']}\n";

if ($response['code'] == 201) {
    $prescriptionId = $response['data']['id'] ?? null;
    echo "✅ Pharmacy prescription created: ID = $prescriptionId\n";
    
    // Verify in database
    sleep(1);
    $dbPrescription = checkDB($db, 'pharmacy_prescriptions', "id = $prescriptionId");
    if ($dbPrescription) {
        echo "✅ DATABASE CONFIRMED: Prescription #  {$dbPrescription['prescription_number']}\n";
    }
    echo "\n";
} else {
    echo "⚠️  Prescription creation issue: " . ($response['raw'] ?? 'No response') . "\n\n";
    $prescriptionId = null;
}

// ========================================================================
// STEP 4: Dispense Drugs (THIS SHOULD TRIGGER OBSERVER!)
// ========================================================================
if ($prescriptionId) {
    echo "🔷 STEP 4: DISPENSE DRUGS (Observer Test)\n";
    echo str_repeat("-", 70) . "\n";
    
    $dispensationData = [
        'prescription_id' => $prescriptionId,
        'items' => [
            [
                'prescription_item_id' => 1, // Would come from prescription items
                'drug_id' => 1,
                'batch_id' => 1,
                'quantity_dispensed' => 20,
                'unit_price' => 5.00
            ]
        ]
    ];
    
    $response = apiCall('POST', '/pharmacy/dispensations/dispense', $dispensationData, $baseUrl);
    echo "API Response: HTTP {$response['code']}\n";
    
    if ($response['code'] == 201 || $response['code'] == 200) {
        $dispensationId = $response['data']['id'] ?? null;
        echo "✅ Drugs dispensed: Dispensation ID = $dispensationId\n";
        
        // CRITICAL: Check if PharmacyDispensationObserver fired!
        sleep(2); // Give observer time to process
        
        $billItems = $db->query("
            SELECT * FROM bill_items 
            WHERE bill_id = $billId AND pharmacy_dispensation_id IS NOT NULL
        ")->fetch_all(MYSQLI_ASSOC);
        
        if (count($billItems) > 0) {
            echo "✅ OBSERVER FIRED! Bill items auto-created from dispensation:\n";
            foreach ($billItems as $item) {
                echo "   - {$item['description']} | Qty: {$item['quantity']} | Price: {$item['amount']} | Total: {$item['subtotal']}\n";
            }
        } else {
            echo "❌ OBSERVER DID NOT FIRE! No bill items created from dispensation\n";
        }
        
        // Check updated bill total
        $updatedBill = checkDB($db, 'bills', "id = $billId");
        echo "\n📋 Updated Bill Total: {$updatedBill['total_amount']}\n";
    } else {
        echo "⚠️  Dispensation issue\n";
    }
    echo "\n";
}

// ========================================================================
// STEP 5: Create Lab Request (THIS SHOULD ALSO TRIGGER OBSERVER!)
// ========================================================================
echo "🔷 STEP 5: CREATE LAB REQUEST (Observer Test)\n";
echo str_repeat("-", 70) . "\n";

$labRequestData = [
    'patient_id' => $patientId,
    'treatment_id' => $treatmentId,
    'priority' => 'routine',
    'clinical_notes' => 'Check for infection markers',
    'tests' => [1, 2] // Assuming test template IDs 1 and 2 exist
];

$response = apiCall('POST', '/lab/requests', $labRequestData, $baseUrl);
echo "API Response: HTTP {$response['code']}\n";

if ($response['code'] == 201) {
    $labRequestId = $response['data']['id'] ?? null;
    echo "✅ Lab request created: ID = $labRequestId\n";
    
    // CRITICAL: Check if LabRequestObserver fired!
    sleep(2);
    
    $labBillItems = $db->query("
        SELECT * FROM bill_items 
        WHERE bill_id = $billId AND lab_request_id IS NOT NULL
    ")->fetch_all(MYSQLI_ASSOC);
    
    if (count($labBillItems) > 0) {
        echo "✅ LAB OBSERVER FIRED! Bill items auto-created from lab request:\n";
        foreach ($labBillItems as $item) {
            echo "   - {$item['description']} | Price: {$item['amount']}\n";
        }
    } else {
        echo "❌ LAB OBSERVER DID NOT FIRE! No bill items created from lab request\n";
    }
    
    // Final bill check
    $finalBill = checkDB($db, 'bills', "id = $billId");
    echo "\n📋 FINAL Bill Total: {$finalBill['total_amount']}\n";
    
    // Show complete bill breakdown
    echo "\n📄 COMPLETE BILL BREAKDOWN:\n";
    $allItems = $db->query("SELECT * FROM bill_items WHERE bill_id = $billId")->fetch_all(MYSQLI_ASSOC);
    $total = 0;
    foreach ($allItems as $item) {
        echo "   {$item['category']}: {$item['description']} | {$item['subtotal']}\n";
        $total += $item['subtotal'];
    }
    echo "   " . str_repeat("-", 60) . "\n";
    echo "   TOTAL: $total\n";
} else {
    echo "⚠️  Lab request issue\n";
}

echo "\n" . str_repeat("=", 70) . "\n";
echo "TEST COMPLETE!\n";
echo str_repeat("=", 70) . "\n";

$db->close();
