<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Counselor advice attached to a shared wellness check-in.
 *
 * Advice is only written by a counselor the student is assigned to, and is
 * visible to the student who created the check-in.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wellness_checkins', function (Blueprint $table) {
            $table->unsignedBigInteger('counselor_user_id')->nullable()->after('is_shared_with_counselor');
            $table->text('counselor_advice')->nullable()->after('counselor_user_id');
            $table->timestamp('advised_at')->nullable()->after('counselor_advice');

            $table->index('counselor_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('wellness_checkins', function (Blueprint $table) {
            $table->dropIndex(['counselor_user_id']);
            $table->dropColumn(['counselor_user_id', 'counselor_advice', 'advised_at']);
        });
    }
};
