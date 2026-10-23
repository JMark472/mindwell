<?php

return [

    /*
    |---------------------------------------------------------------------------
    | Service-to-service configuration
    |---------------------------------------------------------------------------
    |
    | These secrets let the Express service and this Laravel service talk to
    | each other. They are never sent to the browser. The JWT secret is
    | shared with Express so this service can verify the access tokens that
    | Express issues (Express remains the single authentication authority).
    |
    */

    'jwt_secret' => env('JWT_SECRET'),
    'csrf_secret' => env('CSRF_SECRET'),
    'service_key' => env('SERVICE_KEY'),

    'express_url' => env('EXPRESS_URL', 'http://localhost:3000'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    /*
    |--------------------------------------------------------------------------
    | Appointment rules
    |--------------------------------------------------------------------------
    */

    'appointment' => [
        'default_duration_minutes' => (int) env('APPOINTMENT_DURATION_MINUTES', 50),
        'min_notice_hours' => (int) env('APPOINTMENT_MIN_NOTICE_HOURS', 4),
        'cancellation_cutoff_hours' => (int) env('APPOINTMENT_CANCEL_CUTOFF_HOURS', 12),
        'max_advance_days' => (int) env('APPOINTMENT_MAX_ADVANCE_DAYS', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Crisis support (institution-configurable)
    |--------------------------------------------------------------------------
    |
    | These are placeholders the institution MUST replace with its own
    | verified local emergency numbers before go-live.
    |
    */

    'crisis' => [
        'hotline' => env('CRISIS_HOTLINE', '1553 (NCMH Crisis Hotline, PH)'),
        'emergency' => env('CRISIS_EMERGENCY', '911'),
        'campus_counseling' => env('CRISIS_CAMPUS_COUNSELING', 'Guidance & Counseling Office, Main Campus'),
        'notice' => 'Mindwell is not a replacement for professional mental health care and is not an emergency response service.',
    ],

];
