<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Food;
use App\Models\MealItem;
use App\Models\MealPlan;
use App\Models\ProgressLog;
use App\Services\HealthCalculatorService;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DietPlannerController extends Controller
{
    public function __construct(private HealthCalculatorService $calculator) {}

    public function generatePlan(Request $request)
    {
        $user    = $request->user();
        $profile = $user->profile;

        if (!$profile || !$profile->calories_target) {
            return response()->json(['message' => 'Please complete your health profile first.'], 422);
        }

        $date = $request->input('date', Carbon::today()->toDateString());

        // Handle adding a specific recipe or food instead of full generation
        if ($request->has('recipe_id') || $request->has('food_id')) {
            return $this->addSpecificItem($request, $user, $date);
        }

        $target  = $profile->calories_target;
        $macros  = $this->calculator->calculateMacros($target, $profile->goal, $profile->food_preference);
        $water   = $this->calculator->calculateWaterIntake($profile->weight_kg);

        $distribution = [
            'breakfast' => 0.25,
            'lunch'     => 0.35,
            'snack'     => 0.10,
            'dinner'    => 0.30,
        ];

        $foodQuery = Food::query();
        if ($profile->food_preference === 'veg') $foodQuery->where('is_veg', true);
        elseif ($profile->food_preference === 'vegan') $foodQuery->where('is_vegan', true);
        elseif ($profile->food_preference === 'jain') $foodQuery->where('is_jain', true);
        elseif ($profile->food_preference === 'keto') $foodQuery->where('carbs', '<', 10);
        elseif ($profile->food_preference === 'paleo') $foodQuery->whereNotIn('category', ['processed', 'junk', 'fast-food']);

        $diseases = $profile->diseases ?? [];
        if (in_array('diabetes', $diseases)) {
            $foodQuery->where(function ($q) {
                $q->whereNull('glycemic_index')->orWhere('glycemic_index', '<=', 55);
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
                $items = $this->assignFoodsToMeal($plan, clone $foodQuery, $mealType, $mealCalories);
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
        $plan = MealPlan::firstOrCreate(
            ['user_id' => $user->id, 'date' => $date],
            [
                'total_calories' => $user->profile->calories_target,
                'protein_target' => 0, 'carbs_target' => 0, 'fat_target' => 0, 'water_intake_liters' => 0
            ]
        );

        $mealType = $request->input('meal_type', 'breakfast');

        if ($request->has('recipe_id')) {
            $recipe = \App\Models\Recipe::findOrFail($request->recipe_id);
            $plan->mealItems()->create([
                'recipe_id' => $recipe->id,
                'meal_type' => $mealType,
                'quantity' => 1,
                'unit' => 'serving',
                'calories' => $recipe->calories,
                'protein' => $recipe->protein,
                'carbs' => $recipe->carbs,
                'fat' => $recipe->fat,
            ]);
        } else {
            $food = Food::findOrFail($request->food_id);
            $plan->mealItems()->create([
                'food_id' => $food->id,
                'meal_type' => $mealType,
                'quantity' => $request->input('quantity', $food->serving_size),
                'unit' => $food->serving_unit,
                'calories' => $food->calories,
                'protein' => $food->protein,
                'carbs' => $food->carbs,
                'fat' => $food->fat,
            ]);
        }

        return response()->json(['message' => 'Item added to your meal plan!']);
    }

    private function assignFoodsToMeal(MealPlan $plan, $foodQuery, string $mealType, float $targetCalories): array
    {
        $remaining    = $targetCalories;
        $shuffled     = clone $foodQuery;
        $foods        = $shuffled->inRandomOrder()->limit(3)->get();
        $mealItems    = [];

        foreach ($foods as $food) {
            if ($remaining <= 0) break;
            if ($food->calories <= 0) continue;

            // Calculate quantity to reach ~⅓ of meal calories per food item
            $targetPerFood = $remaining / max(1, $foods->count());
            $quantity      = round(($targetPerFood / $food->calories) * $food->serving_size, 1);
            
            // Intelligent clamping based on calorie density
            // High density (>4 cal/g like nuts/fats) needs smaller min clamp
            $density = $food->calories / $food->serving_size;
            $minClamp = $density > 4 ? 10 : 50; 
            $maxClamp = $density > 4 ? 50 : 350;

            $quantity = max($minClamp, min($quantity, $maxClamp)); 

            $factor   = $quantity / $food->serving_size;
            $calories = round($food->calories * $factor, 2);

            $mealItems[] = [
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
            ];

            $remaining -= $calories;
        }

        return $mealItems;
    }

    public function getMealPlan(Request $request)
    {
        $user = $request->user();
        $date = $request->input('date', Carbon::today()->toDateString());

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

        $profile = $user->profile;
        $targetCalories = $mealItem->calories;

        // Build food filter exactly like generatePlan
        $foodQuery = Food::query()->where('id', '!=', $mealItem->food_id);

        if ($profile && $profile->food_preference === 'veg') {
            $foodQuery->where('is_veg', true);
        } elseif ($profile && $profile->food_preference === 'vegan') {
            $foodQuery->where('is_vegan', true);
        } elseif ($profile && $profile->food_preference === 'jain') {
            $foodQuery->where('is_jain', true);
        }

        $diseases = $profile->diseases ?? [];
        if (in_array('diabetes', $diseases)) {
            $foodQuery->where(function ($q) {
                $q->whereNull('glycemic_index')->orWhere('glycemic_index', '<=', 55);
            });
        }

        $newFood = $foodQuery->inRandomOrder()->first();

        if (!$newFood) {
            return response()->json(['message' => 'No alternative foods found matching your preferences.'], 422);
        }

        // Exact calorie math equivalent
        $quantity = round(($targetCalories / max(1, $newFood->calories)) * $newFood->serving_size, 1);
        $factor   = $quantity / max(1, $newFood->serving_size);
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

        // Only allow toggling items on own plans
        $mealItem = MealItem::whereHas('mealPlan', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->findOrFail($id);

        // Toggle
        $mealItem->update(['is_consumed' => !$mealItem->is_consumed]);

        // Recalculate total consumed calories and macros for the plan's date from all checked items
        $planDate = $mealItem->mealPlan->date->toDateString();
        $totals = MealItem::whereHas('mealPlan', function ($q) use ($user, $planDate) {
            $q->where('user_id', $user->id)->where('date', $planDate);
        })->where('is_consumed', true)
          ->selectRaw('SUM(calories) as calories, SUM(protein) as protein, SUM(carbs) as carbs, SUM(fat) as fat')
          ->first();
  
        // Update (or create) the progress log for that specific date
        $log = ProgressLog::firstOrCreate(
            ['user_id' => $user->id, 'date' => $planDate],
            ['date' => $planDate]
        );

        $log->update([
            'calories_consumed' => round($totals->calories ?? 0, 2),
            'protein'           => round($totals->protein ?? 0, 2),
            'carbs'             => round($totals->carbs ?? 0, 2),
            'fat'               => round($totals->fat ?? 0, 2),
        ]);

        // ── Award +10 coins if ALL meal items for this day are now consumed ──
        $totalItems    = MealItem::whereHas('mealPlan', fn($q) => $q->where('user_id', $user->id)->where('date', $planDate))->count();
        $consumedItems = MealItem::whereHas('mealPlan', fn($q) => $q->where('user_id', $user->id)->where('date', $planDate))->where('is_consumed', true)->count();
        if ($totalItems > 0 && $consumedItems === $totalItems) {
            app(TokenService::class)->award($user, 'meals_consumed', null, ['date' => $planDate]);
        }
        // ───────────────────────────────────────────────────────────────
        return response()->json([
            'is_consumed'       => $mealItem->is_consumed,
            'calories_consumed' => round($totals->calories ?? 0, 2),
            'date'              => $planDate,
            'message'           => $mealItem->is_consumed ? 'Meal marked as consumed ✅' : 'Meal unmarked',
        ]);
    }
}
