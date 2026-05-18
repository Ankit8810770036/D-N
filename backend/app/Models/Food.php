<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Food extends Model
{
    protected $table = 'foods';
    protected $fillable = [
        'name', 'category', 'calories', 'protein', 'carbs', 'fat',
        'fiber', 'vitamins', 'serving_size', 'serving_unit',
        'is_veg', 'is_vegan', 'is_jain', 'glycemic_index',
    ];

    protected $casts = [
        'vitamins' => 'array',
        'is_veg' => 'boolean',
        'is_vegan' => 'boolean',
        'is_jain' => 'boolean',
    ];

    public function mealItems()
    {
        return $this->hasMany(MealItem::class);
    }
}
