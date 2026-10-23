<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\ConsentController;
use App\Http\Controllers\Api\CounselingRecordController;
use App\Http\Controllers\Api\CounselorController;
use App\Http\Controllers\Api\InternalReportController;
use App\Http\Controllers\Api\WellnessCheckinController;
use App\Http\Controllers\Api\WellnessResourceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mindwell Laravel API
|--------------------------------------------------------------------------
| Owns: appointments, counselor profiles/availability, wellness resources,
| wellness check-ins, consent records and counseling records.
|
| Authentication: the Express service is the single authentication
| authority. This service verifies the same HS256 access token (sent as an
| HttpOnly `mw_access` cookie or a Bearer header).
|
| CORS: handled by config/cors.php for the SPA origin.
*/

Route::get('/health', fn () => response()->json([
    'status' => 'success',
    'message' => 'Mindwell Laravel API is healthy',
    'timestamp' => now()->toIso8601String(),
]));

/*
|--------------------------------------------------------------------------
| Service-to-service (server only — X-Service-Key)
|--------------------------------------------------------------------------
*/
Route::prefix('internal')->middleware('service.key')->group(function () {
    Route::get('/reports/appointment-summary', [InternalReportController::class, 'appointmentSummary']);
    Route::get('/reports/platform-summary', [InternalReportController::class, 'platformSummary']);
});

/*
|--------------------------------------------------------------------------
| Authenticated user endpoints
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'csrf.api'])->group(function () {

    // --- Appointments -----------------------------------------------------
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/counselors', [AppointmentController::class, 'counselors']);
    Route::get('/appointments/{counselorProfileId}/slots', [AppointmentController::class, 'slots']);
    Route::get('/appointments/{id}', [AppointmentController::class, 'show'])->whereNumber('id');
    Route::post('/appointments', [AppointmentController::class, 'store'])->middleware('role:student');
    Route::patch('/appointments/{id}/status', [AppointmentController::class, 'updateStatus'])
        ->whereNumber('id')->middleware('role:counselor');
    Route::post('/appointments/{id}/cancel', [AppointmentController::class, 'cancel'])->whereNumber('id');

    // --- Counselor directory & profile -----------------------------------
    Route::get('/counselors', [CounselorController::class, 'index']);
    Route::get('/counselors/profile', [CounselorController::class, 'myProfile'])->middleware('role:counselor');
    Route::patch('/counselors/profile', [CounselorController::class, 'updateProfile'])->middleware('role:counselor');
    Route::put('/counselors/availability', [CounselorController::class, 'updateAvailability'])->middleware('role:counselor');

    // --- Wellness resources ----------------------------------------------
    Route::get('/wellness-resources', [WellnessResourceController::class, 'index']);
    Route::get('/wellness-resources/{slug}', [WellnessResourceController::class, 'show']);
    Route::post('/wellness-resources', [WellnessResourceController::class, 'store'])->middleware('role:admin');
    Route::patch('/wellness-resources/{id}', [WellnessResourceController::class, 'update'])
        ->whereNumber('id')->middleware('role:admin');
    Route::delete('/wellness-resources/{id}', [WellnessResourceController::class, 'destroy'])
        ->whereNumber('id')->middleware('role:admin');

    // --- Wellness check-ins ----------------------------------------------
    Route::get('/wellness-checkins', [WellnessCheckinController::class, 'index']);
    Route::get('/wellness-checkins/trend', [WellnessCheckinController::class, 'trend'])->middleware('role:student');
    Route::get('/wellness-checkins/{id}', [WellnessCheckinController::class, 'show'])->whereNumber('id');
    Route::post('/wellness-checkins', [WellnessCheckinController::class, 'store'])->middleware('role:student');

    // --- Consent ----------------------------------------------------------
    Route::get('/consents', [ConsentController::class, 'index'])->middleware('role:student');
    Route::put('/consents/{type}', [ConsentController::class, 'update'])->middleware('role:student');

    // --- Confidential counseling records ---------------------------------
    Route::get('/counseling-records', [CounselingRecordController::class, 'index'])->middleware('role:counselor');
    Route::get('/counseling-records/caseload', [CounselingRecordController::class, 'caseload'])->middleware('role:counselor');
    Route::post('/counseling-records', [CounselingRecordController::class, 'store'])->middleware('role:counselor');
    Route::patch('/counseling-records/{id}', [CounselingRecordController::class, 'update'])
        ->whereNumber('id')->middleware('role:counselor');
});
