<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    PatientController,
    TreatmentController,
    DiagnosisController,
    DoctorController,
    AppointmentController,
    InventoryController,
    PrescriptionController,
    BillingController,
    BillingHelperController,
    QueueController,
    SettingsController,
    PharmacyController,
    TriageController,
    DatabaseManagementController,
    MainStoreDrugController,
    DrugMigrationController,
    AdmissionController,
    NotificationController
};

// Health check endpoint (no authentication required)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIsoString(),
        'service' => 'Naitiri Jambo HMS API'
    ], 200);
});

// TEMPORARY DEBUG ENDPOINT - remove after diagnosing
Route::get('/debug/last-error', function (\Illuminate\Http\Request $request) {
    if ($request->query('key') !== 'njhms-debug-2026') {
        return response()->json(['error' => 'forbidden'], 403);
    }
    $logFile = storage_path('logs/laravel.log');
    if (!file_exists($logFile)) {
        return response()->json(['log' => 'No log file found']);
    }
    $lines = array_slice(file($logFile), -80);
    return response()->json(['log' => implode('', $lines)]);
});

/** Patients, Treatments, and Diagnoses */
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/patients', [PatientController::class, 'index']);
    Route::get('/patients/incomplete', [PatientController::class, 'getIncompletePatients']);
    Route::post('/patients', [PatientController::class, 'store']);
    Route::get('/patients/{id}', [PatientController::class, 'show']);
    Route::put('/patients/{id}', [PatientController::class, 'update']);

    Route::get('/patients/{id}/treatments', [TreatmentController::class, 'index']);
    Route::post('/patients/{id}/treatments', [TreatmentController::class, 'store']);
    Route::get('/treatments/today', [TreatmentController::class, 'getTodaysTreatments']);
    Route::put('/treatments/{id}', [TreatmentController::class, 'update']);
    Route::delete('/treatments/{id}', [TreatmentController::class, 'destroy']);

    // Diagnosis routes
    Route::post('/treatments/{id}/diagnoses', [DiagnosisController::class, 'store']);
    Route::delete('/diagnoses/{id}', [DiagnosisController::class, 'destroy']);

    Route::get('/doctors', [DoctorController::class, 'index']);
    Route::post('/doctors', [DoctorController::class, 'store']);
});

Route::get('/patients/{id}/appointments', [AppointmentController::class, 'index']);
Route::get('/appointments', [AppointmentController::class, 'index']); // For doctor filtering
Route::post('/appointments', [AppointmentController::class, 'store']);
Route::post('/appointments/{id}/complete', [AppointmentController::class, 'complete']);
// update appointment status
Route::put('/appointments/{id}', [AppointmentController::class, 'update']);

Route::get('/inventory', [InventoryController::class, 'index']);
Route::post('/inventory', [InventoryController::class, 'store']);
Route::get('/inventory/{id}', [InventoryController::class, 'show']);
Route::put('/inventory/{id}', [InventoryController::class, 'update']);
Route::delete('/inventory/{id}', [InventoryController::class, 'destroy']);
Route::post('/inventory/{id}/restock', [InventoryController::class, 'restock']);

// Suppliers management
Route::get('/suppliers', [\App\Http\Controllers\SupplierController::class, 'index']);
Route::post('/suppliers', [\App\Http\Controllers\SupplierController::class, 'store']);
Route::put('/suppliers/{id}', [\App\Http\Controllers\SupplierController::class, 'update']);
Route::delete('/suppliers/{id}', [\App\Http\Controllers\SupplierController::class, 'destroy']);


Route::get('/prescriptions', [PrescriptionController::class, 'index']);
Route::get('/prescriptions/{id}', [PrescriptionController::class, 'show']);
Route::post('/prescriptions', [PrescriptionController::class, 'store']);
Route::delete('/prescriptions/{id}', [PrescriptionController::class, 'destroy']);
Route::get('/patients/{id}/deleted-prescriptions', [PrescriptionController::class, 'deletedPrescriptions']);


/** Billing */
Route::get('/bills', [BillingController::class, 'index']);
Route::get('/bills/{id}', [BillingController::class, 'show']);
Route::post('/bills', [BillingController::class, 'store']);
Route::post('/bills/{id}/payments', [BillingController::class, 'recordPayment']); // <-- normalized
Route::get('/billing/by-treatment/{treatmentId}', [BillingController::class, 'getByTreatment']);

