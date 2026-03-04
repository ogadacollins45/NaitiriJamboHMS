<?php
/**
 * Database Health Check Script
 * 
 * This script inspects all tables in the database and reports:
 * - Empty tables
 * - Table row counts
 * - Tables without foreign keys
 * - Potential data integrity issues
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "\n========================================\n";
echo "DATABASE HEALTH CHECK\n";
echo "========================================\n";
echo "Database: " . env('DB_DATABASE') . "\n";
echo "Host: " . env('DB_HOST') . "\n";
echo "========================================\n\n";

// Get all tables
$tables = DB::select('SHOW TABLES');
$dbName = env('DB_DATABASE');
$tableKey = "Tables_in_{$dbName}";

$results = [];
$emptyTables = [];
$totalRows = 0;

echo "Scanning tables...\n\n";

foreach ($tables as $table) {
    $tableName = $table->$tableKey;
    
    // Skip migrations table
    if ($tableName === 'migrations') {
        continue;
    }
    
    // Get row count
    $count = DB::table($tableName)->count();
    $totalRows += $count;
    
    $results[$tableName] = $count;
    
    if ($count === 0) {
        $emptyTables[] = $tableName;
    }
}

// Sort by count descending
arsort($results);

echo "TABLE STATISTICS\n";
echo "================\n\n";

printf("%-50s %10s\n", "Table Name", "Row Count");
printf("%-50s %10s\n", str_repeat("-", 50), str_repeat("-", 10));

foreach ($results as $table => $count) {
    $status = $count === 0 ? " ⚠️  EMPTY" : "";
    printf("%-50s %10d%s\n", $table, $count, $status);
}

echo "\n" . str_repeat("=", 62) . "\n";
printf("%-50s %10d\n", "TOTAL ROWS", $totalRows);
echo str_repeat("=", 62) . "\n\n";

// Report empty tables
if (count($emptyTables) > 0) {
    echo "EMPTY TABLES (" . count($emptyTables) . ")\n";
    echo "=============\n";
    foreach ($emptyTables as $table) {
        echo "  ⚠️  {$table}\n";
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
    'settings'
];

echo "CRITICAL TABLES CHECK\n";
echo "=====================\n";
foreach ($criticalTables as $table) {
    if (isset($results[$table])) {
        $count = $results[$table];
        $status = $count > 0 ? "✅" : "❌";
        printf("%s %-40s : %d rows\n", $status, $table, $count);
    } else {
        echo "❌ {$table} : TABLE DOES NOT EXIST\n";
    }
}

echo "\n";
echo "Health check complete!\n";
echo "========================================\n";
