<?php

namespace App\Support;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Verifies the HS256 access token issued by the Express service.
 *
 * Both services share one JWT_SECRET so the Laravel service can authorize
 * user requests without a second round-trip. The token is never issued by
 * Laravel — the Express service is the single authentication authority.
 */
class JwtVerifier
{
    public const TYPE_ACCESS = 'access';

    /**
     * @return array{sub:int,role:string,type:string,jti?:string}
     * @throws RuntimeException when the token is missing, expired or invalid.
     */
    public function verify(Request $request): array
    {
        $token = $this->extractToken($request);

        if ($token === null) {
            throw new RuntimeException('Authentication required.');
        }

        try {
            $decoded = JWT::decode(
                $token,
                new Key((string) config('mindwell.jwt_secret'), 'HS256')
            );
        } catch (\Throwable $e) {
            throw new RuntimeException('Invalid or expired token.');
        }

        $payload = (array) $decoded;

        if (($payload['type'] ?? null) !== self::TYPE_ACCESS) {
            throw new RuntimeException('Invalid token type.');
        }

        return [
            'sub' => (string) $payload['sub'],
            'role' => (string) $payload['role'],
            'type' => (string) $payload['type'],
            'jti' => (string) ($payload['jti'] ?? ''),
        ];
    }

    private function extractToken(Request $request): ?string
    {
        $bearer = $request->bearerToken();
        if (is_string($bearer) && $bearer !== '') {
            return $bearer;
        }

        // Browser clients authenticate with the HttpOnly cookie set by Express.
        $cookie = $request->cookie('mw_access');
        if (is_string($cookie) && $cookie !== '') {
            return $cookie;
        }

        return null;
    }
}