/** Helper endpoints for billing UI */
Route::get('/billing/patients', [BillingHelperController::class, 'getBillablePatients']);
Route::get('/billing/pending', [BillingController::class, 'pending']);
Route::get('/billing/cleared', [BillingController::class, 'cleared']);


use App\Http\Controllers\DashboardController;

Route::get('/dashboard', [DashboardController::class, 'index']);

use App\Http\Controllers\StaffController;

Route::get('/staff', [StaffController::class, 'index']);
Route::post('/staff', [StaffController::class, 'store']);
Route::get('/staff/{id}', [StaffController::class, 'show']);
Route::delete('/staff/{id}', [StaffController::class, 'destroy']);

Route::apiResource('staff', StaffController::class);

use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;

Route::get('/staff-documents/{filename}', function ($filename) {
    // Try to find in public disk (storage/app/public/staff_docs)
    $path = Storage::disk('public')->path('staff_docs/' . $filename);

    if (!Storage::disk('public')->exists('staff_docs/' . $filename)) {
        return response()->json(['error' => 'File not found'], 404);
    }

    $mimeType = Storage::disk('public')->mimeType('staff_docs/' . $filename);

    return Response::make(Storage::disk('public')->get('staff_docs/' . $filename), 200, [
        'Content-Type' => $mimeType,
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => 'Origin, Content-Type, Accept',
        // ✅ Inline preview hint
        'Content-Disposition' => 'inline; filename="'.$filename.'"',
        'X-Content-Type-Options' => 'nosniff',
    ]);
});

/** Database Management Routes */
Route::group(['prefix' => 'admin/database'], function () {
    Route::post('/upload', [DatabaseManagementController::class, 'upload']);
    Route::post('/execute', [DatabaseManagementController::class, 'execute']);
    Route::get('/backups', [DatabaseManagementController::class, 'listBackups']);
    Route::post('/backups/create', [DatabaseManagementController::class, 'createBackupNow']);
    Route::post('/backups/download', [DatabaseManagementController::class, 'downloadBackup']);
    Route::delete('/backups/delete', [DatabaseManagementController::class, 'deleteBackup']);
});

