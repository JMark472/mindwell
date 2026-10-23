<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Confidential counseling records (owned by the Laravel service).
 *
 * These rows are strictly separated from ordinary profile data. They are
 * readable only by the counselor assigned to the student (and never by the
 * student or by administrators), which is enforced in CounselingRecordPolicy.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('counseling_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_user_id');
            $table->unsignedBigInteger('counselor_user_id');
            $table->unsignedBigInteger('appointment_id')->nullable();
            $table->date('session_date');
            $table->text('summary');
            $table->text('follow_up_plan')->nullable();
            $table->text('recommendations')->nullable();
            $table->string('referral_service')->nullable();
            $table->string('risk_level', 20)->default('none'); // none|low|moderate|high
            $table->timestamps();

            $table->index(['student_user_id']);
            $table->index(['counselor_user_id', 'session_date']);
            $table->index('appointment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('counseling_records');
    }
};
