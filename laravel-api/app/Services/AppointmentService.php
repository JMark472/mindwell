<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\CounselorAvailability;
use App\Models\CounselorProfile;
use App\Support\ExpressClient;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    /**
     * Lists the bookable slots for a counselor on a given date.
     *
     * Slots come from the counselor's weekly availability template. Slots
     * already taken by a pending/confirmed appointment are excluded.
     */
    public function availableSlots(int $counselorProfileId, string $date): array
    {
        $day = Carbon::parse($date)->startOfDay();
        $rules = config('mindwell.appointment');
        $duration = $rules['default_duration_minutes'];

        $availability = CounselorAvailability::query()
            ->where('counselor_profile_id', $counselorProfileId)
            ->where('day_of_week', $day->dayOfWeek)
            ->where('is_active', true)
            ->get();

        if ($availability->isEmpty()) {
            return [];
        }

        $dayEnd = $day->copy()->addDay();
        $taken = Appointment::query()
            ->where('counselor_profile_id', $counselorProfileId)
            ->whereBetween('slot_start', [$day, $dayEnd])
            ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED])
            ->pluck('slot_start')
            ->map(fn ($d) => $d->format('Y-m-d H:i:s'))
            ->all();

        $slots = [];
        $now = Carbon::now();

        foreach ($availability as $window) {
            $cursor = $day->copy()->setTimeFromTimeString($window->start_time);
            $end = $day->copy()->setTimeFromTimeString($window->end_time);
            $slotMinutes = $window->slot_minutes ?: $duration;

            while ($cursor->copy()->addMinutes($slotMinutes)->lte($end)) {
                $slotEnd = $cursor->copy()->addMinutes($slotMinutes);

                if ($cursor->greaterThan($now->copy()->addHours((int) $rules['min_notice_hours']))) {
                    $slots[] = [
                        'start' => $cursor->toIso8601String(),
                        'end' => $slotEnd->toIso8601String(),
                        'label' => $cursor->format('g:i A'),
                        'available' => ! in_array($cursor->format('Y-m-d H:i:s'), $taken, true),
                    ];
                }

                $cursor = $slotEnd;
            }
        }

        return $slots;
    }

    /**
     * Books an appointment.
     *
     * Double booking is prevented at two levels:
     *  1. a unique index on (counselor_profile_id, slot_start) in the DB, and
     *  2. a transaction with a row lock on the counselor's appointments.
     */
    public function book(
        int $studentUserId,
        int $counselorProfileId,
        string $slotStart,
        string $mode = 'online',
        ?string $concernCategory = null,
        ?string $studentNote = null
    ): Appointment {
        $rules = config('mindwell.appointment');
        $start = Carbon::parse($slotStart)->startOfMinute();

        if ($start->lessThan(Carbon::now()->addHours((int) $rules['min_notice_hours']))) {
            throw ValidationException::withMessages([
                'slot_start' => 'Appointments require at least '.$rules['min_notice_hours'].' hours notice.',
            ]);
        }

        if ($start->greaterThan(Carbon::now()->addDays((int) $rules['max_advance_days']))) {
            throw ValidationException::withMessages([
                'slot_start' => 'Appointments can only be booked up to '.$rules['max_advance_days'].' days ahead.',
            ]);
        }

        $counselor = CounselorProfile::query()->find($counselorProfileId);
        if (! $counselor) {
            throw ValidationException::withMessages([
                'counselor_profile_id' => 'Counselor not found.',
            ]);
        }

        $duration = (int) $rules['default_duration_minutes'];
        $end = $start->copy()->addMinutes($duration);

        // A student cannot hold two overlapping appointments.
        $studentClash = Appointment::query()
            ->where('student_user_id', $studentUserId)
            ->whereIn('status', [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED])
            ->where(function ($q) use ($start, $end) {
                $q->where('slot_start', '<', $end)->where('slot_end', '>', $start);
            })
            ->exists();

        if ($studentClash) {
            throw ValidationException::withMessages([
                'slot_start' => 'You already have an appointment during that time.',
            ]);
        }

        try {
            $appointment = DB::transaction(function () use ($studentUserId, $counselorProfileId, $start, $end, $mode, $concernCategory, $studentNote) {
                // Lock the counselor's rows so two concurrent requests cannot
                // both pass the availability check.
                $counselorAppointments = Appointment::query()
                    ->where('counselor_profile_id', $counselorProfileId)
                    ->lockForUpdate()
                    ->get();

                $clash = $counselorAppointments->contains(
                    fn (Appointment $a) => $a->slot_start->equalTo($start)
                        && in_array($a->status, [Appointment::STATUS_PENDING, Appointment::STATUS_CONFIRMED], true)
                );

                if ($clash) {
                    throw ValidationException::withMessages([
                        'slot_start' => 'That slot was just taken. Please pick another time.',
                    ]);
                }

                return Appointment::create([
                    'student_user_id' => $studentUserId,
                    'counselor_profile_id' => $counselorProfileId,
                    'slot_start' => $start,
                    'slot_end' => $end,
                    'status' => Appointment::STATUS_PENDING,
                    'mode' => $mode,
                    'concern_category' => $concernCategory,
                    'student_note' => $studentNote,
                ]);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // Unique index violation = the slot was taken concurrently.
            if ($e->getCode() === '23000' || str_contains($e->getMessage(), 'appointments_counselor_active_slot_unique')) {
                throw ValidationException::withMessages([
                    'slot_start' => 'That slot was just taken. Please pick another time.',
                ]);
            }

            throw $e;
        }

        ExpressClient::notify([[
            'user_id' => $counselor->user_id,
            'type' => 'appointment.requested',
            'title' => 'New appointment request',
            'body' => 'A student requested a counseling appointment.',
            'link' => '/counselor/appointments',
        ]]);

        return $appointment;
    }

    /**
     * Counselor actions: confirm, decline, complete.
     */
    public function transition(Appointment $appointment, string $newStatus, int $actorUserId, ?string $note = null): Appointment
    {
        $allowed = [
            Appointment::STATUS_PENDING => [Appointment::STATUS_CONFIRMED, Appointment::STATUS_DECLINED, Appointment::STATUS_CANCELLED],
            Appointment::STATUS_CONFIRMED => [Appointment::STATUS_COMPLETED, Appointment::STATUS_CANCELLED],
        ];

        if (! in_array($newStatus, $allowed[$appointment->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => 'Cannot move an appointment from '.$appointment->status.' to '.$newStatus.'.',
            ]);
        }

        $appointment->status = $newStatus;
        $appointment->counselor_note = $note ?? $appointment->counselor_note;

        if ($newStatus === Appointment::STATUS_CONFIRMED) {
            $appointment->confirmed_at = now();
        }
        if ($newStatus === Appointment::STATUS_COMPLETED) {
            $appointment->completed_at = now();
        }

        $appointment->save();

        ExpressClient::notify([[
            'user_id' => $appointment->student_user_id,
            'type' => 'appointment.'.$newStatus,
            'title' => 'Appointment '.ucfirst($newStatus),
            'body' => 'Your counseling appointment has been '.strtolower($newStatus).'.',
            'link' => '/student/appointments',
        ]]);

        return $appointment;
    }

    /**
     * Student (or counselor) cancellation, honouring the cutoff window.
     */
    public function cancel(Appointment $appointment, int $actorUserId, string $reason = ''): Appointment
    {
        if (! $appointment->isActive()) {
            throw ValidationException::withMessages([
                'status' => 'This appointment is already '.$appointment->status.'.',
            ]);
        }

        $cutoff = (int) config('mindwell.appointment')['cancellation_cutoff_hours'];
        if ($appointment->slot_start->lessThan(now()->addHours($cutoff))) {
            throw ValidationException::withMessages([
                'slot_start' => 'Appointments cannot be cancelled within '.$cutoff.' hours of the session. Please contact your counselor.',
            ]);
        }

        $appointment->status = Appointment::STATUS_CANCELLED;
        $appointment->cancellation_reason = $reason;
        $appointment->cancelled_by_user_id = $actorUserId;
        $appointment->cancelled_at = now();
        $appointment->save();

        ExpressClient::notify([[
            'user_id' => $appointment->student_user_id,
            'type' => 'appointment.cancelled',
            'title' => 'Appointment cancelled',
            'body' => 'Your counseling appointment was cancelled.',
            'link' => '/student/appointments',
        ]]);

        return $appointment;
    }
}
