<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeIngredient extends Model
{
    protected $fillable = ['recipe_id', 'food_id', 'quantity', 'unit'];

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }

    public function food()
    {
        return $this->belongsTo(Food::class);
    }}
