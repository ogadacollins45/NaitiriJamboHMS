<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    PatientController,
    TreatmentController,
    DoctorController,
    AppointmentController,
    InventoryController,
    PrescriptionController,
    BillingController,
    BillingHelperController,
    DashboardController,
    StaffController,
    AuthController
};
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES (NO AUTH)
|--------------------------------------------------------------------------
*/

/** Login (still available but not required) */
Route::post('/login', [AuthController::class, 'login']);

/** Staff documents preview */
Route::get('/staff-documents/{filename}', function ($filename) {
    if (!Storage::disk('public')->exists('staff_docs/' . $filename)) {
        return response()->json(['error' => 'File not found'], 404);
    }

    $mimeType = Storage::disk('public')->mimeType('staff_docs/' . $filename);

    return Response::make(Storage::disk('public')->get('staff_docs/' . $filename), 200, [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'inline; filename="'.$filename.'"',
        'X-Content-Type-Options' => 'nosniff',
    ]);
});

/*
|--------------------------------------------------------------------------
| PATIENTS
|--------------------------------------------------------------------------
*/
Route::get('/patients', [PatientController::class, 'index']);
Route::post('/patients', [PatientController::class, 'store']);
Route::get('/patients/{id}', [PatientController::class, 'show']);
Route::put('/patients/{id}', [PatientController::class, 'update']);

/*
|--------------------------------------------------------------------------
| TREATMENTS
|--------------------------------------------------------------------------
*/
Route::get('/patients/{id}/treatments', [TreatmentController::class, 'index']);
Route::post('/patients/{id}/treatments', [TreatmentController::class, 'store']);
Route::delete('/treatments/{id}', [TreatmentController::class, 'destroy']);

/*
|--------------------------------------------------------------------------
| DOCTORS
|--------------------------------------------------------------------------
*/
Route::get('/doctors', [DoctorController::class, 'index']);
Route::post('/doctors', [DoctorController::class, 'store']);

/*
|--------------------------------------------------------------------------
| APPOINTMENTS
|--------------------------------------------------------------------------
*/
Route::get('/patients/{id}/appointments', [AppointmentController::class, 'index']);
Route::post('/appointments', [AppointmentController::class, 'store']);
Route::post('/appointments/{id}/complete', [AppointmentController::class, 'complete']);
Route::put('/appointments/{id}', [AppointmentController::class, 'update']);

/*
|--------------------------------------------------------------------------
| INVENTORY
|--------------------------------------------------------------------------
*/
Route::get('/inventory', [InventoryController::class, 'index']);
Route::post('/inventory', [InventoryController::class, 'store']);
Route::get('/inventory/{id}', [InventoryController::class, 'show']);
Route::put('/inventory/{id}', [InventoryController::class, 'update']);
Route::delete('/inventory/{id}', [InventoryController::class, 'destroy']);
Route::post('/inventory/{id}/restock', [InventoryController::class, 'restock']);

/*
|--------------------------------------------------------------------------
| PRESCRIPTIONS
|--------------------------------------------------------------------------
*/
Route::get('/prescriptions', [PrescriptionController::class, 'index']);
Route::get('/prescriptions/{id}', [PrescriptionController::class, 'show']);
Route::post('/prescriptions', [PrescriptionController::class, 'store']);
Route::delete('/prescriptions/{id}', [PrescriptionController::class, 'destroy']);

/*
|--------------------------------------------------------------------------
| BILLING (NO AUTH REQUIRED)
|--------------------------------------------------------------------------
*/

/** Main bill endpoints */
Route::get('/bills', [BillingController::class, 'index']);
Route::get('/bills/{id}', [BillingController::class, 'show']);
Route::post('/bills', [BillingController::class, 'store']);
Route::post('/bills/{id}/payments', [BillingController::class, 'recordPayment']);

/** Billing helper endpoints */
Route::get('/billing/patients', [BillingHelperController::class, 'getBillablePatients']);
Route::get('/billing/pending', [BillingController::class, 'pending']);
Route::get('/billing/cleared', [BillingController::class, 'cleared']);

/*
|--------------------------------------------------------------------------
| STAFF
|--------------------------------------------------------------------------
*/
Route::get('/staff', [StaffController::class, 'index']);
Route::post('/staff', [StaffController::class, 'store']);
Route::get('/staff/{id}', [StaffController::class, 'show']);
Route::delete('/staff/{id}', [StaffController::class, 'destroy']);

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/
Route::get('/dashboard', [DashboardController::class, 'index']);