use App\Http\Controllers\AuthController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ✅ Protected Resources
    Route::apiResource('staff', StaffController::class);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    /** Queue Management - Protected Routes */
    Route::get('/queue', [QueueController::class, 'index']);
    Route::post('/queue', [QueueController::class, 'store']);
    Route::post('/queue/{id}/attend', [QueueController::class, 'attend']);
    Route::delete('/queue/{id}', [QueueController::class, 'destroy']);
    Route::get('/queue/stats', [QueueController::class, 'stats']);
    Route::get('/queue/attended-stats', [QueueController::class, 'getAttendedStats']);

    /** Settings - Admin Only */
    Route::get('/settings', [SettingsController::class, 'index']);
    
    /** User Profile Update - All authenticated users (must come before {key}) */
    Route::put('/settings/update', [SettingsController::class, 'updateProfile']);
    
    Route::get('/settings/{key}', [SettingsController::class, 'show']);
    Route::put('/settings/{key}', [SettingsController::class, 'update']);
    Route::post('/settings', [SettingsController::class, 'store']);


    /** Pharmacy Drug Search - All Authenticated Users (for prescription autocomplete) */
    Route::get('/pharmacy/drugs', [\App\Http\Controllers\PharmacyDrugController::class, 'index']);
    Route::get('/pharmacy/drugs/{id}', [\App\Http\Controllers\PharmacyDrugController::class, 'show']);

    /** Pharmacy Drug Management - Admin and Pharmacist */
    Route::middleware('role:admin,pharmacist')->group(function () {
        Route::post('/pharmacy/drugs', [\App\Http\Controllers\PharmacyDrugController::class, 'store']);
        Route::put('/pharmacy/drugs/{id}', [\App\Http\Controllers\PharmacyDrugController::class, 'update']);
        Route::delete('/pharmacy/drugs/{id}', [\App\Http\Controllers\PharmacyDrugController::class, 'destroy']);
        Route::post('/pharmacy/drugs/{id}/add-stock', [\App\Http\Controllers\PharmacyDrugController::class, 'addStock']);
        Route::post('/pharmacy/drugs/{id}/check-interaction', [\App\Http\Controllers\PharmacyDrugController::class, 'checkInteraction']);
        Route::post('/pharmacy/drugs/{id}/send-to-main-store', [\App\Http\Controllers\PharmacyDrugController::class, 'sendToMainStore']);
        Route::post('/pharmacy/drugs/{id}/reorder', [\App\Http\Controllers\PharmacyDrugController::class, 'reorder']);
    });

    /** Database Management - Admin Only */
    Route::middleware('role:admin')->group(function () {
        Route::post('/admin/database/upload', [DatabaseManagementController::class, 'upload']);
        Route::post('/admin/database/execute', [DatabaseManagementController::class, 'execute']);
        Route::get('/admin/database/backups', [DatabaseManagementController::class, 'listBackups']);
        Route::post('/admin/database/backups/create', [DatabaseManagementController::class, 'createBackupNow']);
        Route::post('/admin/database/backups/download', [DatabaseManagementController::class, 'downloadBackup']);
        Route::delete('/admin/database/backups/delete', [DatabaseManagementController::class, 'deleteBackup']);
    });

    // Pharmacy Batch Management
    Route::get('/pharmacy/batches', [\App\Http\Controllers\PharmacyBatchController::class, 'index']);
    Route::post('/pharmacy/batches', [\App\Http\Controllers\PharmacyBatchController::class, 'store']);
    Route::get('/pharmacy/batches/{id}', [\App\Http\Controllers\PharmacyBatchController::class, 'show']);
    Route::put('/pharmacy/batches/{id}', [\App\Http\Controllers\PharmacyBatchController::class, 'update']);
    Route::get('/pharmacy/batches/drug/{drugId}/fefo', [\App\Http\Controllers\PharmacyBatchController::class, 'fefo']);
    Route::post('/pharmacy/batches/{id}/adjust', [\App\Http\Controllers\PharmacyBatchController::class, 'adjust']);

    // Pharmacy Prescriptions
    Route::get('/pharmacy/prescriptions', [\App\Http\Controllers\PharmacyPrescriptionController::class, 'index']);
    Route::post('/pharmacy/prescriptions', [\App\Http\Controllers\PharmacyPrescriptionController::class, 'store']);
    Route::get('/pharmacy/prescriptions/{id}', [\App\Http\Controllers\PharmacyPrescriptionController::class, 'show']);
    Route::post('/pharmacy/prescriptions/{id}/cancel', [\App\Http\Controllers\PharmacyPrescriptionController::class, 'cancel']);

    // Pharmacy Review (Pharmacist reviews and maps prescriptions)
    Route::get('/pharmacy/review/pending', [\App\Http\Controllers\PharmacyReviewController::class, 'pendingPrescriptions']);
    Route::get('/pharmacy/review/{id}', [\App\Http\Controllers\PharmacyReviewController::class, 'showPrescription']);
    Route::post('/pharmacy/review/items/{itemId}/map', [\App\Http\Controllers\PharmacyReviewController::class, 'mapItem']);
    Route::delete('/pharmacy/review/items/{itemId}/unmap', [\App\Http\Controllers\PharmacyReviewController::class, 'unmapItem']);
    Route::post('/pharmacy/review/{id}/dispense', [\App\Http\Controllers\PharmacyReviewController::class, 'dispenseNow']);
    Route::get('/pharmacy/review/drugs/available', [\App\Http\Controllers\PharmacyReviewController::class, 'availableDrugs']);

    // Manual Dispensation
    Route::post('/pharmacy/manual/dispensation', [\App\Http\Controllers\ManualDispensationController::class, 'createDispensation']);
    Route::post('/pharmacy/manual/prescriptions/{prescriptionId}/add-drug', [\App\Http\Controllers\ManualDispensationController::class, 'addDrugToPrescription']);
    Route::post('/pharmacy/manual/patient/find-or-create', [\App\Http\Controllers\ManualDispensationController::class, 'findOrCreatePatient']);
    Route::post('/pharmacy/manual/prescription/{prescriptionId}/add-drug', [\App\Http\Controllers\ManualDispensationController::class, 'addDrugToPrescription']);
    Route::get('/pharmacy/manual/recent', [\App\Http\Controllers\ManualDispensationController::class, 'recentDispensations']);

    // Pharmacy Dispensation (Admin assigns pharmacist)
    // === SIMPLE PHARMACY WORKFLOW (uses Prescription table directly) ===
    Route::get('/pharmacy/dispensations/pending', [\App\Http\Controllers\SimplePharmacyController::class, 'pending']);
    Route::post('/pharmacy/dispensations/dispense', [\App\Http\Controllers\SimplePharmacyController::class, 'dispense']);
    
    // Old complex routes (kept for history viewing only)
    Route::get('/pharmacy/dispensations', [\App\Http\Controllers\PharmacyDispensationController::class, 'index']);
    Route::get('/pharmacy/dispensations/{id}', [\App\Http\Controllers\PharmacyDispensationController::class, 'show']);
    Route::post('/pharmacy/dispensations/{id}/collect', [\App\Http\Controllers\PharmacyDispensationController::class, 'markCollected']);

    Route::get('/pharmacy/reports/dispensed-drugs', [\App\Http\Controllers\PharmacyReportsController::class, 'dispensedDrugs']);
    Route::get('/pharmacy/reports/stock-levels', [\App\Http\Controllers\PharmacyReportsController::class, 'stockLevels']);
    Route::get('/pharmacy/reports/transactions', [\App\Http\Controllers\PharmacyReportsController::class, 'recentTransactions']);
    Route::get('/pharmacy/reports/summary', [\App\Http\Controllers\PharmacyReportsController::class, 'summaryStats']);
    Route::get('/pharmacy/reports/top-drugs', [\App\Http\Controllers\PharmacyReportsController::class, 'topDispensedDrugs']);

    // Main Store Drug Management (Admin Only)
    Route::middleware('role:admin')->prefix('main-store/drugs')->group(function () {
        Route::get('/', [MainStoreDrugController::class, 'index']);
        Route::post('/', [MainStoreDrugController::class, 'store']);
        Route::get('/unlinked', [MainStoreDrugController::class, 'getUnlinked']);
        Route::get('/pharmacy-drugs-for-linking', [MainStoreDrugController::class, 'getPharmacyDrugsForLinking']);
        Route::get('/{id}', [MainStoreDrugController::class, 'show']);
        Route::put('/{id}', [MainStoreDrugController::class, 'update']);
        Route::post('/{id}/dispense', [MainStoreDrugController::class, 'dispenseToPharmacy']);
        Route::get('/{id}/pharmacy-info', [MainStoreDrugController::class, 'getPharmacyInfo']);
        Route::post('/{id}/link', [MainStoreDrugController::class, 'linkToPharmacyDrug']);
        Route::get('/{id}/dispensation-history', [MainStoreDrugController::class, 'dispensationHistory']);
        Route::delete('/bulk-delete-unlinked', [MainStoreDrugController::class, 'bulkDeleteUnlinked']);
        Route::delete('/{id}/remove-from-inventory', [MainStoreDrugController::class, 'removeFromDrugInventory']);
        Route::delete('/{id}/delete-completely', [MainStoreDrugController::class, 'deleteDrugCompletely']);
        Route::get('/reorder-requests/all', [MainStoreDrugController::class, 'getReorderRequests']);
        Route::delete('/reorder-requests/{id}', [MainStoreDrugController::class, 'dismissReorderRequest']);
    });

    // Drug Migration Routes (Admin Only)
    Route::middleware('role:admin')->prefix('admin/drug-migration')->group(function () {
        Route::get('/status', [DrugMigrationController::class, 'getMigrationStatus']);
        Route::post('/migrate/{id}', [DrugMigrationController::class, 'migrateSingleDrug']);
        Route::post('/migrate-all', [DrugMigrationController::class, 'migrateAllDrugs']);
    });

    // Laboratory Module
    // Lab Requests (Doctor creates requests)
    Route::post('/lab/requests', [\App\Http\Controllers\LabRequestController::class, 'store']);
    Route::get('/lab/requests', [\App\Http\Controllers\LabRequestController::class, 'index']);
    Route::get('/lab/requests/patient/{patient_id}', [\App\Http\Controllers\LabRequestController::class, 'getByPatient']);
    Route::get('/lab/requests/{id}', [\App\Http\Controllers\LabRequestController::class, 'show']);
    Route::delete('/lab/requests/{id}/cancel', [\App\Http\Controllers\LabRequestController::class, 'cancel']);
    Route::get('/lab/tests/available', [\App\Http\Controllers\LabRequestController::class, 'availableTests']);

    // Lab Test Management (Admin creates/edits tests and parameters)
    Route::get('/lab/management/categories', [\App\Http\Controllers\LabTestManagementController::class, 'getCategories']);
    Route::get('/lab/management/tests', [\App\Http\Controllers\LabTestManagementController::class, 'index']);
    Route::get('/lab/management/tests/{id}', [\App\Http\Controllers\LabTestManagementController::class, 'show']);
    Route::post('/lab/management/tests', [\App\Http\Controllers\LabTestManagementController::class, 'store']);
    Route::put('/lab/management/tests/{id}', [\App\Http\Controllers\LabTestManagementController::class, 'update']);
    Route::delete('/lab/management/tests/{id}', [\App\Http\Controllers\LabTestManagementController::class, 'destroy']);
    Route::post('/lab/management/tests/{testId}/parameters', [\App\Http\Controllers\LabTestManagementController::class, 'addParameter']);
    Route::delete('/lab/management/parameters/{parameterId}', [\App\Http\Controllers\LabTestManagementController::class, 'deleteParameter']);
    Route::put('/lab/management/parameters/{parameterId}', [\App\Http\Controllers\LabTestManagementController::class, 'updateParameter']);
    Route::delete('/lab/management/parameters/{parameterId}', [\App\Http\Controllers\LabTestManagementController::class, 'deleteParameter']);

    // Lab Processing (Lab tech processes requests)
    Route::get('/lab/processing/pending', [\App\Http\Controllers\LabProcessingController::class, 'pending']);
    Route::post('/lab/processing/{id}/accept', [\App\Http\Controllers\LabProcessingController::class, 'acceptRequest']);
    Route::post('/lab/processing/{id}/sample', [\App\Http\Controllers\LabProcessingController::class, 'recordSample']);
    Route::post('/lab/processing/{id}/tests/{testId}/results', [\App\Http\Controllers\LabProcessingController::class, 'submitResults']);
    Route::post('/lab/processing/{id}/reject', [\App\Http\Controllers\LabProcessingController::class, 'rejectSample']);
    
    // Draft management for test results
    Route::post('/lab/processing/{id}/tests/{testId}/draft', [\App\Http\Controllers\LabProcessingController::class, 'saveDraft']);
    Route::get('/lab/processing/{id}/tests/{testId}/draft', [\App\Http\Controllers\LabProcessingController::class, 'getDraft']);
    Route::delete('/lab/processing/{id}/tests/{testId}/draft', [\App\Http\Controllers\LabProcessingController::class, 'deleteDraft']);

    // Triage Management
    Route::post('/triages', [TriageController::class, 'store']);
    Route::get('/triages/patient/{patientId}', [TriageController::class, 'getAllForPatient']);
    Route::get('/triages/{patientId}/latest', [TriageController::class, 'getLatest']);
    Route::get('/triages/{id}', [TriageController::class, 'show']);
    Route::put('/triages/{id}', [TriageController::class, 'update']);

    // ===== Inpatient / Admissions =====
    Route::get('/admissions', [AdmissionController::class, 'index']);
    Route::post('/admissions', [AdmissionController::class, 'store']);
    Route::get('/admissions/{id}', [AdmissionController::class, 'show']);
    Route::post('/admissions/{id}/entries', [AdmissionController::class, 'addEntry']);
    Route::post('/admissions/{id}/discharge', [AdmissionController::class, 'discharge']);
    Route::get('/admissions/{id}/bill', [AdmissionController::class, 'getBill']);
    Route::get('/patients/{patientId}/active-admission', [AdmissionController::class, 'getActiveForPatient']);

    // ===== Notifications =====
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
});
