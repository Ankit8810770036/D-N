<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Food;
use App\Models\MealItem;
use App\Models\MealPlan;
use App\Models\ProgressLog;
use App\Services\HealthCalculatorService;
use App\Services\NvidiaNimService;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DietPlannerController extends Controller
{
    public function __construct(
        private HealthCalculatorService $calculator,
        private NvidiaNimService $nvidia
    ) {}

    public function generatePlan(Request $request)
    {
        $user    = $request->user();
        $profile = $user->profile;

        if (!$profile || !$profile->calories_target) {
            return response()->json(['message' => 'Please complete your health profile first.'], 422);
        }

        $date  = $request->input('date', Carbon::today()->toDateString());
        $today = Carbon::today()->toDateString();
        $maxAllowed = Carbon::today()->addDays(30)->toDateString();

        if ($date < $today) {
            return response()->json([
                'message' => 'Meal plans cannot be generated for past dates. Please select today or an upcoming date.'
            ], 422);
        }

        if ($date > $maxAllowed) {
            return response()->json([
                'message' => 'Meal plans can only be generated up to 30 days in advance.'
            ], 422);
        }

        // Handle adding a specific recipe or food instead of full generation
        if ($request->has('recipe_id') || $request->has('food_id')) {
            return $this->addSpecificItem($request, $user, $date);
        }

        $target  = $profile->calories_target;
        $macros  = $this->calculator->calculateMacros($target, $profile->goal, $profile->food_preference);
        $water   = $this->calculator->calculateWaterIntake((float) ($profile->weight_kg ?? 65));

        $distribution = [
            'breakfast' => 0.25,
            'lunch'     => 0.35,
            'snack'     => 0.10,
            'dinner'    => 0.30,
        ];

        // Scope to global system foods PLUS the current user's custom foods
        $foodQuery = Food::query()->where(function ($q) use ($user) {
            $q->whereNull('user_id')->orWhere('user_id', $user->id);
        });

        $pref = strtolower(trim($profile->food_preference ?? ''));
        if ($pref === 'veg' || $pref === 'vegetarian') $foodQuery->where('is_veg', true);
        elseif ($pref === 'vegan') $foodQuery->where('is_vegan', true);
        elseif ($pref === 'jain') $foodQuery->where('is_jain', true);
        elseif ($pref === 'keto') $foodQuery->where('carbs', '<', 10);
        elseif ($pref === 'paleo') $foodQuery->whereNotIn('category', ['processed', 'junk', 'fast-food']);

        $diseases = $profile->diseases ?? [];
        if (in_array('diabetes', $diseases)) {
            $foodQuery->where(function ($q) {
                $q->whereNull('glycemic_index')->orWhere('glycemic_index', '<=', 55);
            });
        }
        if (in_array('hypertension', $diseases)) {
            $foodQuery->where('is_low_sodium', true);
        }
        if (in_array('thyroid', $diseases)) {
            $foodQuery->where('is_thyroid_friendly', true);
        }
        if (in_array('heart_disease', $diseases)) {
            $foodQuery->where('is_heart_friendly', true);
        }
        if (in_array('pcod', $diseases)) {
            $foodQuery->where('is_pcod_friendly', true);
        }

        $allergies = $profile->allergies ?? [];
        foreach ($allergies as $allergy) {
            $foodQuery->where(function ($q) use ($allergy) {
                $q->whereNull('allergens')->orWhereJsonDoesntContain('allergens', $allergy);
            });
        }

        if (!$foodQuery->exists()) {
            return response()->json(['message' => 'No foods found matching your dietary preferences.'], 422);
        }

        $plan = DB::transaction(function () use ($user, $date, $target, $macros, $water, $distribution, $foodQuery) {
            MealPlan::where('user_id', $user->id)->where('date', $date)->delete();

            $plan = MealPlan::create([
                'user_id'           => $user->id,
                'date'              => $date,
                'total_calories'    => $target,
                'protein_target'    => $macros['protein_g'],
                'carbs_target'      => $macros['carbs_g'],
                'fat_target'        => $macros['fat_g'],
                'water_intake_liters'=> $water,
            ]);

            $allMealItems = [];
            foreach ($distribution as $mealType => $pct) {
                $mealCalories = $target * $pct;
                $items = $this->assignFoodsToMeal($plan, clone $foodQuery, $mealType, $mealCalories, $user->id);
                $allMealItems = array_merge($allMealItems, $items);
            }

            if (!empty($allMealItems)) MealItem::insert($allMealItems);

            return $plan;
        });

        return response()->json([
            'message'   => 'Meal plan generated successfully',
            'plan'      => $plan->load('mealItems.food', 'mealItems.recipe'),
            'summary'   => [
                'calories_target'     => $target,
                'protein_g'           => $macros['protein_g'],
                'carbs_g'             => $macros['carbs_g'],
                'fat_g'               => $macros['fat_g'],
                'water_intake_liters' => $water,
            ],
        ]);
    }

    private function addSpecificItem(Request $request, $user, $date)
    {
        $request->validate([
            'meal_type' => 'nullable|string|in:breakfast,lunch,snack,dinner',
            'quantity'  => 'nullable|numeric|min:0.1|max:5000',
            'recipe_id' => 'nullable|integer|exists:recipes,id',
            'food_id'   => 'nullable|integer|exists:foods,id',
        ]);

        $today = Carbon::today()->toDateString();
        if ($date < $today) {
            return response()->json([
                'message' => 'Items cannot be added to past meal plans.'
            ], 422);
        }

        $plan = MealPlan::firstOrCreate(
            ['user_id' => $user->id, 'date' => $date],
            [
                'total_calories' => $user->profile?->calories_target ?? 2000,
                'protein_target' => 0, 'carbs_target' => 0, 'fat_target' => 0, 'water_intake_liters' => 0
            ]
        );

        $mealType = $request->input('meal_type', 'breakfast');

        if ($request->has('recipe_id')) {
            $recipe = \App\Models\Recipe::where(function ($q) use ($user) {
                $q->whereNull('user_id')->orWhere('user_id', $user->id);
            })->findOrFail($request->recipe_id);

            // Security & Authorization: verify premium access
            if ($recipe->is_premium && !$user->isPremium()) {
                return response()->json([
                    'message'          => 'This is a Premium recipe. Upgrade to Premium to add it to your plan.',
                    'premium_required' => true,
                ], 403);
            }

            $plan->mealItems()->create([
                'recipe_id' => $recipe->id,
                'meal_type' => $mealType,
                'quantity'  => 1,
                'unit'      => 'serving',
                'calories'  => $recipe->calories,
                'protein'   => $recipe->protein,
                'carbs'     => $recipe->carbs,
                'fat'       => $recipe->fat,
            ]);
        } else {
            // Ensure food is either global or belongs to the current user
            $food = Food::where(function ($q) use ($user) {
                $q->whereNull('user_id')->orWhere('user_id', $user->id);
            })->findOrFail($request->food_id);

            $quantity = $request->input('quantity', $food->serving_size);
            $factor   = $food->serving_size > 0 ? ($quantity / $food->serving_size) : 1;

            $plan->mealItems()->create([
                'food_id'   => $food->id,
                'meal_type' => $mealType,
                'quantity'  => $quantity,
                'unit'      => $food->serving_unit,
                'calories'  => round($food->calories * $factor, 2),
                'protein'   => round($food->protein * $factor, 2),
                'carbs'     => round($food->carbs * $factor, 2),
                'fat'       => round($food->fat * $factor, 2),
            ]);
        }

        return response()->json(['message' => 'Item added to your meal plan!']);
    }

    /**
     * Generate an AI-powered 7-day weekly meal plan using NutriBot.
     */
    public function generateAiWeeklyPlan(Request $request)
    {
        $user = $request->user();
        $profile = $user->profile;

        if (!$profile || !$profile->calories_target) {
            return response()->json(['message' => 'Please complete your health profile first.'], 422);
        }

        $startDate = $request->input('start_date', Carbon::today()->toDateString());
        $today     = Carbon::today()->toDateString();
        $maxStart  = Carbon::today()->addDays(30)->toDateString();

        if ($startDate < $today) {
            return response()->json([
                'message' => 'Weekly meal plans can only start from today or an upcoming date.'
            ], 422);
        }

        if ($startDate > $maxStart) {
            return response()->json([
                'message' => 'Weekly meal plans can only be generated up to 30 days in advance.'
            ], 422);
        }

        // If client requests async execution or background queue offloading
        if ($request->boolean('async')) {
            \App\Jobs\ProcessWeeklyAiMealPlan::dispatch($user, $startDate)->onQueue('high');

            return response()->json([
                'message'    => '7-Day AI Weekly Meal Plan generation queued in the background! 🥗',
                'status'     => 'queued',
                'start_date' => $startDate,
            ], 202);
        }

        $targetCalories = (float) $profile->calories_target;
        $macros = $this->calculator->calculateMacros($targetCalories, $profile->goal, $profile->food_preference);
        $water = $this->calculator->calculateWaterIntake((float) ($profile->weight_kg ?? 65));

        $profileData = [
            'calories_target'  => $targetCalories,
            'goal'             => $profile->goal,
            'food_preference'  => $profile->food_preference,
            'weight_kg'        => $profile->weight_kg,
            'height_cm'        => $profile->height_cm,
            'age'              => $profile->age,
            'gender'           => $profile->gender,
            'diseases'         => $profile->diseases ?? [],
            'allergies'        => $profile->allergies ?? [],
        ];

        $weeklyData = $this->nvidia->generateWeeklyMealPlan($profileData, $startDate);

        $createdPlans = DB::transaction(function () use ($user, $weeklyData, $targetCalories, $macros, $water) {
            // ── Batch Pre-fetch Foods to eliminate N+1 queries (from ~80 queries down to 1) ──
            $allFoodNames = [];
            foreach ($weeklyData['days'] as $dayData) {
                if (isset($dayData['meals']) && is_array($dayData['meals'])) {
                    foreach ($dayData['meals'] as $mealType => $items) {
                        if (!is_array($items)) continue;
                        foreach ($items as $item) {
                            $fName = trim($item['food_name'] ?? ($item['name'] ?? 'Healthy Meal'));
                            if ($fName) $allFoodNames[$fName] = true;
                        }
                    }
                }
            }

            $foodNamesList = array_keys($allFoodNames);
            $existingFoods = Food::where(function ($q) use ($user) {
                $q->whereNull('user_id')->orWhere('user_id', $user->id);
            })->whereIn('name', $foodNamesList)->get()->keyBy(fn($f) => strtolower(trim($f->name)));

            $plansList = [];

            foreach ($weeklyData['days'] as $dayData) {
                $date = $dayData['date'];

                MealPlan::where('user_id', $user->id)->where('date', $date)->delete();

                $plan = MealPlan::create([
                    'user_id'            => $user->id,
                    'date'               => $date,
                    'total_calories'     => $targetCalories,
                    'protein_target'     => $macros['protein_g'],
                    'carbs_target'       => $macros['carbs_g'],
                    'fat_target'         => $macros['fat_g'],
                    'water_intake_liters'=> $water,
                ]);

                $mealItems = [];

                if (isset($dayData['meals']) && is_array($dayData['meals'])) {
                    foreach ($dayData['meals'] as $mealType => $items) {
                        if (!is_array($items)) continue;

                        foreach ($items as $item) {
                            $foodName = trim($item['food_name'] ?? ($item['name'] ?? 'Healthy Meal'));
                            $foodKey  = strtolower($foodName);

                            $food = $existingFoods->get($foodKey);

                            if (!$food) {
                                $food = Food::create([
                                    'name'         => $item['name'] ?? $foodName,
                                    'category'     => $mealType === 'snack' ? 'Snacks' : ($mealType === 'breakfast' ? 'Grains' : 'Legumes'),
                                    'calories'     => max(10, (float)($item['calories'] ?? 100)),
                                    'protein'      => (float)($item['protein'] ?? 5),
                                    'carbs'        => (float)($item['carbs'] ?? 15),
                                    'fat'          => (float)($item['fat'] ?? 3),
                                    'serving_size' => (float)($item['quantity'] ?? 100),
                                    'serving_unit' => $item['unit'] ?? 'g',
                                    'is_veg'       => true,
                                ]);
                                $existingFoods->put($foodKey, $food);
                            }

                            $qty = (float) ($item['quantity'] ?? $food->serving_size);
                            $factor = $food->serving_size > 0 ? ($qty / $food->serving_size) : 1;

                            $mealItems[] = [
                                'meal_plan_id' => $plan->id,
                                'food_id'      => $food->id,
                                'meal_type'    => $mealType,
                                'quantity'     => $qty,
                                'unit'         => $item['unit'] ?? $food->serving_unit,
                                'calories'     => (float) ($item['calories'] ?? round($food->calories * $factor, 2)),
                                'protein'      => (float) ($item['protein'] ?? round($food->protein * $factor, 2)),
                                'carbs'        => (float) ($item['carbs'] ?? round($food->carbs * $factor, 2)),
                                'fat'          => (float) ($item['fat'] ?? round($food->fat * $factor, 2)),
                                'created_at'   => now(),
                                'updated_at'   => now(),
                            ];
                        }
                    }
                }

                if (!empty($mealItems)) {
                    MealItem::insert($mealItems);
                }

                $plansList[] = $plan->load('mealItems.food');
            }

            return $plansList;
        });

        return response()->json([
            'message'     => '7-Day AI Weekly Meal Plan generated successfully! 🥗',
            'start_date'  => $startDate,
            'days_count'  => count($createdPlans),
            'plans'       => $createdPlans,
            'summary'     => [
                'calories_target'     => $targetCalories,
                'protein_g'           => $macros['protein_g'],
                'carbs_g'             => $macros['carbs_g'],
                'fat_g'               => $macros['fat_g'],
                'water_intake_liters' => $water,
            ],
        ]);
    }

    private function getSlotFoodsQuery($baseQuery, string $mealType)
    {
        $query = clone $baseQuery;

        switch ($mealType) {
            case 'breakfast':
                $query->where(function ($q) {
                    $q->whereIn('name', [
                        'Poha (Flattened Rice)', 'Upma (Semolina/Rava)', 'Idli (Steamed)', 'Plain Dosa',
                        'Moong Dal Chilla', 'Besan Chilla', 'Vegetable Dalia (Broken Wheat)', 'Masala Oats',
                        'Oats', 'Whole Wheat Bread', 'Boiled Eggs (2 Eggs)', 'Egg Bhurji (Indian Scramble)',
                        'Masala Chai (Low Sugar)', 'Cow Milk (Low Fat)', 'Curd (Dahi)', 'Papaya (Papeeta)',
                        'Apple (Seb)', 'Banana (Kela)', 'Guava (Amrood)', 'Pomegranate (Anar)'
                    ])->orWhere('category', 'Fruits');
                })->whereNotIn('name', [
                    'Homestyle Chicken Curry', 'Mutton Curry (Lean)', 'Rohu / Katla Fish Curry', 'Prawns Masala',
                    'Rajma (Kidney Beans)', 'Chhole (Chickpeas Curry)', 'Yellow Moong Dal', 'Toor Dal (Arhar Dal)'
                ]);
                break;

            case 'snack':
                $query->where(function ($q) {
                    $q->whereIn('name', [
                        'Roasted Makhana (Fox Nuts)', 'Roasted Chana (Bhuna Chana)', 'Sprouts Chaat',
                        'Khaman Dhokla (Steamed)', 'Roasted Peanuts (Moongfali)', 'Whole Wheat Khakhra',
                        'Murmura (Puffed Rice Bhel)', 'Almonds (Badam)', 'Walnuts (Akhrot)', 'Cashews (Kaju)',
                        'Chia Seeds (Sabja/Chia)', 'Flax Seeds (Alsi)', 'Pumpkin Seeds', 'Kishmish (Raisins)',
                        'Chaas (Spiced Buttermilk)', 'Tulsi Green Tea', 'Coconut Water (Nariyal Pani)',
                        'Namkeen Sattu Drink', 'Lemon Water (Nimbu Pani)', 'Papaya (Papeeta)', 'Guava (Amrood)',
                        'Pomegranate (Anar)', 'Apple (Seb)', 'Mosambi (Sweet Lime)', 'Orange (Santra)',
                        'Watermelon (Tarbooz)', 'Jamun (Blackberry)', 'Cucumber (Kheera Salad)'
                    ]);
                });
                break;

            case 'lunch':
            case 'dinner':
                $query->where(function ($q) {
                    $q->whereIn('category', ['Grains', 'Legumes', 'Vegetables', 'Dairy', 'Poultry', 'Seafood', 'Meat'])
                      ->whereNotIn('category', ['Snacks', 'Beverages']);
                })->whereNotIn('name', [
                    'Masala Chai (Low Sugar)', 'Tulsi Green Tea', 'Coconut Water (Nariyal Pani)',
                    'Roasted Makhana (Fox Nuts)', 'Whole Wheat Khakhra', 'Murmura (Puffed Rice Bhel)'
                ]);
                break;
        }

        return $query;
    }

    private function assignFoodsToMeal(MealPlan $plan, $foodQuery, string $mealType, float $targetCalories, int $userId): array
    {
        $slotQuery = $this->getSlotFoodsQuery($foodQuery, $mealType);

        if ($mealType === 'lunch' || $mealType === 'dinner') {
            // Authentic Indian Thali: 1 Indian Grain/Roti/Rice (45%) + 1 Dal/Protein Curry (35%) + 1 Sabzi/Salad (20%)
            $grain   = (clone $slotQuery)->whereIn('category', ['Grains'])->inRandomOrder()->first();
            $protein = (clone $slotQuery)->whereIn('category', ['Legumes', 'Poultry', 'Seafood', 'Meat'])->orWhereIn('name', ['Paneer (Raw / Grilled)', 'Paneer Bhurji', 'Palak Paneer', 'Curd (Dahi)', 'Cucumber Raita'])->inRandomOrder()->first();
            $veggie  = (clone $slotQuery)->whereIn('category', ['Vegetables'])->inRandomOrder()->first();

            $rawFoods = collect([
                ['food' => $grain,   'ratio' => 0.45, 'is_staple' => true],
                ['food' => $protein, 'ratio' => 0.35, 'is_staple' => false],
                ['food' => $veggie,  'ratio' => 0.20, 'is_staple' => false],
            ])->filter(fn($f) => !empty($f['food']))->values();

            if ($rawFoods->isEmpty()) {
                $rawFoods = (clone $slotQuery)->inRandomOrder()->limit(3)->get()->map(fn($f, $i) => [
                    'food' => $f,
                    'ratio' => 1 / 3,
                    'is_staple' => $i === 0
                ]);
            }
        } elseif ($mealType === 'breakfast') {
            // Indian Breakfast: 1 Breakfast Main (55%) + 1 Beverage/Dahi (25%) + 1 Fruit (20%)
            $main    = (clone $slotQuery)->whereIn('category', ['Grains', 'Poultry'])->inRandomOrder()->first();
            $side    = (clone $slotQuery)->whereIn('category', ['Dairy', 'Beverages'])->inRandomOrder()->first();
            $fruit   = (clone $slotQuery)->whereIn('category', ['Fruits'])->inRandomOrder()->first();

            $rawFoods = collect([
                ['food' => $main,  'ratio' => 0.55, 'is_staple' => true],
                ['food' => $side,  'ratio' => 0.25, 'is_staple' => false],
                ['food' => $fruit, 'ratio' => 0.20, 'is_staple' => false],
            ])->filter(fn($f) => !empty($f['food']))->values();

            if ($rawFoods->isEmpty()) {
                $rawFoods = (clone $slotQuery)->inRandomOrder()->limit(2)->get()->map(fn($f, $i) => [
                    'food' => $f,
                    'ratio' => 0.5,
                    'is_staple' => $i === 0
                ]);
            }
        } else {
            // Indian Snack: 1 Roasted/Sprouted Snack (65%) + 1 Beverage or Fruit (35%)
            $snack1 = (clone $slotQuery)->whereIn('category', ['Snacks', 'Nuts', 'Seeds'])->inRandomOrder()->first();
            $snack2 = (clone $slotQuery)->whereIn('category', ['Fruits', 'Beverages', 'Vegetables'])->inRandomOrder()->first();

            $rawFoods = collect([
                ['food' => $snack1, 'ratio' => 0.65, 'is_staple' => true],
                ['food' => $snack2, 'ratio' => 0.35, 'is_staple' => false],
            ])->filter(fn($f) => !empty($f['food']))->values();

            if ($rawFoods->isEmpty()) {
                $rawFoods = (clone $slotQuery)->inRandomOrder()->limit(2)->get()->map(fn($f, $i) => [
                    'food' => $f,
                    'ratio' => 0.5,
                    'is_staple' => $i === 0
                ]);
            }
        }

        if ($rawFoods->isEmpty()) {
            $rawFoods = (clone $foodQuery)->inRandomOrder()->limit(2)->get()->map(fn($f, $i) => [
                'food' => $f,
                'ratio' => 0.5,
                'is_staple' => $i === 0
            ]);
        }

        // Normalize ratios so they sum to 1.0
        $totalRatio = $rawFoods->sum('ratio') ?: 1;
        $items = [];
        $totalMealAllocatedCals = 0;

        foreach ($rawFoods as $idx => $entry) {
            $food = $entry['food'];
            $normalizedRatio = $entry['ratio'] / $totalRatio;
            $targetForThisFood = $targetCalories * $normalizedRatio;

            if ($food->calories <= 0) continue;

            $quantity = round(($targetForThisFood / $food->calories) * $food->serving_size, 1);
            $density  = $food->calories / max(1, $food->serving_size);

            // Realistic portion limits based on food type
            if ($density > 4) { // high density (nuts, seeds, oil)
                $quantity = max(10, min($quantity, 45));
            } elseif ($density < 0.4) { // ultra low density (salads, chai, cucumber, spinach)
                $quantity = max(50, min($quantity, 250));
            } else { // standard grains, dals, chilla, paneer
                $quantity = max(30, min($quantity, 350));
            }

            $factor   = $quantity / max(1, $food->serving_size);
            $calories = round($food->calories * $factor, 2);
            $totalMealAllocatedCals += $calories;

            $items[] = [
                'meal_plan_id' => $plan->id,
                'food_id'      => $food->id,
                'meal_type'    => $mealType,
                'quantity'     => $quantity,
                'unit'         => $food->serving_unit,
                'calories'     => $calories,
                'protein'      => round($food->protein * $factor, 2),
                'carbs'        => round($food->carbs   * $factor, 2),
                'fat'          => round($food->fat     * $factor, 2),
                'created_at'   => now(),
                'updated_at'   => now(),
                'is_staple'    => $entry['is_staple'] ?? ($idx === 0),
                'density'      => $density,
                'serving_size' => $food->serving_size,
                'base_cals'    => $food->calories,
                'food_obj'     => $food,
            ];
        }

        // Calorie Balancing pass: Adjust the staple carb/grain/main food so the meal's sum matches the exact target
        $diff = $targetCalories - $totalMealAllocatedCals;
        if (abs($diff) >= 5 && !empty($items)) {
            $stapleIdx = 0;
            foreach ($items as $k => $it) {
                if (!empty($it['is_staple'])) {
                    $stapleIdx = $k;
                    break;
                }
            }

            $foodObj = $items[$stapleIdx]['food_obj'];
            $addedQty = ($diff / max(1, $foodObj->calories)) * $foodObj->serving_size;
            $newQty = max(20, round($items[$stapleIdx]['quantity'] + $addedQty, 1));
            $newFactor = $newQty / max(1, $foodObj->serving_size);

            $items[$stapleIdx]['quantity'] = $newQty;
            $items[$stapleIdx]['calories'] = round($foodObj->calories * $newFactor, 2);
            $items[$stapleIdx]['protein']  = round($foodObj->protein * $newFactor, 2);
            $items[$stapleIdx]['carbs']    = round($foodObj->carbs * $newFactor, 2);
            $items[$stapleIdx]['fat']      = round($foodObj->fat * $newFactor, 2);
        }

        return array_map(function ($item) {
            unset($item['is_staple'], $item['density'], $item['serving_size'], $item['base_cals'], $item['food_obj']);
            return $item;
        }, $items);
    }

    public function getMealPlan(Request $request)
    {
        $user = $request->user();
        $date = $request->input('date', Carbon::today()->toDateString());

        $minAllowed = Carbon::today()->subDays(30)->toDateString();
        $maxAllowed = Carbon::today()->addDays(30)->toDateString();

        if ($date < $minAllowed || $date > $maxAllowed) {
            return response()->json([
                'message' => 'Meal plans can only be viewed from the past 30 days up to 30 days in advance.'
            ], 422);
        }

        $plan = MealPlan::where('user_id', $user->id)
            ->where('date', $date)
            ->with(['mealItems.food', 'mealItems.recipe'])
            ->first();

        if (!$plan) {
            return response()->json(['message' => 'No meal plan found for this date.'], 404);
        }

        // Group meal items by type
        $grouped = $plan->mealItems->groupBy('meal_type');

        return response()->json([
            'plan'      => $plan,
            'meals'     => $grouped,
            'summary'   => [
                'calories_target'     => $plan->total_calories,
                'protein_g'           => $plan->protein_target,
                'carbs_g'             => $plan->carbs_target,
                'fat_g'               => $plan->fat_target,
                'water_intake_liters' => $plan->water_intake_liters,
            ],
        ]);
    }

    public function getGroceryList(Request $request)
    {
        $user  = $request->user();
        $todayStr = $request->input('date', Carbon::today()->toDateString());
        
        $today = Carbon::parse($todayStr)->toDateString();
        $end   = Carbon::parse($todayStr)->addDays(7)->toDateString();

        // Only upcoming plans (today onward), strictly for this user
        $plans = MealPlan::where('user_id', $user->id)
            ->whereBetween('date', [$today, $end])
            ->orderBy('date')
            ->with(['mealItems.food', 'mealItems.recipe.ingredients.food'])
            ->get();

        $groceries   = [];
        $planDates   = $plans->pluck('date')->map(fn($d) => Carbon::parse($d)->format('M j'))->values()->toArray();

        foreach ($plans as $plan) {
            foreach ($plan->mealItems as $item) {
                if ($item->recipe) {
                    // Recipe-based items: expand to individual ingredients
                    foreach ($item->recipe->ingredients as $ri) {
                        $foodId = $ri->food_id;
                        if (!isset($groceries[$foodId])) {
                            $groceries[$foodId] = [
                                'name'           => $ri->food->name ?? 'Unknown',
                                'category'       => $ri->food->category ?? 'other',
                                'unit'           => $ri->unit,
                                'total_quantity' => 0,
                                'is_bought'      => true,
                                'item_ids'       => [],
                            ];
                        }
                        $groceries[$foodId]['total_quantity'] += (float) $ri->quantity;
                        $groceries[$foodId]['is_bought']       = $groceries[$foodId]['is_bought'] && (bool) $item->is_bought;
                        $groceries[$foodId]['item_ids'][]      = $item->id;
                    }
                } elseif ($item->food_id) {
                    // Direct food items
                    $foodId = $item->food_id;
                    if (!isset($groceries[$foodId])) {
                        $groceries[$foodId] = [
                            'name'           => $item->food->name ?? 'Unknown',
                            'category'       => $item->food->category ?? 'other',
                            'unit'           => $item->unit,
                            'total_quantity' => 0,
                            'is_bought'      => true,
                            'item_ids'       => [],
                        ];
                    }
                    $groceries[$foodId]['total_quantity'] += (float) $item->quantity;
                    $groceries[$foodId]['is_bought']       = $groceries[$foodId]['is_bought'] && (bool) $item->is_bought;
                    $groceries[$foodId]['item_ids'][]      = $item->id;
                }
            }
        }

        // Sort alphabetically by name
        $list = array_values($groceries);
        usort($list, fn($a, $b) => strcmp($a['name'], $b['name']));

        foreach ($list as &$val) {
            $val['total_quantity'] = round($val['total_quantity'], 1);
        }
        unset($val);

        return response()->json([
            'days_found'  => $plans->count(),
            'plan_dates'  => $planDates,      // e.g. ["May 23", "May 24", "May 26"]
            'date_range'  => $plans->count() > 0
                ? Carbon::parse($plans->first()->date)->format('M j') . ' – ' . Carbon::parse($plans->last()->date)->format('M j, Y')
                : null,
            'groceries'   => $list,
        ]);
    }

    public function toggleGroceryItem(Request $request)
    {
        $validated = $request->validate([
            'item_ids' => 'required|array',
            'is_bought' => 'required|boolean',
        ]);

        $user = $request->user();

        MealItem::whereIn('id', $validated['item_ids'])
            ->whereHas('mealPlan', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->update(['is_bought' => $validated['is_bought']]);

        return response()->json(['message' => 'Shopping list updated!']);
    }

    public function swapMealItem(Request $request, $id)
    {
        $user = $request->user();
        $mealItem = MealItem::with('mealPlan')->find($id);

        if (!$mealItem || $mealItem->mealPlan->user_id !== $user->id) {
            return response()->json(['message' => 'Meal item not found.'], 404);
        }

        $today = Carbon::today()->toDateString();
        if ($mealItem->mealPlan->date < $today) {
            return response()->json(['message' => 'Items from past meal plans cannot be modified.'], 422);
        }

        $profile = $user->profile;
        $targetCalories = $mealItem->calories;

        // Build food filter exactly like generatePlan — global foods + user's custom foods
        $foodQuery = Food::query()
            ->where('id', '!=', $mealItem->food_id)
            ->where(function ($q) use ($user) {
                $q->whereNull('user_id')->orWhere('user_id', $user->id);
            });

        $pref = $profile ? strtolower(trim($profile->food_preference ?? '')) : '';
        if ($pref === 'veg' || $pref === 'vegetarian') {
            $foodQuery->where('is_veg', true);
        } elseif ($pref === 'vegan') {
            $foodQuery->where('is_vegan', true);
        } elseif ($pref === 'jain') {
            $foodQuery->where('is_jain', true);
        }

        $diseases = $profile->diseases ?? [];
        if (in_array('diabetes', $diseases)) {
            $foodQuery->where(function ($q) {
                $q->whereNull('glycemic_index')->orWhere('glycemic_index', '<=', 55);
            });
        }
        if (in_array('hypertension', $diseases)) {
            $foodQuery->where('is_low_sodium', true);
        }
        if (in_array('thyroid', $diseases)) {
            $foodQuery->where('is_thyroid_friendly', true);
        }
        if (in_array('heart_disease', $diseases)) {
            $foodQuery->where('is_heart_friendly', true);
        }
        if (in_array('pcod', $diseases)) {
            $foodQuery->where('is_pcod_friendly', true);
        }

        $allergies = $profile->allergies ?? [];
        foreach ($allergies as $allergy) {
            $foodQuery->where(function ($q) use ($allergy) {
                $q->whereNull('allergens')->orWhereJsonDoesntContain('allergens', $allergy);
            });
        }

        $slotQuery = $this->getSlotFoodsQuery($foodQuery, $mealItem->meal_type);
        $newFood   = $slotQuery->inRandomOrder()->first();

        if (!$newFood) {
            $newFood = $foodQuery->inRandomOrder()->first();
        }

        if (!$newFood) {
            return response()->json(['message' => 'No alternative foods found matching your preferences.'], 422);
        }

        // Calorie math with healthy portion clamping
        $quantity = round(($targetCalories / max(1, $newFood->calories)) * $newFood->serving_size, 1);
        $density  = $newFood->calories / max(1, $newFood->serving_size);
        $minClamp = $density > 4 ? 10 : 30;
        $maxClamp = $density > 4 ? 40 : 300;
        $quantity = max($minClamp, min($quantity, $maxClamp));

        $factor      = $quantity / max(1, $newFood->serving_size);
        $newCalories = round($newFood->calories * $factor, 2);

        $mealItem->update([
            'food_id'  => $newFood->id,
            'quantity' => $quantity,
            'unit'     => $newFood->serving_unit,
            'calories' => $newCalories,
            'protein'  => round($newFood->protein * $factor, 2),
            'carbs'    => round($newFood->carbs * $factor, 2),
            'fat'      => round($newFood->fat * $factor, 2),
        ]);

        return response()->json(['message' => 'Swapped successfully.']);
    }

    public function toggleConsumed(Request $request, int $id)
    {
        $user = $request->user();

        // Only allow toggling items on own plans — eager load mealPlan to prevent lazy loading N+1
        $mealItem = MealItem::with('mealPlan')->whereHas('mealPlan', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        // Toggle status
        $mealItem->update(['is_consumed' => !$mealItem->is_consumed]);

        // Recalculate total consumed calories, macros, and completion in 1 single fast query
        $planDate = $mealItem->mealPlan->date->toDateString();
        $stats = MealItem::whereHas('mealPlan', function ($q) use ($user, $planDate) {
            $q->where('user_id', $user->id)->where('date', $planDate);
        })->selectRaw('
            SUM(CASE WHEN is_consumed = 1 THEN calories ELSE 0 END) as calories,
            SUM(CASE WHEN is_consumed = 1 THEN protein ELSE 0 END) as protein,
            SUM(CASE WHEN is_consumed = 1 THEN carbs ELSE 0 END) as carbs,
            SUM(CASE WHEN is_consumed = 1 THEN fat ELSE 0 END) as fat,
            COUNT(*) as total_items,
            SUM(CASE WHEN is_consumed = 1 THEN 1 ELSE 0 END) as consumed_items
        ')->first();

        $cals          = round((float) ($stats->calories ?? 0), 2);
        $prot          = round((float) ($stats->protein ?? 0), 2);
        $carbs         = round((float) ($stats->carbs ?? 0), 2);
        $fat           = round((float) ($stats->fat ?? 0), 2);
        $totalItems    = (int) ($stats->total_items ?? 0);
        $consumedItems = (int) ($stats->consumed_items ?? 0);

        // Update (or create) the progress log for that specific date
        $log = ProgressLog::firstOrCreate(
            ['user_id' => $user->id, 'date' => $planDate],
            ['date' => $planDate]
        );

        $log->update([
            'calories_consumed' => $cals,
            'protein'           => $prot,
            'carbs'             => $carbs,
            'fat'               => $fat,
        ]);

        // ── Award +10 coins if ALL meal items for this day are now consumed ──
        if ($totalItems > 0 && $consumedItems === $totalItems) {
            app(TokenService::class)->award($user, 'meals_consumed', null, ['date' => $planDate]);
        }
        // ───────────────────────────────────────────────────────────────
        return response()->json([
            'is_consumed'       => $mealItem->is_consumed,
            'calories_consumed' => $cals,
            'date'              => $planDate,
            'message'           => $mealItem->is_consumed ? 'Meal marked as consumed ✅' : 'Meal unmarked',
        ]);
    }
}
