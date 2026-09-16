<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Food;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class FoodController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user('sanctum');
        $hasFilters = $request->has('search') || $request->has('category') || 
                      $request->has('is_veg') || $request->has('is_vegan') || 
                      $request->has('all');

        $query = Food::query();

        // Multi-tenant isolation:
        // Admin with admin_view flag sees all foods.
        // Logged-in user sees global foods (user_id IS NULL) + their own custom foods (user_id = $user->id).
        // Unauthenticated visitor sees only global foods (user_id IS NULL).
        if ($user && $user->isAdmin() && $request->has('admin_view')) {
            // Admin management view
        } elseif ($user) {
            $query->where(function ($q) use ($user) {
                $q->whereNull('user_id')->orWhere('user_id', $user->id);
            });
        } else {
            $query->whereNull('user_id');
        }

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

        if ($request->has('all') && filter_var($request->all, FILTER_VALIDATE_BOOLEAN)) {
            return response()->json($query->latest()->get());
        }

        return response()->json($query->latest()->paginate(20));
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

        // Attach custom food exclusively to this user (or allow admin to create global food)
        $validated['user_id'] = ($user->isAdmin() && $request->has('is_global')) ? null : $user->id;

        $food = Food::create($validated);
        $this->clearFoodCache();
        return response()->json($food, 201);
    }

    public function show(Request $request, Food $food)
    {
        $user = $request->user('sanctum');
        // Prevent access to other users' custom foods
        if ($food->user_id !== null && (!$user || ($user->id !== $food->user_id && !$user->isAdmin()))) {
            return response()->json(['message' => 'Food not found or access denied.'], 404);
        }

        return response()->json($food);
    }

    public function update(Request $request, Food $food)
    {
        $user = $request->user();
        // Regular user can only update their own custom foods; admin can update any
        if ($food->user_id !== null && $food->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized to update this food.'], 403);
        }
        if ($food->user_id === null && !$user->isAdmin()) {
            return response()->json(['message' => 'Cannot edit global system foods.'], 403);
        }

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
        $this->clearFoodCache();
        return response()->json($food);
    }

    public function destroy(Request $request, Food $food)
    {
        $user = $request->user();
        // Regular user can only delete their own custom foods; admin can delete any
        if ($food->user_id !== null && $food->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized to delete this food.'], 403);
        }
        if ($food->user_id === null && !$user->isAdmin()) {
            return response()->json(['message' => 'Cannot delete global system foods.'], 403);
        }

        $food->delete();
        $this->clearFoodCache();
        return response()->json(['message' => 'Food deleted successfully']);
    }

    public function barcodeLookup(string $barcode)
    {
        $cleaned = trim($barcode);
        if (empty($cleaned)) {
            return response()->json(['error' => 'Please provide a valid barcode.'], 422);
        }

        // 1. Check local cache first
        $cacheKey = "barcode_lookup_{$cleaned}";
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json($cached);
        }

        // 2. Query OpenFoodFacts API with proper User-Agent header
        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'User-Agent' => 'SmartDietPlanner - Web/App - Version 1.0 (https://smartdietplanner.com; contact@smartdietplanner.com)'
            ])->timeout(6)->get("https://world.openfoodfacts.org/api/v0/product/{$cleaned}.json");

            if ($response->successful()) {
                $data = $response->json();
                if (($data['status'] ?? 0) === 1 && !empty($data['product'])) {
                    $p = $data['product'];
                    $nutriments = $p['nutriments'] ?? [];

                    // Extract calories safely
                    $calories = 0;
                    if (isset($nutriments['energy-kcal_100g']) && is_numeric($nutriments['energy-kcal_100g'])) {
                        $calories = (float) $nutriments['energy-kcal_100g'];
                    } elseif (isset($nutriments['energy-kcal']) && is_numeric($nutriments['energy-kcal'])) {
                        $calories = (float) $nutriments['energy-kcal'];
                    } elseif (isset($nutriments['energy_100g']) && is_numeric($nutriments['energy_100g'])) {
                        $calories = (float) $nutriments['energy_100g'] / 4.184;
                    } elseif (isset($nutriments['energy_value']) && is_numeric($nutriments['energy_value'])) {
                        $calories = (float) $nutriments['energy_value'] / 4.184;
                    }

                    $protein = (float) ($nutriments['proteins_100g'] ?? $nutriments['proteins'] ?? 0);
                    $carbs   = (float) ($nutriments['carbohydrates_100g'] ?? $nutriments['carbohydrates'] ?? 0);
                    $fat     = (float) ($nutriments['fat_100g'] ?? $nutriments['fat'] ?? 0);
                    $fiber   = (float) ($nutriments['fiber_100g'] ?? $nutriments['fiber'] ?? 0);

                    // Name
                    $name = $p['product_name'] ?? $p['product_name_en'] ?? $p['generic_name'] ?? $p['generic_name_en'] ?? null;
                    if (!$name && !empty($p['brands'])) {
                        $name = "{$p['brands']} Product";
                    }
                    if (!$name) {
                        $name = "Barcode #{$cleaned}";
                    }

                    // Vegetarian status analysis
                    $isVeg = true;
                    $isVegan = false;
                    $analysis = $p['ingredients_analysis_tags'] ?? [];
                    if (is_array($analysis)) {
                        if (in_array('en:non-vegetarian', $analysis)) {
                            $isVeg = false;
                        }
                        if (in_array('en:vegan', $analysis)) {
                            $isVegan = true;
                            $isVeg = true;
                        }
                    }

                    // Check if the product is edible / drinkable
                    $edibleCheck = $this->isEdibleProduct($p, $nutriments);
                    if (!$edibleCheck['is_edible']) {
                        return response()->json([
                            'found'     => false,
                            'is_edible' => false,
                            'error'     => $edibleCheck['reason'],
                            'name'      => substr($name, 0, 100),
                            'barcode'   => $cleaned,
                        ], 422);
                    }

                    $result = [
                        'found'        => true,
                        'is_edible'    => true,
                        'name'         => substr($name, 0, 100),
                        'brand'        => $p['brands'] ?? '',
                        'calories'     => round($calories),
                        'protein'      => round($protein, 1),
                        'carbs'        => round($carbs, 1),
                        'fat'          => round($fat, 1),
                        'fiber'        => round($fiber, 1),
                        'serving_size' => 100,
                        'serving_unit' => 'g',
                        'image_url'    => $p['image_url'] ?? $p['image_front_url'] ?? '',
                        'barcode'      => $cleaned,
                        'is_veg'       => $isVeg,
                        'is_vegan'     => $isVegan,
                    ];

                    Cache::put($cacheKey, $result, 86400); // cache for 24h
                    return response()->json($result);
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("OpenFoodFacts API error for barcode {$cleaned}: " . $e->getMessage());
        }

        // 3. Fallback: Check if local database has food with matching name or barcode
        $localFood = Food::where('name', 'like', "%{$cleaned}%")->first();
        if ($localFood) {
            return response()->json([
                'found'        => true,
                'is_edible'    => true,
                'name'         => $localFood->name,
                'brand'        => '',
                'calories'     => (float) $localFood->calories,
                'protein'      => (float) $localFood->protein,
                'carbs'        => (float) $localFood->carbs,
                'fat'          => (float) $localFood->fat,
                'fiber'        => (float) ($localFood->fiber ?? 0),
                'serving_size' => (float) ($localFood->serving_size ?? 100),
                'serving_unit' => $localFood->serving_unit ?? 'g',
                'barcode'      => $cleaned,
                'is_veg'       => (bool) $localFood->is_veg,
                'is_vegan'     => (bool) $localFood->is_vegan,
            ]);
        }

        // 4. If not found, return clean response with barcode
        return response()->json([
            'found'     => false,
            'is_edible' => false,
            'barcode'   => $cleaned,
            'name'      => "Product #{$cleaned}",
            'error'     => 'No food or beverage found for this barcode. Please ensure you are scanning edible food or drink items.',
        ], 404);
    }

    /**
     * Determine if a scanned OpenFoodFacts product is an edible food or drink item.
     */
    private function isEdibleProduct(array $p, array $nutriments): array
    {
        $name = strtolower($p['product_name'] ?? $p['product_name_en'] ?? $p['generic_name'] ?? $p['generic_name_en'] ?? '');
        $categories = strtolower($p['categories'] ?? '');
        $categoriesTags = array_map('strtolower', (array) ($p['categories_tags'] ?? []));
        $foodGroups = strtolower(implode(' ', (array) ($p['food_groups_tags'] ?? [])));
        $ingredientsText = strtolower($p['ingredients_text'] ?? $p['ingredients_text_en'] ?? '');

        $combinedText = "{$name} {$categories} " . implode(' ', $categoriesTags) . " {$foodGroups} {$ingredientsText}";

        // 1. Check for non-food / non-edible blacklist terms
        $nonEdibleKeywords = [
            'cosmetic', 'cosmetics', 'shampoo', 'conditioner', 'body wash', 'shower gel',
            'soap', 'bar soap', 'hand soap', 'lotion', 'body lotion', 'face cream', 'skin care',
            'skincare', 'hair care', 'haircare', 'hair dye', 'perfume', 'fragrance', 'cologne',
            'deodorant', 'antiperspirant', 'toothpaste', 'mouthwash', 'toothbrush', 'floss',
            'detergent', 'laundry', 'dishwash', 'dishwasher', 'disinfectant', 'bleach',
            'cleaning', 'cleaner', 'air freshener', 'battery', 'batteries', 'electronics',
            'charger', 'cable', 'apparel', 'clothing', 'shoes', 'footwear', 'shirt', 'pants',
            't-shirt', 'sock', 'socks', 'underwear', 'toy', 'toys', 'stationery', 'pen', 'pencil',
            'notebook', 'paper', 'book', 'books', 'hardware', 'tool', 'tools', 'pet food',
            'dog food', 'cat food', 'bird food', 'automotive', 'motor oil', 'lubricant',
            'household', 'candle', 'candles', 'insecticide', 'mosquito repellent'
        ];

        foreach ($nonEdibleKeywords as $kw) {
            if (str_contains($combinedText, $kw)) {
                return [
                    'is_edible' => false,
                    'reason'    => "Non-edible item detected (\"" . ($p['product_name'] ?? $kw) . "\"). Only edible food and drink items can be added."
                ];
            }
        }

        // 2. Check if it has positive nutritional calories/macros
        $calories = (float) ($nutriments['energy-kcal_100g'] ?? $nutriments['energy-kcal'] ?? 0);
        $protein  = (float) ($nutriments['proteins_100g'] ?? $nutriments['proteins'] ?? 0);
        $carbs    = (float) ($nutriments['carbohydrates_100g'] ?? $nutriments['carbohydrates'] ?? 0);
        $fat      = (float) ($nutriments['fat_100g'] ?? $nutriments['fat'] ?? 0);
        $hasMacros = ($calories > 0 || $protein > 0 || $carbs > 0 || $fat > 0);

        // 3. Check for edible food or beverage indicators
        $edibleIndicators = [
            'food', 'beverage', 'drink', 'water', 'tea', 'coffee', 'juice', 'snack', 'cereal',
            'bread', 'dairy', 'milk', 'cheese', 'yogurt', 'curd', 'fruit', 'vegetable', 'meat',
            'fish', 'poultry', 'egg', 'spice', 'herb', 'oil', 'flour', 'rice', 'dal', 'pulse',
            'seed', 'nut', 'pasta', 'noodle', 'soup', 'sauce', 'condiment', 'sweet', 'biscuit',
            'cookie', 'chocolate', 'groceries', 'plant-based'
        ];

        $hasEdibleTag = false;
        foreach ($edibleIndicators as $indicator) {
            if (str_contains($combinedText, $indicator)) {
                $hasEdibleTag = true;
                break;
            }
        }

        // If it has neither nutritional data nor any food/drink category marker nor ingredients
        if (!$hasMacros && !$hasEdibleTag && empty($ingredientsText)) {
            return [
                'is_edible' => false,
                'reason'    => "This item is not identified as an edible food or drink product. Please scan food items or beverages only."
            ];
        }

        return ['is_edible' => true, 'reason' => null];
    }

    private function clearFoodCache(): void
    {
        for ($p = 1; $p <= 20; $p++) {
            Cache::forget("foods_default_page_{$p}");
        }
        Cache::forget('foods_all');
        Cache::forget('admin_platform_stats');
        Cache::flush();
    }
}
