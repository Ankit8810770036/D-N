<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Food;
use Illuminate\Http\Request;

class FoodController extends Controller
{
    public function index(Request $request)
    {
        $query = Food::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        if ($request->has('is_veg')) {
            $query->where('is_veg', filter_var($request->is_veg, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->has('is_vegan')) {
            $query->where('is_vegan', filter_var($request->is_vegan, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->isPremium() && !$user->isAdmin()) {
            return response()->json([
                'error' => 'Custom food creation is a Premium feature. Upgrade to Premium to save your own foods.',
                'premium_required' => true
            ], 403);
        }

        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'category'     => 'nullable|string',
            'calories'     => 'required|numeric|min:0',
            'protein'      => 'required|numeric|min:0',
            'carbs'        => 'required|numeric|min:0',
            'fat'          => 'required|numeric|min:0',
            'fiber'        => 'nullable|numeric|min:0',
            'vitamins'     => 'nullable|array',
            'serving_size' => 'nullable|numeric',
            'serving_unit' => 'nullable|string',
            'is_veg'       => 'boolean',
            'is_vegan'     => 'boolean',
            'is_jain'      => 'boolean',
            'glycemic_index'=> 'nullable|numeric',
        ]);

        $validated['category']     = $validated['category'] ?? 'custom';
        $validated['serving_size'] = $validated['serving_size'] ?? 100;
        $validated['serving_unit'] = $validated['serving_unit'] ?? 'g';

        return response()->json(Food::create($validated), 201);
    }

    public function show(Food $food)
    {
        return response()->json($food);
    }

    public function update(Request $request, Food $food)
    {
        $this->authorize('admin');

        $validated = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'category'     => 'nullable|string',
            'calories'     => 'sometimes|numeric|min:0',
            'protein'      => 'sometimes|numeric|min:0',
            'carbs'        => 'sometimes|numeric|min:0',
            'fat'          => 'sometimes|numeric|min:0',
            'fiber'        => 'nullable|numeric|min:0',
            'serving_size' => 'nullable|numeric',
            'serving_unit' => 'nullable|string',
        ]);

        $food->update($validated);
        return response()->json($food);
    }

    public function destroy(Food $food)
    {
        $this->authorize('admin');
        $food->delete();
        return response()->json(['message' => 'Food deleted successfully']);
    }
}
