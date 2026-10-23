<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CounselingRecord;
use App\Models\CounselorProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CounselingRecordAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private CounselorProfile $counselor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->counselor = CounselorProfile::create(['user_id' => 2, 'accepting_students' => true]);
    }

    private function assign(int $studentId, int $counselorUserId = 2): Appointment
    {
        $profile = CounselorProfile::query()->where('user_id', $counselorUserId)->firstOrFail();

        return Appointment::create([
            'student_user_id' => $studentId,
            'counselor_profile_id' => $profile->id,
            'slot_start' => now()->subDays(2)->setTime(10, 0),
            'slot_end' => now()->subDays(2)->setTime(10, 50),
            'status' => Appointment::STATUS_COMPLETED,
            'mode' => 'online',
        ]);
    }

    private function record(int $studentId, int $counselorUserId = 2): CounselingRecord
    {
        return CounselingRecord::create([
            'student_user_id' => $studentId,
            'counselor_user_id' => $counselorUserId,
            'session_date' => now()->toDateString(),
            'summary' => 'Confidential session summary that must stay private.',
            'risk_level' => CounselingRecord::RISK_NONE,
        ]);
    }

    public function test_assigned_counselor_can_create_a_record(): void
    {
        $this->assign(4);

        $this->postJson('/api/counseling-records', [
            'student_user_id' => 4,
            'session_date' => now()->toDateString(),
            'summary' => 'Session summary.',
            'risk_level' => 'low',
        ], $this->asUser(2, 'counselor'))
            ->assertStatus(201)
            ->assertJsonPath('data.record.counselor_user_id', 2);
    }

    public function test_counselor_cannot_write_a_record_for_an_unassigned_student(): void
    {
        $this->postJson('/api/counseling-records', [
            'student_user_id' => 99,
            'session_date' => now()->toDateString(),
            'summary' => 'Should not be stored.',
        ], $this->asUser(2, 'counselor'))->assertStatus(403);
    }

    public function test_counselor_cannot_read_another_counselors_records(): void
    {
        CounselorProfile::create(['user_id' => 3, 'accepting_students' => true]);
        $this->assign(4, 3);
        $this->record(4, 3);

        $response = $this->getJson('/api/counseling-records', $this->asUser(2, 'counselor'));
        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data.records'));
    }

    public function test_student_is_denied_even_for_their_own_records(): void
    {
        $this->assign(4);
        $record = $this->record(4);

        $this->getJson('/api/counseling-records?student=4', $this->asUser(4, 'student'))
            ->assertStatus(403);

        $this->patchJson('/api/counseling-records/' . $record->id, [
            'summary' => 'Tampered',
        ], $this->asUser(4, 'student'))->assertStatus(403);
    }

    public function test_administrator_is_denied_regardless_of_query_parameters(): void
    {
        $this->assign(4);
        $this->record(4);

        $this->getJson('/api/counseling-records?student=4', $this->asUser(1, 'admin'))
            ->assertStatus(403);

        $this->getJson('/api/counseling-records/caseload', $this->asUser(1, 'admin'))
            ->assertStatus(403);
    }

    public function test_counselor_cannot_read_records_for_an_unassigned_student(): void
    {
        $this->assign(4);
        $this->record(4);

        $this->getJson('/api/counseling-records?student=99', $this->asUser(2, 'counselor'))
            ->assertStatus(403);
    }

    public function test_counselor_can_update_their_own_record(): void
    {
        $this->assign(4);
        $record = $this->record(4);

        $this->patchJson('/api/counseling-records/' . $record->id, [
            'summary' => 'Updated summary.',
            'risk_level' => 'moderate',
        ], $this->asUser(2, 'counselor'))->assertStatus(200);

        $this->assertSame('Updated summary.', $record->fresh()->summary);
    }
}
