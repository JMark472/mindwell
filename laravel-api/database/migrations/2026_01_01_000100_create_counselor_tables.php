<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TABLE OWNERSHIP — Mindwell Laravel API (service 2)
 * ---------------------------------------------------
 * The Express service owns `users`, `student_profiles`, `notifications`,
 * `audit_logs`, `system_settings` and `password_reset_tokens`.
 *
 * This service owns the counseling / wellness module tables below. The
 * `user_id` columns reference the Express-owned `users` table by id only
 * (no cross-service foreign keys, so each service can migrate independently).
 * Integrity is enforced at the API layer through documented service calls.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('counselor_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('specialization')->nullable();
            $table->text('bio')->nullable();
            $table->string('credentials')->nullable();
            $table->unsignedTinyInteger('max_weekly_appointments')->default(20);
            $table->boolean('accepting_students')->default(true);
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('counselor_availability', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('counselor_profile_id');
            $table->unsignedTinyInteger('day_of_week'); // 0 = Sunday
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('slot_minutes')->default(50);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('counselor_profile_id')
                ->references('id')->on('counselor_profiles')
                ->cascadeOnDelete();
            $table->index(['counselor_profile_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('counselor_availability');
        Schema::dropIfExists('counselor_profiles');
    }
};
