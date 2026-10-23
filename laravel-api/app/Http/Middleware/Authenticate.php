<?php

namespace App\Http\Middleware;

use App\Support\JwtVerifier;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class Authenticate
{
    /** Roles this service recognises. Anything else is rejected outright. */
    private const ALLOWED_ROLES = ['student', 'counselor', 'admin'];

    public function __construct(private readonly JwtVerifier $jwt) {}

    /**
     * Authenticates the request using the Express-issued access token and
     * attaches the verified identity to the request attributes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $payload = $this->jwt->verify($request);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 401);
        }

        if (! in_array($payload['role'], self::ALLOWED_ROLES, true)) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Unknown role in token.',
            ], 403);
        }

        $request->attributes->set('auth_user_id', (int) $payload['sub']);
        $request->attributes->set('auth_role', $payload['role']);
        $request->attributes->set('auth_token_id', $payload['jti']);

        return $next($request);
    }
}
