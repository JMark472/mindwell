<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CSRF guard for cookie-authenticated write requests.
 *
 * Mirrors the double-submit scheme used by the Express service: the SPA
 * reads the `mw_csrf` cookie and echoes it in the `x-csrf-token` header.
 * Requests carrying an explicit Authorization header are exempt because a
 * browser cannot attach them automatically.
 */
class VerifyCsrfToken
{
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->method(), self::SAFE_METHODS, true)) {
            return $next($request);
        }

        if ($request->header('Authorization') !== null) {
            return $next($request);
        }

        $header = (string) $request->header('x-csrf-token', '');
        $cookie = (string) $request->cookie('mw_csrf', '');
        $session = (string) $request->cookie('mw_csrf_session', '');

        $ok = $header !== '' && $cookie !== '' && $session !== ''
            && hash_equals($cookie, $header)
            && hash_equals($session, $header);

        if (! $ok) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'CSRF validation failed',
            ], 403);
        }

        return $next($request);
    }
}
