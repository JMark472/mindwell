<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wellness check-in tables (owned by the Laravel service).
 *
 * Check-ins are a voluntary reflection tool. Scores are stored as simple
 * self-reported ratings; they are NOT clinical instruments, are never used
 * to diagnose or label a student, and are only visible to a counselor when
 * the student has explicitly granted consent (consent_records).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wellness_checkins', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_user_id');
            $table->unsignedTinyInteger('mood_score'); // 1..5 self-reported
            $table->unsignedTinyInteger('energy_score')->nullable(); // 1..5
            $table->unsignedTinyInteger('stress_score')->nullable(); // 1..5
            $table->decimal('sleep_hours', 3, 1)->nullable();
            $table->json('influences')->nullable(); // chips: study, family, ...
            $table->text('note')->nullable();
            $table->boolean('is_shared_with_counselor')->default(false);
            $table->timestamps();

            $table->index(['student_user_id', 'created_at']);
        });

        Schema::create('wellness_checkin_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('wellness_checkin_id');
            $table->string('question_key');
            $table->string('question_prompt');
            $table->string('answer_value')->nullable();
            $table->text('answer_text')->nullable();
            $table->timestamps();

            $table->foreign('wellness_checkin_id')
                ->references('id')->on('wellness_checkins')
                ->cascadeOnDelete();
            $table->index(['wellness_checkin_id', 'question_key']);
        });

        Schema::create('consent_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_user_id');
            $table->string('consent_type'); // checkin_sharing|counselor_access|research
            $table->boolean('is_granted')->default(false);
            $table->json('scope')->nullable();
            $table->string('policy_version')->nullable();
            $table->dateTime('granted_at')->nullable();
            $table->dateTime('revoked_at')->nullable();
            $table->timestamps();

            $table->index(['student_user_id', 'consent_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consent_records');
        Schema::dropIfExists('wellness_checkin_answers');
        Schema::dropIfExists('wellness_checkins');
    }
};
