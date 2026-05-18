<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MealPlan extends Model
{
    protected $fillable = [
        'user_id', 'date', 'total_calories', 'protein_target',
        'carbs_target', 'fat_target', 'water_intake_liters',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function mealItems()
    {
        return $this->hasMany(MealItem::class);
    }

    public function breakfast()
    {
        return $this->mealItems()->where('meal_type', 'breakfast');
    }

    public function lunch()
    {
        return $this->mealItems()->where('meal_type', 'lunch');
    }

    public function snack()
    {
        return $this->mealItems()->where('meal_type', 'snack');
    }

    public function dinner()
    {
        return $this->mealItems()->where('meal_type', 'dinner');
    }
}
