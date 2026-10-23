<?php

namespace Tests\Feature;

use App\Models\CounselorProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CounselorProfile::create(['user_id' => 2, 'accepting_students' => true]);
    }

    public function test_student_cannot_read_counseling_records(): void
    {
        $this->getJson('/api/counseling-records', $this->asUser(4, 'student'))
            ->assertStatus(403)
            ->assertJsonPath('status', 'error');
    }

    public function test_administrator_cannot_read_counseling_records(): void
    {
        $this->getJson('/api/counseling-records', $this->asUser(1, 'admin'))
            ->assertStatus(403);
    }

    public function test_student_cannot_publish_resources(): void
    {
        $this->postJson('/api/wellness-resources', [
            'wellness_category_id' => 1,
            'title' => 'Nope',
            'excerpt' => 'Nope',
            'body' => 'Nope',
        ], $this->asUser(4, 'student'))->assertStatus(403);
    }

    public function test_counselor_cannot_book_appointments(): void
    {
        $this->postJson('/api/appointments', [
            'counselor_profile_id' => 1,
            'slot_start' => now()->addDays(3)->toIso8601String(),
        ], $this->asUser(2, 'counselor'))->assertStatus(403);
    }

    public function test_administrator_cannot_use_student_consent_endpoints(): void
    {
        $this->getJson('/api/consents', $this->asUser(1, 'admin'))->assertStatus(403);
    }

    public function test_unknown_role_is_denied(): void
    {
        $this->getJson('/api/appointments', $this->asUser(9, 'guest'))->assertStatus(403);
    }
}
