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
        $hasFilters = $request->filled('category') || $request->filled('search');
        $userId = $request->user()->id;

        $query = Recipe::query()->with('ingredients.food');

        // Global recipes + user's own recipes
        $query->where(function ($q) use ($userId) {
            $q->whereNull('user_id')
              ->orWhere('user_id', $userId);
        });

        // Filter by exact category column
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Optional name search
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if (!$hasFilters) {
            $cacheKey = "recipes_user_{$userId}";
            return response()->json(\Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($query) {
                return $query->latest()->get();
            }));
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'description'  => 'nullable|string',
            'category'     => 'nullable|string|in:breakfast,lunch,dinner,snack,dessert,drink,general',
            'instructions' => 'nullable|string',
            'image_url'    => 'nullable|url',
            'ingredients'  => 'required|array|min:1',
            'ingredients.*.food_id'  => 'required|exists:foods,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.1',
            'ingredients.*.unit'     => 'required|string',
            'is_premium'   => 'boolean'
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $recipe = Recipe::create([
                'user_id'      => $request->user()->id,
                'name'         => $validated['name'],
                'description'  => $validated['description'] ?? null,
                'category'     => $validated['category'] ?? 'general',
                'instructions' => $validated['instructions'] ?? null,
                'image_url'    => $validated['image_url'] ?? null,
                'is_premium'   => $validated['is_premium'] ?? false,
            ]);

            foreach ($validated['ingredients'] as $ing) {
                $recipe->ingredients()->create($ing);
            }

            $this->recalculateNutrition($recipe);
            \Illuminate\Support\Facades\Cache::forget("recipes_user_{$request->user()->id}");
            \Illuminate\Support\Facades\Cache::forget('admin_platform_stats');

            return response()->json($recipe->load('ingredients.food'), 201);
        });
    }

    /**
     * Display the specified resource.
     * Premium recipes are restricted to premium users and admins only.
     */
    public function show(Recipe $recipe, Request $request)
    {
        if ($recipe->is_premium && !$request->user()->isPremium()) {
            return response()->json([
                'message'          => 'This is a Premium recipe. Upgrade to Premium to unlock it.',
                'premium_required' => true,
            ], 403);
        }

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
            'name'         => 'sometimes|required|string|max:255',
            'description'  => 'nullable|string',
            'category'     => 'nullable|string|in:breakfast,lunch,dinner,snack,dessert,drink,general',
            'instructions' => 'nullable|string',
            'image_url'    => 'nullable|url',
            'ingredients'  => 'sometimes|required|array|min:1',
            'ingredients.*.food_id'  => 'required|exists:foods,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.1',
            'ingredients.*.unit'     => 'required|string',
            'is_premium'   => 'boolean'
        ]);

        return DB::transaction(function () use ($validated, $recipe, $request) {
            $recipe->update($validated);

            if (isset($validated['ingredients'])) {
                $recipe->ingredients()->delete();
                foreach ($validated['ingredients'] as $ing) {
                    $recipe->ingredients()->create($ing);
                }
            }

            $this->recalculateNutrition($recipe);
            \Illuminate\Support\Facades\Cache::forget("recipes_user_{$request->user()->id}");
            \Illuminate\Support\Facades\Cache::forget('admin_platform_stats');

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
        \Illuminate\Support\Facades\Cache::forget("recipes_user_{$request->user()->id}");
        \Illuminate\Support\Facades\Cache::forget('admin_platform_stats');
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
