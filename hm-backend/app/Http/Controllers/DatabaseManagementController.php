<?php

namespace App\Http\Controllers;

use App\Services\DatabaseManagementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Exception;

class DatabaseManagementController extends Controller
{
    protected $dbService;

    public function __construct(DatabaseManagementService $dbService)
    {
        $this->dbService = $dbService;
    }

    /**
     * Upload SQL file
     */
    public function upload(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|max:10240' // 10MB max
            ]);

            // Check file extension manually (MIME type doesn't work for .sql)
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());
            
            if ($extension !== 'sql') {
                return response()->json([
                    'message' => 'Only .sql files are allowed'
                ], 400);
            }
            
            $filename = time() . '_' . $file->getClientOriginalName();
            
            // Store in sql-uploads directory
            $path = $file->storeAs('sql-uploads', $filename);
            
            if (!$path) {
                return response()->json([
                    'message' => 'Failed to save file to storage',
                    'error' => 'storeAs returned false'
                ], 500);
            }
            
            // Get correct absolute path using Storage facade
            $fullPath = Storage::path($path);
            
            // Verify file was actually saved
            if (!file_exists($fullPath)) {
                return response()->json([
                    'message' => 'File was not saved correctly',
                    'error' => 'File does not exist at: ' . $fullPath,
                    'returned_path' => $path
                ], 500);
            }

            // Validate the SQL file
            $validation = $this->dbService->validateSqlFile($fullPath);

            if (!$validation['valid']) {
                // Delete invalid file
                Storage::delete($path);
                return response()->json([
                    'message' => 'SQL file contains dangerous operations',
                    'errors' => $validation['errors']
                ], 400);
            }

            return response()->json([
                'message' => 'File uploaded successfully',
                'filename' => $filename,
                'path' => $path,
                'full_path' => $fullPath,
                'size' => $file->getSize()
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'error' => $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Upload failed',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Execute SQL file
     */
    public function execute(Request $request)
    {
        $request->validate([
            'filename' => 'required|string',
            'mode' => 'required|in:overwrite,insert,dry-run'
        ]);

        try {
            $filename = $request->filename;
            $mode = $request->mode;
            
            // Construct the storage path
            $storagePath = 'sql-uploads/' . $filename;
            $filePath = Storage::path($storagePath);

            // Check if file exists
            if (!file_exists($filePath)) {
                return response()->json([
                    'message' => 'SQL file not found'
                ], 404);
            }

            // Note: Backup is now created separately before this endpoint is called
            // This allows the backup to be downloaded before the database is wiped

            // Parse SQL file
            $statements = $this->dbService->parseSqlFile($filePath);

            // Execute based on mode
            if ($mode === 'overwrite') {
                $results = $this->dbService->executeOverwrite($statements);
            } elseif ($mode === 'insert') {
                $results = $this->dbService->executeUpdate($statements);
            } elseif ($mode === 'dry-run') {
                $results = $this->dbService->executeDryRun($statements);
            } else {
                return response()->json([
                    'message' => 'Invalid mode specified'
                ], 400);
            }

            // Clean up uploaded file after execution (except for dry-run)
            if ($mode !== 'dry-run') {
                Storage::delete('sql-uploads/' . $filename);
            }

            return response()->json([
                'message' => 'SQL executed successfully',
                'results' => $results
            ], $results['success'] ? 200 : 500);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Execution failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * List available backups
     */
    public function listBackups()
    {
        try {
            $backups = $this->dbService->listBackups();

            return response()->json([
                'backups' => $backups
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to list backups',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a backup immediately
     */
    public function createBackupNow(Request $request)
    {
        try {
            $type = $request->input('type', 'full'); // Default to full backup
            
            $backupFilename = $this->dbService->createBackup($type);

            if (!$backupFilename) {
                return response()->json([
                    'message' => 'Failed to create backup'
                ], 500);
            }

            return response()->json([
                'message' => 'Backup created successfully',
                'filename' => $backupFilename
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to create backup',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a specific backup file
     */
    public function downloadBackup(Request $request)
    {
        $request->validate([
            'filename' => 'required|string'
        ]);

        try {
            $filename = $request->filename;
            $backupPath = storage_path('app/backups/' . $filename);

            // Security: prevent directory traversal
            if (strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false) {
                return response()->json([
                    'message' => 'Invalid filename'
                ], 400);
            }

            // Check if file exists
            if (!file_exists($backupPath)) {
                return response()->json([
                    'message' => 'Backup file not found'
                ], 404);
            }

            return response()->download($backupPath);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to download backup',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a specific backup file
     */
    public function deleteBackup(Request $request)
    {
        $request->validate([
            'filename' => 'required|string'
        ]);

        try {
            $filename = $request->filename;
            $backupPath = storage_path('app/backups/' . $filename);

            // Security: prevent directory traversal
            if (strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false) {
                return response()->json([
                    'message' => 'Invalid filename'
                ], 400);
            }

            // Check if file exists
            if (!file_exists($backupPath)) {
                return response()->json([
                    'message' => 'Backup file not found'
                ], 404);
            }

            // Delete the file
            unlink($backupPath);

            return response()->json([
                'message' => 'Backup deleted successfully'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to delete backup',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
