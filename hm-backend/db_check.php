<?php
// Simple database check without using Laravel's console

$host = '127.0.0.1';
$user = 'root';
$pass = '7836sql';
$db = 'brixton_hms_fresh';

try {
    $mysqli = new mysqli($host, $user, $pass, $db);
    
    if ($mysqli->connect_error) {
        die("Connection failed: " . $mysqli->connect_error);
    }
    
    echo "\n========================================\n";
    echo "DATABASE HEALTH CHECK\n";
    echo "========================================\n";
    echo "Database: {$db}\n";
    echo "Host: {$host}\n";
    echo "========================================\n\n";
    
    // Get all tables
    $result = $mysqli->query("SHOW TABLES");
    
    $tables = [];
    while ($row = $result->fetch_array()) {
        $tables[] = $row[0];
    }
    
    echo "Found " . count($tables) . " tables\n\n";
    echo "TABLE STATISTICS\n";
    echo "================\n\n";
    
    printf("%-50s %10s\n", "Table Name", "Row Count");
    printf("%-50s %10s\n", str_repeat("-", 50), str_repeat("-", 10));
    
    $emptyTables = [];
    $totalRows = 0;
    $tableData = [];
    
    foreach ($tables as $table) {
        if ($table === 'migrations') continue;
        
        $countResult = $mysqli->query("SELECT COUNT(*) as count FROM `{$table}`");
        $count = $countResult->fetch_assoc()['count'];
        
        $tableData[$table] = $count;
        $totalRows += $count;
        
        if ($count == 0) {
            $emptyTables[] = $table;
        }
    }
    
    // Sort by count descending
    arsort($tableData);
    
    foreach ($tableData as $table => $count) {
        $status = $count === 0 ? " ⚠️  EMPTY" : "";
        printf("%-50s %10d%s\n", $table, $count, $status);
    }
    
    echo "\n" . str_repeat("=", 62) . "\n";
    printf("%-50s %10d\n", "TOTAL ROWS", $totalRows);
    echo str_repeat("=", 62) . "\n\n";
    
    // Report empty tables
    if (count($emptyTables) > 0) {
        echo "⚠️  EMPTY TABLES (" . count($emptyTables) . ")\n";
        echo "=============\n";
        foreach ($emptyTables as $table) {
            echo "  • {$table}\n";
        }
        echo "\n";
    } else {
        echo "✅ No empty tables found!\n\n";
    }
    
    // Check for critical tables
    $criticalTables = [
        'patients',
        'treatments', 
        'bills',
        'bill_items',
        'pharmacy_drugs',
        'pharmacy_prescriptions',
        'pharmacy_dispensations',
        'lab_requests',
        'lab_test_templates',
        'settings',
        'staff',
        'doctors'
    ];
    
    echo "CRITICAL TABLES CHECK\n";
    echo "=====================\n";
    $issuesFound = false;
    foreach ($criticalTables as $table) {
        if (isset($tableData[$table])) {
            $count = $tableData[$table];
            if ($count > 0) {
                echo "✅ " . str_pad($table, 40) . " : {$count} rows\n";
            } else {
                echo "❌ " . str_pad($table, 40) . " : EMPTY\n";
                $issuesFound = true;
            }
        } else {
            echo "❌ " . str_pad($table, 40) . " : TABLE MISSING\n";
            $issuesFound = true;
        }
    }
    
    echo "\n";
    
    if (!$issuesFound) {
        echo "✅ All critical tables have data!\n";
    } else {
        echo "⚠️  Some critical tables are empty or missing\n";
    }
    
    echo "\n========================================\n";
    echo "Health check complete!\n";
    echo "========================================\n";
    
    $mysqli->close();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
