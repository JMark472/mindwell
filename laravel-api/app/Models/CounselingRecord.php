<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Confidential counseling record.
 *
 * Visible ONLY to the counselor who is assigned to the student. Never
 * exposed to the student, to other students, or to administrators.
 */
class CounselingRecord extends Model
{
    public const RISK_NONE = 'none';
    public const RISK_LOW = 'low';
    public const RISK_MODERATE = 'moderate';
    public const RISK_HIGH = 'high';

    protected $fillable = [
        'student_user_id',
        'counselor_user_id',
        'appointment_id',
        'session_date',
        'summary',
        'follow_up_plan',
        'recommendations',
        'referral_service',
        'risk_level',
    ];

    protected $casts = [
        'session_date' => 'date',
    ];

    // Authorization for these rows is enforced by CounselingRecordPolicy,
    // which restricts reads to the assigned counselor. An empty global scope
    // would be misleading, so none is registered here.
}
