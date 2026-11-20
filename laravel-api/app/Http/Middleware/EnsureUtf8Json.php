<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUtf8Json
{
    /**
     * JSON is UTF-8 by definition, but declare it explicitly so no proxy or
     * client can fall back to a single-byte charset for API text.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $contentType = (string) $response->headers->get('Content-Type', '');

        if (
            $request->is('api/*') &&
            str_starts_with($contentType, 'application/json') &&
            ! str_contains($contentType, 'charset=')
        ) {
            $response->headers->set('Content-Type', 'application/json; charset=utf-8');
        }

        return $response;
    }
}
