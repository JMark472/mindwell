<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Appointments table (owned by the Laravel service).
 *
 * `user_id` columns reference the Express-owned `users` table by id only.
 * A unique index on (counselor_id, slot_start) provides the hard database
 * guarantee that a counselor can never be double-booked, which backs the
 * transactional booking workflow in AppointmentService.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_user_id');
            $table->unsignedBigInteger('counselor_profile_id');
            $table->dateTime('slot_start');
            $table->dateTime('slot_end');
            $table->string('status', 20)->default('pending'); // pending|confirmed|completed|cancelled|declined
            $table->string('mode', 20)->default('online'); // online|in_person
            $table->string('concern_category')->nullable();
            $table->text('student_note')->nullable();
            $table->text('counselor_note')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->unsignedBigInteger('cancelled_by_user_id')->nullable();
            $table->dateTime('confirmed_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['student_user_id', 'slot_start']);
            $table->index(['counselor_profile_id', 'slot_start']);
            $table->index('status');
            // Double-booking guard: one slot per counselor.
            $table->unique(['counselor_profile_id', 'slot_start'], 'appointments_counselor_slot_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
