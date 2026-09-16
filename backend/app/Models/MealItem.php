<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MealItem extends Model
{
    protected $fillable = [
        'meal_plan_id', 'food_id', 'recipe_id', 'meal_type', 'quantity', 'unit',
        'calories', 'protein', 'carbs', 'fat', 'is_consumed', 'is_bought',
    ];

    protected $casts = [
        'is_consumed' => 'boolean',
        'is_bought'   => 'boolean',
        'calories' => 'float',
        'protein'  => 'float',
        'carbs'    => 'float',
        'fat'      => 'float',
        'quantity' => 'float',
    ];

    public function mealPlan()
    {
        return $this->belongsTo(MealPlan::class);
    }

    public function food()
    {
        return $this->belongsTo(Food::class);
    }

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }
}
