<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Exception;

class DatabaseManagementService
{
    /**
     * Create a database backup - tries mysqldump first (like MySQL Workbench), falls back to PHP
     * @param string $type 'full' or 'data_only'
     */
    public function createBackup(string $type = 'full'): string
    {
        $backupDir = storage_path('app/backups');
        
        if (!file_exists($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $prefix = ($type === 'data_only') ? 'backup_data_only_' : 'backup_';
        $filename = $prefix . date('Y-m-d_His') . '.sql';
        $filepath = $backupDir . DIRECTORY_SEPARATOR . $filename;

        // Try mysqldump first (fastest and most reliable - same as MySQL Workbench)
        if ($this->tryMysqldumpBackup($filepath, $type)) {
            return $filename;
        }

        // Fall back to PHP-based backup
        try {
            \Log::info('Using PHP-based backup (mysqldump not available)');
            $sqlDump = $this->generateSqlDump($type);
            file_put_contents($filepath, $sqlDump);
            return $filename;
        } catch (Exception $e) {
            \Log::error('Database backup failed: ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Try to create backup using mysqldump (same method as MySQL Workbench)
     */
    private function tryMysqldumpBackup(string $filepath, string $type = 'full'): bool
    {
        $database = env('DB_DATABASE');
        $username = env('DB_USERNAME');
        $password = env('DB_PASSWORD');
        $host = env('DB_HOST', '127.0.0.1');
        $port = env('DB_PORT', '3306');

        // Try multiple common mysqldump locations
        $mysqldumpPaths = [
            'mysqldump', // In PATH
            'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
            'C:\\xampp\\mysql\\bin\\mysqldump.exe',
            'C:\\wamp64\\bin\\mysql\\mysql8.0.27\\bin\\mysqldump.exe',
        ];

        // Add flags based on type
        // --no-create-info: Do not write CREATE TABLE statements that re-create each dumped table.
        $extraFlags = ($type === 'data_only') ? '--no-create-info --skip-add-drop-table' : '';

        foreach ($mysqldumpPaths as $mysqldump) {
            if (!file_exists($mysqldump) && $mysqldump !== 'mysqldump') {
                continue;
            }

            $command = sprintf(
                '%s --host=%s --port=%s --user=%s %s --single-transaction --routines --triggers %s %s > %s 2>&1',
                escapeshellarg($mysqldump),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                $password ? '--password=' . escapeshellarg($password) : '',
                $extraFlags,
                escapeshellarg($database),
                escapeshellarg($filepath)
            );

            exec($command, $output, $returnCode);
            
            if ($returnCode === 0 && file_exists($filepath) && filesize($filepath) > 0) {
                \Log::info("Backup created using mysqldump (Type: $type)");
                return true;
            }
        }

        return false;
    }

    /**
     * Generate SQL dump using pure PHP with extended INSERTs (similar to mysqldump)
     */
    private function generateSqlDump(string $type = 'full'): string
    {
        $sql = "-- Database Backup (PHP Method)\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $sql .= "-- Type: {$type}\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n";
        $sql .= "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n";
        $sql .= "SET time_zone = '+00:00';\n\n";

        // Get all tables
        $tables = DB::select('SHOW TABLES');
        $dbName = DB::getDatabaseName();
        $tableKey = "Tables_in_{$dbName}";

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;
            
            // Only include structure if full backup
            if ($type === 'full') {
                // Get CREATE TABLE statement
                $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`");
                $sql .= "-- Table: {$tableName}\n";
                $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
                $sql .= $createTable[0]->{'Create Table'} . ";\n\n";
            } else {
                 $sql .= "-- Data for table: {$tableName}\n";
            }

            // Get table data with extended INSERTs (like mysqldump)
            $rows = DB::table($tableName)->get();
            
            if ($rows->count() > 0) {
                // Get column names
                $firstRow = (array)$rows->first();
                $columns = array_keys($firstRow);
                $columnList = '`' . implode('`, `', $columns) . '`';
                
                // Group rows into extended INSERT statements (100 rows per statement)
                $chunks = $rows->chunk(100);
                foreach ($chunks as $chunk) {
                    $valuesList = [];
                    foreach ($chunk as $row) {
                        $values = [];
                        foreach ((array)$row as $value) {
                            $values[] = $this->escapeValue($value);
                        }
                        $valuesList[] = '(' . implode(',', $values) . ')';
                    }
                    $sql .= "INSERT INTO `{$tableName}` ({$columnList}) VALUES\n";
                    $sql .= implode(",\n", $valuesList) . ";\n";
                }
                $sql .= "\n";
            }
        }

        $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";
        
        return $sql;
    }

    /**
     * Properly escape a value for SQL (using PDO quote for security)
     */
    private function escapeValue($value): string
    {
        if ($value === null) {
            return 'NULL';
        }
        
        // Use PDO's quote method for proper MySQL escaping
        try {
            return DB::getPdo()->quote($value);
        } catch (Exception $e) {
            // Fallback to addslashes if PDO quote fails
            return "'" . addslashes($value) . "'";
        }
    }

    /**
     * Validate SQL file for dangerous operations
     */
    public function validateSqlFile(string $filePath): array
    {
        $content = file_get_contents($filePath);
        $errors = [];

        // Only check for truly dangerous operations (DROP)
        // CREATE DATABASE/SCHEMA are allowed but will be skipped during execution
        $dangerousPatterns = [
            '/DROP\s+DATABASE/i' => 'DROP DATABASE is not allowed',
            '/DROP\s+SCHEMA/i' => 'DROP SCHEMA is not allowed',
        ];

        foreach ($dangerousPatterns as $pattern => $message) {
            if (preg_match($pattern, $content)) {
                $errors[] = $message;
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Parse SQL file into executable statements
     */
    public function parseSqlFile(string $filePath): array
    {
        $content = file_get_contents($filePath);
        
        // Remove comments
        $content = preg_replace('/--.*$/m', '', $content);
        $content = preg_replace('/\/\*.*?\*\//s', '', $content);
        
        // Split by semicolons (respecting strings and escaped characters)
        $statements = [];
        $currentStatement = '';
        $inString = false;
        $stringChar = null;
        $length = strlen($content);
        
        for ($i = 0; $i < $length; $i++) {
            $char = $content[$i];
            $nextChar = ($i + 1 < $length) ? $content[$i + 1] : null;
            
            // Handle string delimiters
            if (($char === '"' || $char === "'") && !$inString) {
                $inString = true;
                $stringChar = $char;
                $currentStatement .= $char;
            } elseif ($char === $stringChar && $inString) {
                // Check if it's escaped (doubled quote like '' or "")
                if ($nextChar === $stringChar) {
                    // It's a doubled quote (escape), include both
                    $currentStatement .= $char . $nextChar;
                    $i++; // Skip next character
                } else {
                    // End of string
                    $inString = false;
                    $stringChar = null;
                    $currentStatement .= $char;
                }
            } elseif ($char === '\\' && $inString && $nextChar) {
                // Backslash escape - convert to doubled quote for MySQL compatibility
                if ($nextChar === "'" || $nextChar === '"') {
                    // Convert \' to '' or \" to ""
                    $currentStatement .= $nextChar . $nextChar;
                    $i++; // Skip next character
                } else {
                    // Other backslash escapes (like \n, \r, etc.) - keep as is
                    $currentStatement .= $char . $nextChar;
                    $i++; // Skip next character
                }
            } elseif ($char === ';' && !$inString) {
                // Statement separator
                $statement = trim($currentStatement);
                if (!empty($statement)) {
                    $statements[] = $statement;
                }
                $currentStatement = '';
            } else {
                $currentStatement .= $char;
            }
        }
        
        // Add last statement if exists
        $statement = trim($currentStatement);
        if (!empty($statement)) {
            $statements[] = $statement;
        }
        
        return $statements;
    }

    /**
     * Execute SQL in overwrite mode (drop all tables, then execute script as-is)
     */
    public function executeOverwrite(array $statements): array
    {
        $results = [
            'success' => true,
            'affected_rows' => 0,
            'executed_statements' => 0,
            'errors' => []
        ];

        try {
            // Disable foreign key checks for the entire operation
            DB::statement('SET FOREIGN_KEY_CHECKS = 0');
            
            // First, drop all tables
            $tables = DB::select('SHOW TABLES');
            $dbName = DB::getDatabaseName();
            $tableKey = "Tables_in_{$dbName}";
            
            foreach ($tables as $table) {
                $tableName = $table->$tableKey;
                DB::statement("DROP TABLE IF EXISTS `{$tableName}`");
            }

            // Now execute all statements from the SQL file
            foreach ($statements as $statement) {
                // Skip empty statements, database operations, session variables, and GTID statements
                if (empty(trim($statement)) || 
                    preg_match('/CREATE\s+(DATABASE|SCHEMA)/i', $statement) ||
                    preg_match('/USE\s+/i', $statement) ||
                    preg_match('/SET\s+@@/i', $statement) ||
                    preg_match('/SET\s+GLOBAL/i', $statement) ||
                    preg_match('/SET\s+SESSION/i', $statement)) {
                    continue;
                }

                try {
                    // Execute the statement as-is
                    if (preg_match('/^(INSERT|UPDATE|DELETE)\s+/i', $statement)) {
                        $affectedRows = DB::affectingStatement($statement);
                        $results['affected_rows'] += $affectedRows;
                    } else {
                        DB::statement($statement);
                    }
                    $results['executed_statements']++;
                } catch (Exception $e) {
                    // Log error but continue
                    $results['errors'][] = $e->getMessage();
                }
            }

            // Re-enable foreign key checks after everything is done
            DB::statement('SET FOREIGN_KEY_CHECKS = 1');

        } catch (Exception $e) {
            $results['success'] = false;
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Check if a SQL statement is dangerous (UPDATE, DELETE, DROP)
     */
    private function isDangerousStatement(string $statement): ?string
    {
        $statement = trim($statement);
        
        // Check for DROP statements (any variant)
        if (preg_match('/^\s*DROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW|TRIGGER|PROCEDURE|FUNCTION)/i', $statement)) {
            return 'DROP operations are not allowed in insert mode';
        }
        
        // Check for DELETE statements
        if (preg_match('/^\s*DELETE\s+FROM/i', $statement)) {
            return 'DELETE operations are not allowed in insert mode';
        }
        
        // Check for TRUNCATE statements
        if (preg_match('/^\s*TRUNCATE\s+(TABLE)?/i', $statement)) {
            return 'TRUNCATE operations are not allowed in insert mode';
        }
        
        // Check for UPDATE statements
        if (preg_match('/^\s*UPDATE\s+/i', $statement)) {
            return 'UPDATE operations are not allowed in insert mode';
        }
        
        // Check for ALTER TABLE ... DROP
        if (preg_match('/^\s*ALTER\s+TABLE\s+.*\s+DROP\s+/i', $statement)) {
            return 'ALTER TABLE DROP operations are not allowed in insert mode';
        }
        
        return null; // Statement is safe
    }

    /**
     * Filter dangerous statements from SQL array
     */
    private function filterDangerousStatements(array $statements): array
    {
        $safe = [];
        $filtered = [];
        
        foreach ($statements as $statement) {
            $reason = $this->isDangerousStatement($statement);
            if ($reason) {
                $filtered[] = [
                    'statement' => substr(trim($statement), 0, 100) . (strlen($statement) > 100 ? '...' : ''),
                    'reason' => $reason
                ];
            } else {
                $safe[] = $statement;
            }
        }
        
        return [
            'safe' => $safe,
            'filtered' => $filtered
        ];
    }

    /**
     * Execute SQL in update mode (insert only if not exists)
     */
    public function executeUpdate(array $statements): array
    {
        $results = [
            'success' => true,
            'affected_rows' => 0,
            'executed_statements' => 0,
            'filtered_statements' => 0,
            'filtered_details' => [],
            'errors' => []
        ];

        try {
            // Step 1: Filter dangerous statements
            \Log::info('Filtering dangerous statements from SQL file');
            $filtered = $this->filterDangerousStatements($statements);
            $safeStatements = $filtered['safe'];
            $filteredStatements = $filtered['filtered'];
            
            $results['filtered_statements'] = count($filteredStatements);
            $results['filtered_details'] = $filteredStatements;
            
            \Log::info('Filtered ' . count($filteredStatements) . ' dangerous statements');
            \Log::info('Processing ' . count($safeStatements) . ' safe statements');

            // Step 2: Disable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS = 0');
            \Log::info('Disabled foreign key checks');

            // Step 3: Execute safe statements
            foreach ($safeStatements as $statement) {
                // Skip empty statements, database operations, and session variables
                if (empty(trim($statement)) || 
                    preg_match('/CREATE\s+(DATABASE|SCHEMA)/i', $statement) ||
                    preg_match('/USE\s+/i', $statement) ||
                    preg_match('/SET\s+@@/i', $statement) ||
                    preg_match('/SET\s+GLOBAL/i', $statement) ||
                    preg_match('/SET\s+SESSION/i', $statement) ||
                    preg_match('/SET\s+FOREIGN_KEY_CHECKS/i', $statement)) {
                    continue;
                }

                try {
                    // Convert INSERT to INSERT IGNORE for MySQL
                    if (preg_match('/^INSERT\s+INTO/i', $statement)) {
                        $statement = preg_replace('/^INSERT\s+INTO/i', 'INSERT IGNORE INTO', $statement);
                    }

                    // Execute the statement
                    if (preg_match('/^(INSERT|CREATE)/i', $statement)) {
                        DB::statement($statement);
                        $results['executed_statements']++;
                        
                        // Try to get affected rows for INSERT statements
                        if (preg_match('/^INSERT/i', $statement)) {
                            $results['affected_rows'] += DB::affectingStatement($statement);
                        }
                    }
                } catch (Exception $e) {
                    // Ignore "table already exists" errors for CREATE TABLE
                    if (preg_match('/CREATE\s+TABLE/i', $statement) && 
                        str_contains($e->getMessage(), 'already exists')) {
                        \Log::info('Table already exists, skipping: ' . substr($statement, 0, 50));
                        continue;
                    }
                    
                    // Ignore duplicate key errors (expected with INSERT IGNORE)
                    if (str_contains($e->getMessage(), 'Duplicate entry')) {
                        \Log::info('Duplicate entry skipped');
                        continue;
                    }
                    
                    // Log other errors but continue execution
                    $errorMsg = substr($e->getMessage(), 0, 200);
                    $results['errors'][] = $errorMsg;
                    \Log::error('SQL execution error: ' . $errorMsg);
                }
            }

            // Step 4: Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS = 1');
            \Log::info('Re-enabled foreign key checks');

            \Log::info('Insert operation completed. Executed: ' . $results['executed_statements'] . ', Filtered: ' . $results['filtered_statements']);

        } catch (Exception $e) {
            // Ensure foreign key checks are re-enabled even on error
            try {
                DB::statement('SET FOREIGN_KEY_CHECKS = 1');
            } catch (Exception $fkError) {
                \Log::error('Failed to re-enable foreign key checks: ' . $fkError->getMessage());
            }
            
            $results['success'] = false;
            $results['errors'][] = $e->getMessage();
            \Log::error('Insert operation failed: ' . $e->getMessage());
        }

        return $results;
    }

    /**
     * List available backups
     */
    public function listBackups(): array
    {
        $backupPath = storage_path('app/backups');
        
        if (!file_exists($backupPath)) {
            return [];
        }

        $files = scandir($backupPath, SCANDIR_SORT_DESCENDING);
        $backups = [];

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $filePath = $backupPath . '/' . $file;
            $backups[] = [
                'filename' => $file,
                'size' => filesize($filePath),
                'created_at' => date('Y-m-d H:i:s', filemtime($filePath))
            ];
        }

        return $backups;
    }

    /**
     * Dry run mode - preview what would be executed without actually executing
     */
    public function executeDryRun(array $statements): array
    {
        $results = [
            'success' => true,
            'total_statements' => count($statements),
            'safe_statements' => [],
            'filtered_statements' => [],
            'preview' => []
        ];

        try {
            // Filter dangerous statements
            \Log::info('Dry run: Analyzing SQL file');
            $filtered = $this->filterDangerousStatements($statements);
            $safeStatements = $filtered['safe'];
            $filteredStatements = $filtered['filtered'];
            
            $results['filtered_statements'] = $filteredStatements;
            
            // Analyze safe statements
            foreach ($safeStatements as $statement) {
                // Skip empty statements and session variables
                if (empty(trim($statement)) || 
                    preg_match('/CREATE\s+(DATABASE|SCHEMA)/i', $statement) ||
                    preg_match('/USE\s+/i', $statement) ||
                    preg_match('/SET\s+@@/i', $statement) ||
                    preg_match('/SET\s+GLOBAL/i', $statement) ||
                    preg_match('/SET\s+SESSION/i', $statement) ||
                    preg_match('/SET\s+FOREIGN_KEY_CHECKS/i', $statement)) {
                    continue;
                }

                // Categorize statement type
                $type = 'UNKNOWN';
                if (preg_match('/^CREATE\s+TABLE/i', $statement)) {
                    $type = 'CREATE TABLE';
                } elseif (preg_match('/^INSERT\s+INTO/i', $statement)) {
                    $type = 'INSERT';
                } elseif (preg_match('/^CREATE\s+INDEX/i', $statement)) {
                    $type = 'CREATE INDEX';
                } elseif (preg_match('/^ALTER\s+TABLE/i', $statement)) {
                    $type = 'ALTER TABLE';
                }

                $results['safe_statements'][] = [
                    'type' => $type,
                    'statement' => substr(trim($statement), 0, 150) . (strlen($statement) > 150 ? '...' : '')
                ];
            }

            $results['preview'] = [
                'total_statements' => count($statements),
                'safe_statements_count' => count($results['safe_statements']),
                'filtered_statements_count' => count($filteredStatements),
                'will_execute' => count($results['safe_statements']),
                'will_skip' => count($filteredStatements)
            ];

            \Log::info('Dry run completed. Safe: ' . count($results['safe_statements']) . ', Filtered: ' . count($filteredStatements));

        } catch (Exception $e) {
            $results['success'] = false;
            $results['error'] = $e->getMessage();
            \Log::error('Dry run failed: ' . $e->getMessage());
        }

        return $results;
    }
}
