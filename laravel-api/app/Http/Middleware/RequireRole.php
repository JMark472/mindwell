<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Server-side role authorization.
 *
 * The frontend hides actions the user cannot perform, but this middleware
 * is the actual security boundary — role checks never rely on the client.
 */
class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $role = (string) $request->attributes->get('auth_role', '');

        if (! in_array($role, $roles, true)) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'You are not authorized to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
