<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WellnessCheckinAnswer extends Model
{
    protected $fillable = [
        'wellness_checkin_id',
        'question_key',
        'question_prompt',
        'answer_value',
        'answer_text',
    ];

    public function checkin(): BelongsTo
    {
        return $this->belongsTo(WellnessCheckin::class, 'wellness_checkin_id');
    }
}
