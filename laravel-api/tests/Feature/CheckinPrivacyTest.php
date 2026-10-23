<?php

namespace Tests\Feature;

use App\Models\ConsentRecord;
use App\Models\CounselorProfile;
use App\Models\WellnessCheckin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckinPrivacyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CounselorProfile::create(['user_id' => 2, 'accepting_students' => true]);
    }

    private function checkin(int $studentId, bool $shared, array $extra = []): WellnessCheckin
    {
        return WellnessCheckin::create([
            'student_user_id' => $studentId,
            'mood_score' => 3,
            'note' => 'Synthetic test note.',
            'is_shared_with_counselor' => $shared,
            ...$extra,
        ]);
    }

    public function test_a_student_can_create_a_private_checkin(): void
    {
        $this->postJson('/api/wellness-checkins', [
            'mood_score' => 4,
            'energy_score' => 3,
            'stress_score' => 2,
            'sleep_hours' => 7.5,
            'note' => 'A perfectly ordinary day.',
        ], $this->asUser(4, 'student'))
            ->assertStatus(201)
            ->assertJsonPath('data.checkin.is_shared_with_counselor', false);
    }

    public function test_sharing_requires_explicit_consent(): void
    {
        $this->postJson('/api/wellness-checkins', [
            'mood_score' => 3,
            'share_with_counselor' => true,
        ], $this->asUser(4, 'student'))->assertStatus(422);
    }

    public function test_sharing_succeeds_after_consent_is_granted(): void
    {
        $this->putJson('/api/consents/checkin_sharing', [
            'granted' => true,
            'policy_version' => 'v1',
        ], $this->asUser(4, 'student'))->assertStatus(200);

        $this->postJson('/api/wellness-checkins', [
            'mood_score' => 4,
            'share_with_counselor' => true,
        ], $this->asUser(4, 'student'))
            ->assertStatus(201)
            ->assertJsonPath('data.checkin.is_shared_with_counselor', true);
    }

    public function test_counselor_cannot_see_unshared_checkins(): void
    {
        $this->checkin(4, false);
        ConsentRecord::create([
            'student_user_id' => 4,
            'consent_type' => ConsentRecord::TYPE_CHECKIN_SHARING,
            'is_granted' => true,
        ]);

        $response = $this->getJson('/api/wellness-checkins', $this->asUser(2, 'counselor'));
        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data.checkins'));
    }

    public function test_counselor_cannot_see_shared_checkins_after_consent_is_revoked(): void
    {
        $this->checkin(4, true);
        ConsentRecord::create([
            'student_user_id' => 4,
            'consent_type' => ConsentRecord::TYPE_CHECKIN_SHARING,
            'is_granted' => false,
        ]);

        $response = $this->getJson('/api/wellness-checkins', $this->asUser(2, 'counselor'));
        $this->assertCount(0, $response->json('data.checkins'));
    }

    public function test_counselor_sees_shared_checkins_with_consent(): void
    {
        $this->checkin(4, true);
        ConsentRecord::create([
            'student_user_id' => 4,
            'consent_type' => ConsentRecord::TYPE_CHECKIN_SHARING,
            'is_granted' => true,
        ]);

        $response = $this->getJson('/api/wellness-checkins', $this->asUser(2, 'counselor'));
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.checkins'));
    }

    public function test_revoking_consent_unshares_existing_checkins(): void
    {
        $this->checkin(4, true);

        $this->putJson('/api/consents/checkin_sharing', [
            'granted' => false,
        ], $this->asUser(4, 'student'))->assertStatus(200);

        $this->assertDatabaseHas('wellness_checkins', [
            'student_user_id' => 4,
            'is_shared_with_counselor' => false,
        ]);
    }

    public function test_student_cannot_read_another_students_checkin(): void
    {
        $checkin = $this->checkin(5, false);

        $this->getJson('/api/wellness-checkins/' . $checkin->id, $this->asUser(4, 'student'))
            ->assertStatus(403);
    }

    public function test_administrator_only_receives_aggregates(): void
    {
        $this->checkin(4, false);
        $this->checkin(5, true);

        $response = $this->getJson('/api/wellness-checkins', $this->asUser(1, 'admin'));
        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data.checkins'));
        $this->assertSame(2, $response->json('data.aggregate.total'));
        $this->assertArrayNotHasKey('note', (array) $response->json('data.aggregate'));
    }

    public function test_counselor_cannot_read_a_specific_unshared_checkin(): void
    {
        $checkin = $this->checkin(4, false);
        ConsentRecord::create([
            'student_user_id' => 4,
            'consent_type' => ConsentRecord::TYPE_CHECKIN_SHARING,
            'is_granted' => true,
        ]);

        $this->getJson('/api/wellness-checkins/' . $checkin->id, $this->asUser(2, 'counselor'))
            ->assertStatus(403);
    }
}
