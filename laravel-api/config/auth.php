<?php

/*
|--------------------------------------------------------------------------
| Authentication configuration
|--------------------------------------------------------------------------
|
| This service does NOT own authentication. The Express service is the
| single authentication authority: it issues the HS256 access token which
| this service verifies in App\Http\Middleware\Authenticate.
|
| Laravel's session guard is intentionally left unconfigured (no local user
| model, no session driver) so no duplicate credential store can exist here.
|
*/

return [

    'defaults' => [
        'guard' => 'web',
        'passwords' => 'users',
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
    ],

    'providers' => [
        // Intentionally empty: user identities live in the Express service.
        'users' => [
            'driver' => 'array',
            'model' => null,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => 10800,

];
