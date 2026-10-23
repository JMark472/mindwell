<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_DECLINED = 'declined';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
        self::STATUS_DECLINED,
    ];

    protected $fillable = [
        'student_user_id',
        'counselor_profile_id',
        'slot_start',
        'slot_end',
        'status',
        'mode',
        'concern_category',
        'student_note',
        'counselor_note',
        'cancellation_reason',
        'cancelled_by_user_id',
        'confirmed_at',
        'completed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'slot_start' => 'datetime',
        'slot_end' => 'datetime',
        'confirmed_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function counselor(): BelongsTo
    {
        return $this->belongsTo(CounselorProfile::class, 'counselor_profile_id');
    }

    public function counselingRecords()
    {
        return $this->hasMany(CounselingRecord::class);
    }

    public function isActive(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_CONFIRMED], true);
    }
}
