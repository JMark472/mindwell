<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Double-booking guard that only applies to *active* appointments.
 *
 * A plain UNIQUE(counselor_profile_id, slot_start) index would also block a
 * slot from being rebooked after the original appointment was cancelled or
 * declined, because the historical row still occupies the slot. MariaDB has
 * no partial indexes, so a stored generated column holds `slot_start` for
 * active rows and NULL otherwise. Unique indexes permit multiple NULLs,
 * which gives us exactly "at most one active appointment per counselor slot".
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE appointments DROP INDEX appointments_counselor_slot_unique');

        DB::statement(
            "ALTER TABLE appointments
             ADD COLUMN active_slot_start DATETIME
             AS (CASE WHEN status IN ('pending', 'confirmed') THEN slot_start ELSE NULL END) STORED"
        );

        DB::statement(
            'ALTER TABLE appointments
             ADD UNIQUE INDEX appointments_counselor_active_slot_unique (counselor_profile_id, active_slot_start)'
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE appointments DROP INDEX appointments_counselor_active_slot_unique');
        DB::statement('ALTER TABLE appointments DROP COLUMN active_slot_start');
        DB::statement(
            'ALTER TABLE appointments
             ADD UNIQUE INDEX appointments_counselor_slot_unique (counselor_profile_id, slot_start)'
        );
    }
};
