<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A voluntary wellness check-in.
 *
 * IMPORTANT: scores are simple self-reported ratings for personal
 * reflection. They are not clinical instruments, are never presented as a
 * diagnosis, and are never used to automatically label a student.
 */
class WellnessCheckin extends Model
{
    protected $fillable = [
        'student_user_id',
        'mood_score',
        'energy_score',
        'stress_score',
        'sleep_hours',
        'influences',
        'note',
        'is_shared_with_counselor',
    ];

    protected $casts = [
        'influences' => 'array',
        'is_shared_with_counselor' => 'boolean',
        'mood_score' => 'integer',
        'energy_score' => 'integer',
        'stress_score' => 'integer',
        'sleep_hours' => 'float',
    ];

    public function answers(): HasMany
    {
        return $this->hasMany(WellnessCheckinAnswer::class);
    }
}
