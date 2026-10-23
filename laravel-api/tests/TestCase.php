<?php

namespace Tests;

use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Builds a valid access token exactly like the Express service does, so
     * feature tests exercise the real verification path instead of bypassing
     * authentication.
     */
    protected function tokenFor(int $userId, string $role): string
    {
        $now = time();

        return JWT::encode([
            'sub' => (string) $userId,
            'role' => $role,
            'type' => 'access',
            'jti' => 'test-' . $userId . '-' . $now,
            'iat' => $now,
            'exp' => $now + 900,
        ], (string) config('mindwell.jwt_secret'), 'HS256');
    }

    /**
     * @return array<string, string>
     */
    protected function asUser(int $userId, string $role): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->tokenFor($userId, $role),
            'Accept' => 'application/json',
        ];
    }
}
