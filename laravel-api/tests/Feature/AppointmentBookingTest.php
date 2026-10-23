<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\CounselorProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentBookingTest extends TestCase
{
    use RefreshDatabase;

    private CounselorProfile $counselor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->counselor = CounselorProfile::create([
            'user_id' => 2,
            'accepting_students' => true,
        ]);
    }

    private function slotStart(int $daysAhead = 3): string
    {
        return now()->addDays($daysAhead)->setTime(10, 0)->toIso8601String();
    }

    private function book(int $studentUserId, string $slotStart, array $extra = [])
    {
        return $this->postJson('/api/appointments', [
            'counselor_profile_id' => $this->counselor->id,
            'slot_start' => $slotStart,
            'mode' => 'online',
            'concern_category' => 'Academic stress',
            'student_note' => 'Feature test booking.',
            ...$extra,
        ], $this->asUser($studentUserId, 'student'));
    }

    public function test_student_can_book_a_future_slot(): void
    {
        $this->book(4, $this->slotStart())
            ->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.appointment.status', 'pending');

        $this->assertDatabaseHas('appointments', [
            'student_user_id' => 4,
            'counselor_profile_id' => $this->counselor->id,
            'status' => 'pending',
        ]);
    }

    public function test_the_same_slot_cannot_be_double_booked(): void
    {
        $slot = $this->slotStart();

        $this->book(4, $slot)->assertStatus(201);

        $this->book(5, $slot)
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertSame(1, Appointment::query()->count());
    }

    public function test_a_student_cannot_hold_overlapping_appointments(): void
    {
        $this->book(4, $this->slotStart(3))->assertStatus(201);

        $this->book(4, $this->slotStart(3))->assertStatus(422);
    }

    public function test_booking_in_the_past_is_rejected(): void
    {
        $this->book(4, now()->subDay()->toIso8601String())->assertStatus(422);
    }

    public function test_booking_too_far_ahead_is_rejected(): void
    {
        $this->book(4, now()->addDays(90)->toIso8601String())->assertStatus(422);
    }

    public function test_student_cannot_read_another_students_appointment(): void
    {
        $this->book(5, $this->slotStart())->assertStatus(201);
        $appointment = Appointment::query()->firstOrFail();

        $this->getJson('/api/appointments/' . $appointment->id, $this->asUser(4, 'student'))
            ->assertStatus(403);
    }

    public function test_student_can_cancel_their_own_appointment(): void
    {
        $this->book(4, $this->slotStart())->assertStatus(201);
        $appointment = Appointment::query()->firstOrFail();

        $this->postJson('/api/appointments/' . $appointment->id . '/cancel', [
            'reason' => 'Schedule conflict',
        ], $this->asUser(4, 'student'))->assertStatus(200);

        $this->assertSame(Appointment::STATUS_CANCELLED, $appointment->fresh()->status);
    }

    public function test_a_cancelled_slot_can_be_booked_again(): void
    {
        $slot = $this->slotStart();

        $this->book(4, $slot)->assertStatus(201);
        $appointment = Appointment::query()->firstOrFail();

        $this->postJson('/api/appointments/' . $appointment->id . '/cancel', [
            'reason' => 'Plans changed',
        ], $this->asUser(4, 'student'))->assertStatus(200);

        // The active-slot unique index must not block a rebooking.
        $this->book(5, $slot)->assertStatus(201);
    }

    public function test_counselor_can_confirm_a_pending_appointment(): void
    {
        $this->book(4, $this->slotStart())->assertStatus(201);
        $appointment = Appointment::query()->firstOrFail();

        $this->patchJson('/api/appointments/' . $appointment->id . '/status', [
            'status' => 'confirmed',
        ], $this->asUser(2, 'counselor'))->assertStatus(200);

        $this->assertSame(Appointment::STATUS_CONFIRMED, $appointment->fresh()->status);
        $this->assertNotNull($appointment->fresh()->confirmed_at);
    }

    public function test_counselor_cannot_manage_another_counselors_appointment(): void
    {
        $this->book(4, $this->slotStart())->assertStatus(201);
        $appointment = Appointment::query()->firstOrFail();

        CounselorProfile::create(['user_id' => 3, 'accepting_students' => true]);

        $this->patchJson('/api/appointments/' . $appointment->id . '/status', [
            'status' => 'confirmed',
        ], $this->asUser(3, 'counselor'))->assertStatus(403);
    }

    public function test_invalid_transition_is_rejected(): void
    {
        $this->book(4, $this->slotStart())->assertStatus(201);
        $appointment = Appointment::query()->firstOrFail();

        // pending -> completed is not an allowed transition.
        $this->patchJson('/api/appointments/' . $appointment->id . '/status', [
            'status' => 'completed',
        ], $this->asUser(2, 'counselor'))->assertStatus(422);
    }
}
