<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Food extends Model
{
    protected $table = 'foods';
    protected $fillable = [
        'user_id',
        'name', 'category', 'calories', 'protein', 'carbs', 'fat',
        'fiber', 'vitamins', 'serving_size', 'serving_unit',
        'is_veg', 'is_vegan', 'is_jain', 'glycemic_index',
        'allergens', 'is_low_sodium', 'is_thyroid_friendly', 'is_heart_friendly', 'is_pcod_friendly',
    ];

    protected $casts = [
        'vitamins' => 'array',
        'is_veg' => 'boolean',
        'is_vegan' => 'boolean',
        'is_jain' => 'boolean',
        'allergens' => 'array',
        'is_low_sodium' => 'boolean',
        'is_thyroid_friendly' => 'boolean',
        'is_heart_friendly' => 'boolean',
        'is_pcod_friendly' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function mealItems()
    {
        return $this->hasMany(MealItem::class);
    }
}
