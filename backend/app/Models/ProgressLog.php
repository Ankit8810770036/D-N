<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgressLog extends Model
{
    protected $fillable = [
        'user_id', 'date', 'weight', 'calories_consumed', 'protein', 'carbs', 'fat',
        'water_intake_liters', 'steps', 'sleep_hours', 'workout_done', 'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'workout_done' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
