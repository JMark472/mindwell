<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS)
    |--------------------------------------------------------------------------
    |
    | The React SPA runs on a different port (5173) and authenticates with
    | HttpOnly cookies, so the allowed origin is explicit and credentials
    | are enabled. Wildcards are never used together with credentials.
    |
    */

    'paths' => ['api/*', 'up'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => (function () {
        $raw = implode(',', array_filter([
            env('FRONTEND_URL', 'http://localhost:5173'),
            env('FRONTEND_URLS', ''),
        ]));

        $origins = array_values(array_unique(array_filter(array_map(
            fn ($value) => rtrim(trim($value), '/'),
            explode(',', $raw),
        ))));

        // Local preview servers are allowed outside production so the built
        // bundle (e.g. :8080) can talk to the API just like the Vite dev server.
        if (env('APP_ENV', 'production') !== 'production') {
            $origins = array_values(array_unique(array_merge($origins, [
                'http://localhost:5173',
                'http://localhost:8080',
                'http://127.0.0.1:5173',
                'http://127.0.0.1:8080',
            ])));
        }

        return $origins;
    })(),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'X-CSRF-TOKEN',
        'X-Requested-With',
        'X-Service-Key',
        'x-csrf-token',
    ],

    'exposed_headers' => [],

    'max_age' => 600,

    'supports_credentials' => true,

];
