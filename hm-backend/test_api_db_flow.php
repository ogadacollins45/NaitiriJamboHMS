<?php
/**
 * API Database Integration Test
 * Tests if data flows correctly: API POST → Database → API GET
 */

// Test configuration
$baseUrl = 'http://localhost:8000/api';
$dbHost = '127.0.0.1';
$dbUser = 'root';
$dbPass = '7836sql';
$dbName = 'brixton_hms_fresh';

echo "\n========================================\n";
echo "API → DATABASE INTEGRATION TEST\n";
echo "========================================\n\n";

// Connect to MySQL
$mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($mysqli->connect_error) {
    die("DB Connection failed: " . $mysqli->connect_error);
}

echo "✅ Database connected\n\n";

// Test 1: Get baseline counts
echo "TEST 1: Baseline Data Count\n";
echo "----------------------------\n";
$patients = $mysqli->query("SELECT COUNT(*) as count FROM patients")->fetch_assoc()['count'];
$treatments = $mysqli->query("SELECT COUNT(*) as count FROM treatments")->fetch_assoc()['count'];
$bills = $mysqli->query("SELECT COUNT(*) as count FROM bills")->fetch_assoc()['count'];
$billItems = $mysqli->query("SELECT COUNT(*) as count FROM bill_items")->fetch_assoc()['count'];

echo "Patients:    $patients\n";
echo "Treatments:  $treatments\n";
echo "Bills:       $bills\n";
echo "Bill Items:  $billItems\n\n";

// Test 2: Create a test patient via API
echo "TEST 2: POST /api/patients\n";
echo "----------------------------\n";

$patientData = [
    'first_name' => 'API_Test',
    'last_name' => 'Patient',
    'date_of_birth' => '1990-01-01',
    'gender' => 'male',
    'phone' => '0700000000',
    'email' => 'api_test@test.com'
];

$ch = curl_init("$baseUrl/patients");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($patientData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode == 201) {
    $responseData = json_decode($response, true);
    $newPatientId = $responseData['id'] ?? null;
    echo "✅ API Response: HTTP $httpCode\n";
    echo "   Patient ID: $newPatientId\n";
    
    // Verify in database
    sleep(1); // Give DB time to write
    $dbPatient = $mysqli->query("SELECT * FROM patients WHERE id = $newPatientId")->fetch_assoc();
    
    if ($dbPatient) {
        echo "✅ DATABASE VERIFIED: Patient exists\n";
        echo "   Name: {$dbPatient['first_name']} {$dbPatient['last_name']}\n";
        echo "   Email: {$dbPatient['email']}\n";
    } else {
        echo "❌ DATABASE ERROR: Patient NOT found in database!\n";
    }
} else {
    echo "❌ API Error: HTTP $httpCode\n";
    echo "   Response: $response\n";
}

echo "\n";

// Test 3: Check if we can GET the patient back
if (isset($newPatientId)) {
    echo "TEST 3: GET /api/patients/$newPatientId\n";
    echo "----------------------------\n";
    
    $ch = curl_init("$baseUrl/patients/$newPatientId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200) {
        $patient = json_decode($response, true);
        echo "✅ GET Request successful\n";
        echo "   Retrieved: {$patient['first_name']} {$patient['last_name']}\n";
    } else {
        echo "❌ GET Request failed: HTTP $httpCode\n";
    }
    echo "\n";
}

// Test 4: Check recent database activity
echo "TEST 4: Recent Database Activity\n";
echo "----------------------------\n";
$recent = $mysqli->query("
    SELECT 'patients' as `table`, MAX(created_at) as last_insert FROM patients
    UNION
    SELECT 'treatments', MAX(created_at) FROM treatments  
    UNION
    SELECT 'bills', MAX(created_at) FROM bills
   UNION
    SELECT 'pharmacy_dispensations', MAX(created_at) FROM pharmacy_dispensations
    ORDER BY last_insert DESC LIMIT 5
")->fetch_all(MYSQLI_ASSOC);

foreach ($recent as $row) {
    $table = $row['table'];
    $time = $row['last_insert'] ?: 'Never';
    echo str_pad($table, 30) . ": $time\n";
}

echo "\n";

// Test 5: Check if observers are working (bills auto-created?)
echo "TEST 5: Observer Status Check\n";
echo "----------------------------\n";
$dispensations = $mysqli->query("SELECT COUNT(*) as count FROM pharmacy_dispensations")->fetch_assoc()['count'];
$billsFromDisp = $mysqli->query("
    SELECT COUNT(DISTINCT bill_id) as count 
    FROM bill_items 
    WHERE pharmacy_dispensation_id IS NOT NULL
")->fetch_assoc()['count'];

echo "Pharmacy Dispensations: $dispensations\n";
echo "Bills with Dispensation Items: $billsFromDisp\n";

if ($dispensations > 0 && $billsFromDisp > 0) {
    echo "✅ Observers appear to be working!\n";
} else if ($dispensations > 0) {
    echo "⚠️  Dispensations exist but no bill items created\n";
    echo "   → PharmacyDispensationObserver may not be firing\n";
} else {
    echo "ℹ️  No dispensations yet to test observer\n";
}

echo "\n========================================\n";
echo "Integration test complete!\n";
echo "========================================\n";

$mysqli->close();
