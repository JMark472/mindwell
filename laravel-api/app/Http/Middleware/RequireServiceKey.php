<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Service-to-service guard for internal endpoints.
 *
 * The shared SERVICE_KEY is compared in constant time. It authenticates the
 * calling service, never a browser client.
 */
class RequireServiceKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $provided = (string) $request->header('X-Service-Key', '');
        $expected = (string) config('mindwell.service_key');

        if ($provided === '' || $expected === '') {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Service authentication required.',
            ], 401);
        }

        if (! hash_equals($expected, $provided)) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Invalid service key.',
            ], 403);
        }

        return $next($request);
    }
}
