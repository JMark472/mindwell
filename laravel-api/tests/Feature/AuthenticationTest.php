<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_anonymous_request_is_rejected(): void
    {
        $this->getJson('/api/appointments')->assertStatus(401);
        $this->getJson('/api/wellness-resources')->assertStatus(401);
    }

    public function test_malformed_token_is_rejected(): void
    {
        $this->getJson('/api/appointments', ['Authorization' => 'Bearer not-a-jwt'])
            ->assertStatus(401);
    }

    public function test_access_token_is_accepted(): void
    {
        $this->getJson('/api/wellness-resources', $this->asUser(4, 'student'))
            ->assertStatus(200)
            ->assertJsonPath('status', 'success');
    }

    public function test_refresh_tokens_cannot_authorise_api_requests(): void
    {
        $now = time();
        $refresh = \Firebase\JWT\JWT::encode([
            'sub' => '4',
            'role' => 'student',
            'type' => 'refresh',
            'iat' => $now,
            'exp' => $now + 900,
        ], (string) config('mindwell.jwt_secret'), 'HS256');

        $this->getJson('/api/appointments', ['Authorization' => 'Bearer ' . $refresh])
            ->assertStatus(401);
    }

    public function test_health_endpoint_is_public(): void
    {
        $this->getJson('/api/health')->assertStatus(200)->assertJsonPath('status', 'success');
    }
}
