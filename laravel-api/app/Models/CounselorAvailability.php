<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CounselorAvailability extends Model
{
    protected $table = 'counselor_availability';

    protected $fillable = [
        'counselor_profile_id',
        'day_of_week',
        'start_time',
        'end_time',
        'slot_minutes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'slot_minutes' => 'integer',
        'day_of_week' => 'integer',
    ];

    public function counselor(): BelongsTo
    {
        return $this->belongsTo(CounselorProfile::class, 'counselor_profile_id');
    }
}
