<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WellnessCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'accent_color',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function resources(): HasMany
    {
        return $this->hasMany(WellnessResource::class);
    }
}
