<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Explicit consent record. Sharing a check-in with a counselor requires a
 * granted `checkin_sharing` consent for that student.
 */
class ConsentRecord extends Model
{
    public const TYPE_CHECKIN_SHARING = 'checkin_sharing';
    public const TYPE_COUNSELOR_ACCESS = 'counselor_access';
    public const TYPE_RESEARCH = 'research';

    protected $fillable = [
        'student_user_id',
        'consent_type',
        'is_granted',
        'scope',
        'policy_version',
        'granted_at',
        'revoked_at',
    ];

    protected $casts = [
        'scope' => 'array',
        'is_granted' => 'boolean',
        'granted_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function scopeGranted($query, string $type)
    {
        return $query->where('consent_type', $type)->where('is_granted', true);
    }
}
