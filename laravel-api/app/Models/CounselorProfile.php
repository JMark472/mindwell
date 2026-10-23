<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A counselor's profile. The linked `user_id` points at the Express-owned
 * `users` table (no cross-service foreign key — see docs/architecture.md).
 */
class CounselorProfile extends Model
{
    protected $fillable = [
        'user_id',
        'specialization',
        'bio',
        'credentials',
        'max_weekly_appointments',
        'accepting_students',
    ];

    protected $casts = [
        'accepting_students' => 'boolean',
        'max_weekly_appointments' => 'integer',
    ];

    public function availability(): HasMany
    {
        return $this->hasMany(CounselorAvailability::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Resolves the display name for this counselor through the Express
     * service (the authoritative owner of user identity).
     */
    public function displayName(): string
    {
        return \App\Support\ExpressClient::userName($this->user_id) ?? ('Counselor #' . $this->user_id);
    }
}
