<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id', 'age', 'gender', 'height_cm', 'weight_kg', 'waist_cm',
        'goal', 'activity_level', 'sleep_hours', 'diseases', 'allergies',
        'food_preference', 'bmi', 'bmr', 'tdee', 'calories_target',
    ];

    protected $casts = [
        'diseases' => 'array',
        'allergies' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
