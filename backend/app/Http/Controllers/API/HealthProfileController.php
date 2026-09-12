<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\HealthCalculatorService;
use Illuminate\Http\Request;

class HealthProfileController extends Controller
{
    public function __construct(private HealthCalculatorService $calculator) {}

    public function show(Request $request)
    {
        $user = $request->user()->load('profile');
        $profile = $user->profile;

        $extra = [];
        if ($profile && $profile->bmi) {
            $extra['bmi_classification'] = $this->calculator->getBMIClassification($profile->bmi);
            $extra['ideal_weight_range'] = $profile->height_cm && $profile->gender
                ? $this->calculator->calculateIdealWeightRange($profile->height_cm, $profile->gender)
                : null;
            $extra['macros'] = $profile->calories_target
                ? $this->calculator->calculateMacros($profile->calories_target, $profile->goal, $profile->food_preference ?? 'standard')
                : null;
            $extra['water_intake_liters'] = $profile->weight_kg
                ? $this->calculator->calculateWaterIntake($profile->weight_kg)
                : null;
        }

        $date = $request->input('date', now()->toDateString());
        $todayLog = \App\Models\ProgressLog::where('user_id', $user->id)
            ->where('date', $date)
            ->first();
            
        $extra['calories_consumed'] = $todayLog ? $todayLog->calories_consumed : 0;
        $extra['streak'] = $user->getCurrentStreak();

        return response()->json([
            'user'    => $user,
            'profile' => $profile,
            'metrics' => $extra,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'age'             => 'required|integer|min:1|max:120',
            'gender'          => 'required|in:male,female,other',
            'height_cm'       => 'required|numeric|min:50|max:300',
            'weight_kg'       => 'required|numeric|min:10|max:500',
            'waist_cm'        => 'nullable|numeric',
            'goal'            => 'required|in:lose,gain,maintain',
            'activity_level'  => 'required|in:sedentary,light,moderate,active,very_active',
            'sleep_hours'     => 'nullable|numeric|min:0|max:24',
            'diseases'        => 'nullable|array',
            'allergies'       => 'nullable|array',
            'food_preference' => 'required|in:veg,non-veg,vegan,jain,keto,paleo',
        ]);

        $user    = $request->user();

        // Enforce premium for specialized diets
        if (in_array($validated['food_preference'], ['keto', 'paleo']) && !$user->isPremium()) {
            return response()->json([
                'error' => 'Keto and Paleo diets are Premium features. Upgrade to Premium to access specialized plans.',
                'premium_required' => true
            ], 403);
        }

        $profile = $user->profile ?? $user->profile()->create([]);

        // Calculate health metrics
        $bmi    = $this->calculator->calculateBMI($validated['weight_kg'], $validated['height_cm']);
        $bmr    = $this->calculator->calculateBMR(
            $validated['weight_kg'],
            $validated['height_cm'],
            $validated['age'],
            $validated['gender']
        );
        $tdee   = $this->calculator->calculateTDEE($bmr, $validated['activity_level']);
        $target = $this->calculator->calculateCaloriesTarget($tdee, $validated['goal']);

        $profile->update(array_merge($validated, [
            'bmi'             => $bmi,
            'bmr'             => $bmr,
            'tdee'            => $tdee,
            'calories_target' => $target,
        ]));

        return response()->json([
            'message' => 'Profile updated successfully',
            'profile' => $profile->fresh(),
            'metrics' => [
                'bmi'                => $bmi,
                'bmi_classification' => $this->calculator->getBMIClassification($bmi),
                'bmr'                => $bmr,
                'tdee'               => $tdee,
                'calories_target'    => $target,
                'macros'             => $this->calculator->calculateMacros($target, $validated['goal'], $validated['food_preference']),
                'water_intake_liters'=> $this->calculator->calculateWaterIntake($validated['weight_kg']),
                'ideal_weight_range' => $this->calculator->calculateIdealWeightRange(
                    $validated['height_cm'], $validated['gender']
                ),
                'calories_consumed'  => \App\Models\ProgressLog::where('user_id', $user->id)
                                          ->where('date', now()->toDateString())
                                          ->value('calories_consumed') ?? 0,
                'streak'             => $user->getCurrentStreak(),
            ],
        ]);
    }
}
