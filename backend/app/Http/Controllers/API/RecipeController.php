<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\Food;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Recipe::query()->with('ingredients.food');

        // Global recipes + user's own recipes
        $query->where(function ($q) use ($request) {
            $q->whereNull('user_id')
              ->orWhere('user_id', $request->user()->id);
        });

        if ($request->has('category')) {
            $query->where('description', 'like', '%' . $request->category . '%');
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'instructions' => 'nullable|string',
            'image_url' => 'nullable|url',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.food_id' => 'required|exists:foods,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.1',
            'ingredients.*.unit' => 'required|string',
            'is_premium' => 'boolean'
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $recipe = Recipe::create([
                'user_id' => $request->user()->id,
                'name' => $validated['name'],
                'description' => $validated['description'],
                'instructions' => $validated['instructions'],
                'image_url' => $validated['image_url'],
                'is_premium' => $validated['is_premium'] ?? false,
            ]);

            foreach ($validated['ingredients'] as $ing) {
                $recipe->ingredients()->create($ing);
            }

            $this->recalculateNutrition($recipe);

            return response()->json($recipe->load('ingredients.food'), 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(Recipe $recipe)
    {
        return response()->json($recipe->load('ingredients.food'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Recipe $recipe)
    {
        if ($recipe->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'instructions' => 'nullable|string',
            'image_url' => 'nullable|url',
            'ingredients' => 'sometimes|required|array|min:1',
            'ingredients.*.food_id' => 'required|exists:foods,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.1',
            'ingredients.*.unit' => 'required|string',
            'is_premium' => 'boolean'
        ]);

        return DB::transaction(function () use ($validated, $recipe) {
            $recipe->update($validated);

            if (isset($validated['ingredients'])) {
                $recipe->ingredients()->delete();
                foreach ($validated['ingredients'] as $ing) {
                    $recipe->ingredients()->create($ing);
                }
            }

            $this->recalculateNutrition($recipe);

            return response()->json($recipe->load('ingredients.food'));
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Recipe $recipe, Request $request)
    {
        if ($recipe->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $recipe->delete();
        return response()->json(['message' => 'Recipe deleted']);
    }

    private function recalculateNutrition(Recipe $recipe)
    {
        $totals = [
            'calories' => 0,
            'protein' => 0,
            'carbs' => 0,
            'fat' => 0
        ];

        foreach ($recipe->ingredients()->with('food')->get() as $ingredient) {
            $food = $ingredient->food;
            $servingSize = max(1, $food->serving_size ?? 100);
            $ratio = $ingredient->quantity / $servingSize;

            $totals['calories'] += $food->calories * $ratio;
            $totals['protein'] += $food->protein * $ratio;
            $totals['carbs'] += $food->carbs * $ratio;
            $totals['fat'] += $food->fat * $ratio;
        }

        $recipe->update($totals);
    }
}
