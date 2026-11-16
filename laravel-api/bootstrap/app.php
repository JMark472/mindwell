<?php

use App\Http\Middleware\Authenticate;
use App\Http\Middleware\RequireRole;
use App\Http\Middleware\RequireServiceKey;
use App\Http\Middleware\VerifyCsrfToken;
use App\Support\JwtVerifier;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'auth' => Authenticate::class,
            'role' => RequireRole::class,
            'service.key' => RequireServiceKey::class,
            'csrf.api' => VerifyCsrfToken::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'api/internal/*',
        ]);

        // The API is stateless: authentication is token-based (JWT), so no
        // session middleware is enabled. CSRF is handled by VerifyCsrfToken.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }

            return null;
        });

        $exceptions->render(function (Illuminate\Auth\Access\AuthorizationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => $e->getMessage() ?: 'Forbidden',
                ], 403);
            }

            return null;
        });

        $exceptions->render(function (Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $e, $request) {
            if ($request->is('api/*')) {
                $status = $e->getStatusCode();
                $message = $e->getMessage();
                if ($status === 404 && $message === '') {
                    $message = 'Endpoint not found.';
                }

                return response()->json([
                    'status' => 'error',
                    'message' => $message !== '' ? $message : 'Request failed.',
                ], $status);
            }

            return null;
        });

        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*')) {
                report($e);
                $message = config('app.debug')
                    ? ($e->getMessage() ?: 'Internal server error')
                    : 'Internal server error';

                return response()->json([
                    'status' => 'error',
                    'message' => $message,
                ], 500);
            }

            return null;
        });
    })->create();
