<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RequestProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_cookie_authenticated_write_requires_csrf_token(): void
    {
        $token = $this->tokenFor(4, 'student');

        $this->withUnencryptedCookie('mw_access', $token)
            ->withCredentials()
            ->postJson('/api/wellness-checkins', ['mood_score' => 3])
            ->assertStatus(403)
            ->assertJsonPath('message', 'CSRF validation failed');
    }

    public function test_cookie_authenticated_write_succeeds_with_matching_csrf(): void
    {
        $token = $this->tokenFor(4, 'student');

        $this->withUnencryptedCookie('mw_access', $token)
            ->withUnencryptedCookie('mw_csrf', 'csrf-value')
            ->withUnencryptedCookie('mw_csrf_session', 'csrf-value')
            ->withHeader('x-csrf-token', 'csrf-value')
            ->withCredentials()
            ->postJson('/api/wellness-checkins', ['mood_score' => 3])
            ->assertStatus(201);
    }

    public function test_bearer_authenticated_write_is_exempt_from_csrf(): void
    {
        $this->postJson('/api/wellness-checkins', ['mood_score' => 3], $this->asUser(4, 'student'))
            ->assertStatus(201);
    }

    public function test_checkin_validation_rejects_out_of_range_scores(): void
    {
        $this->postJson('/api/wellness-checkins', [
            'mood_score' => 99,
            'sleep_hours' => -3,
        ], $this->asUser(4, 'student'))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['mood_score', 'sleep_hours']);
    }

    public function test_appointment_validation_rejects_unknown_counselor(): void
    {
        $this->postJson('/api/appointments', [
            'counselor_profile_id' => 999,
            'slot_start' => now()->addDays(3)->toIso8601String(),
        ], $this->asUser(4, 'student'))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['counselor_profile_id']);
    }

    public function test_unknown_api_route_returns_json_404(): void
    {
        $this->getJson('/api/does-not-exist', $this->asUser(4, 'student'))
            ->assertStatus(404)
            ->assertJsonPath('status', 'error');
    }

    public function test_internal_routes_require_a_service_key(): void
    {
        $this->getJson('/api/internal/reports/appointment-summary')->assertStatus(401);

        $this->getJson('/api/internal/reports/appointment-summary', [
            'X-Service-Key' => 'wrong-key',
        ])->assertStatus(403);

        $this->getJson('/api/internal/reports/appointment-summary', [
            'X-Service-Key' => (string) config('mindwell.service_key'),
        ])->assertStatus(200);
    }

    public function test_internal_routes_ignore_a_user_token(): void
    {
        // A stolen user token must not grant access to service endpoints.
        $this->getJson('/api/internal/reports/platform-summary', $this->asUser(1, 'admin'))
            ->assertStatus(401);
    }
}
