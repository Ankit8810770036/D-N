<?php

namespace App\Jobs;

use App\Models\Food;
use App\Models\MealItem;
use App\Models\MealPlan;
use App\Models\User;
use App\Services\HealthCalculatorService;
use App\Services\NvidiaNimService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessWeeklyAiMealPlan implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 180; // 3 minutes timeout for LLM & heavy processing

    public function __construct(
        public User $user,
        public string $startDate
    ) {
        $this->onQueue('high');
    }

    /**
     * Execute the job asynchronously in background worker.
     */
    public function handle(HealthCalculatorService $calculator, NvidiaNimService $nvidia): void
    {
        $user    = $this->user->fresh(['profile']);
        $profile = $user->profile;

        if (!$profile || !$profile->calories_target) {
            Log::warning("ProcessWeeklyAiMealPlan: User {$user->id} does not have a completed health profile.");
            return;
        }

        $startDate = $this->startDate ?: Carbon::today()->toDateString();
        $targetCalories = (float) $profile->calories_target;
        $macros = $calculator->calculateMacros($targetCalories, $profile->goal, $profile->food_preference);
        $water  = $calculator->calculateWaterIntake((float) ($profile->weight_kg ?? 65));

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

        Log::info("ProcessWeeklyAiMealPlan: Generating 7-day AI weekly plan in background for User {$user->id} starting {$startDate}...");

        $weeklyData = $nvidia->generateWeeklyMealPlan($profileData, $startDate);

        DB::transaction(function () use ($user, $weeklyData, $targetCalories, $macros, $water) {
            // Batch pre-fetch foods
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

            foreach ($weeklyData['days'] as $dayData) {
                $date = $dayData['date'];

                MealPlan::where('user_id', $user->id)->where('date', $date)->delete();

                $plan = MealPlan::create([
                    'user_id'             => $user->id,
                    'date'                => $date,
                    'total_calories'      => $targetCalories,
                    'protein_target'      => $macros['protein_g'],
                    'carbs_target'        => $macros['carbs_g'],
                    'fat_target'          => $macros['fat_g'],
                    'water_intake_liters' => $water,
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
            }
        });

        Log::info("ProcessWeeklyAiMealPlan: Completed 7-day AI weekly plan successfully for User {$user->id}.");
    }
}
