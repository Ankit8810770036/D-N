<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\NvidiaNimService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ChatbotController extends Controller
{
    public function __construct(private NvidiaNimService $nvidia) {}

    public function ask(Request $request)
    {
        $user = $request->user();
        
        $isPremium = $user->isPremium();
        $isAdmin   = $user->isAdmin();
        $limit     = $isPremium ? 20 : 5;
        $remainingChats = null;

        // Admins have unlimited access; all other users have their tier limits enforced
        if (!$isAdmin) {
            $date = now()->format('Y-m-d');
            $cacheKey = "user_ai_chats_{$user->id}_{$date}";
            $chatCount = (int) Cache::get($cacheKey, 0);

            if ($chatCount >= $limit) {
                $errorMsg = $isPremium
                    ? "Daily Premium AI query limit reached ({$limit}/{$limit}). Your quota resets at midnight."
                    : "Daily free AI chat limit reached ({$limit}/{$limit}). Upgrade to Premium for 20 queries daily!";

                return response()->json([
                    'error'           => $errorMsg,
                    'limit_reached'   => true,
                    'remaining_chats' => 0,
                    'is_premium'      => $isPremium,
                    'daily_limit'     => $limit,
                ], 403);
            }
            
            $newCount = $chatCount + 1;
            Cache::put($cacheKey, $newCount, now()->addDay());
            $remainingChats = max(0, $limit - $newCount);
        }

        $request->validate([
            'message'   => 'nullable|string|max:1000',
            'image'     => 'nullable|string',
            'mime_type' => 'nullable|string'
        ]);

        $userMessage = $request->input('message');
        if (empty($userMessage) && !$request->filled('image')) {
            return response()->json(['error' => 'Please provide a message or an image.'], 400);
        }

        $parts = [];
        if (!empty($userMessage)) {
            $parts[] = ['text' => $userMessage];
        } else {
            $parts[] = ['text' => 'Please estimate the calories and nutritional information for the food in this image.'];
        }

        if ($request->filled('image') && $request->filled('mime_type')) {
            $parts[] = [
                'inline_data' => [
                    'mime_type' => $request->input('mime_type'),
                    'data'      => $request->input('image')
                ]
            ];
        }

        // --- Build Personalized Context ---
        $profile = $user->profile;
        $contextPrompt = "You are MetriBot, an expert Clinical Dietitian & Nutrition AI for the Metrivita platform. NEVER mention external AI providers or model names. ";
        
        $contextPrompt .= "User: {$user->name}. ";

        if ($profile) {
            $prefStr = $profile->food_preference;
            if ($prefStr === 'veg') $prefStr = 'Strictly Vegetarian (NO MEAT/FISH/EGGS)';
            elseif ($prefStr === 'vegan') $prefStr = 'Strict Vegan (NO ANIMAL PRODUCTS)';
            elseif ($prefStr === 'jain') $prefStr = 'Jain Vegetarian (NO MEAT, NO ONION/GARLIC/POTATO)';

            $contextPrompt .= "Profile: {$profile->age}yo {$profile->gender}, {$profile->weight_kg}kg, {$profile->height_cm}cm, Goal: {$profile->goal}, Dietary Preference: {$prefStr}, Daily Calorie Target: {$profile->calories_target} kcal, Water Target: {$profile->water_intake_liters} L. " .
                "Conditions: " . (is_array($profile->diseases) ? implode(', ', $profile->diseases) : 'None') . ", Allergies: " . (is_array($profile->allergies) ? implode(', ', $profile->allergies) : 'None') . ". ";
        }

        $contextPrompt .= "CORE INSTRUCTIONS:\n" .
            "1. LENGTH: Keep responses SMALL to MEDIUM in length (strictly 100 to 180 words). Do NOT write long essays or rambling introductions.\n" .
            "2. DIRECT & PRECISE: Answer the user's exact question immediately in the first sentence with high factual accuracy. No generic fluff or repetitive greetings.\n" .
            "3. ACCURATE NUMBERS: Provide exact portions (e.g. 100g, 1 bowl, 2 pcs), calories, and protein/macros whenever discussing meals, ingredients, or recipes.\n" .
            "4. FORMAT: Use 1-2 punchy sentences, followed by 2-3 structured bullet points with **bold highlights**.\n" .
            "5. DOMAIN RULE: Only answer diet, fitness, health metrics, and nutrition questions. Politely decline non-health topics in 1 sentence.\n" .
            "6. DIETARY RESTRICTION: Strictly follow user dietary preference (never suggest meat to veg, never suggest dairy to vegan).\n" .
            "7. DYNAMIC SUGGESTIONS: At the very end, include exactly 2 short dynamic follow-up suggestions formatted as:\n\nSuggestions:\n• [Short follow-up question 1]\n• [Short follow-up question 2]";

        $hasImage = $request->filled('image') && $request->filled('mime_type');
        if ($hasImage) {
            $contextPrompt .= "\nFOOD PHOTO ANALYSIS INSTRUCTIONS:\n" .
                "The user has uploaded a photo of their food.\n" .
                "1. Identify the dish/items shown and estimate portion size (e.g. 1 bowl, 150g, 2 pieces).\n" .
                "2. State estimated calories (kcal), protein (g), carbs (g), and fat (g).\n" .
                "3. Provide a concise 2-sentence nutritional verdict.\n" .
                "4. At the end, ask: 'Did you eat this food today?'\n" .
                "5. CRITICAL: On the very last line of your response, output this machine tag formatted exactly like this:\n" .
                "[FOOD_METRICS: name=Dish Name, calories=280, protein=9.5, carbs=32, fat=12, portion=1 bowl (150g)]";
        }

        $reply = $this->nvidia->generateContent($parts, $contextPrompt);

        if ($reply !== null) {
            $detectedFood = null;

            if (preg_match('/\[FOOD_METRICS:\s*name=([^,]+),\s*calories=([0-9.]+),\s*protein=([0-9.]+),\s*carbs=([0-9.]+),\s*fat=([0-9.]+),\s*portion=([^\]]+)\]/i', $reply, $matches)) {
                $detectedFood = [
                    'name'     => trim($matches[1], ' "\''),
                    'calories' => (float) $matches[2],
                    'protein'  => (float) $matches[3],
                    'carbs'    => (float) $matches[4],
                    'fat'      => (float) $matches[5],
                    'portion'  => trim($matches[6], ' "\''),
                ];
                // Strip the machine tag from user visible reply text
                $reply = trim(str_replace($matches[0], '', $reply));
            } elseif ($hasImage) {
                // Fallback regex if vision model formatted slightly differently
                preg_match('/(\d+)\s*(?:kcal|calories)/i', $reply, $calMatch);
                preg_match('/(\d+(?:\.\d+)?)\s*g\s*protein/i', $reply, $protMatch);
                $cal = isset($calMatch[1]) ? (float)$calMatch[1] : 250;
                $prot = isset($protMatch[1]) ? (float)$protMatch[1] : 8.0;
                $detectedFood = [
                    'name'     => 'Analyzed Food Plate',
                    'calories' => $cal,
                    'protein'  => $prot,
                    'carbs'    => round($cal * 0.55 / 4, 1),
                    'fat'      => round($cal * 0.25 / 9, 1),
                    'portion'  => '1 serving',
                ];
            }

            return response()->json([
                'reply'           => $reply,
                'detected_food'   => $detectedFood,
                'is_premium'      => $isPremium,
                'remaining_chats' => $remainingChats,
            ]);
        }

        return response()->json(['error' => 'Failed to reach the AI service or an error occurred.'], 500);
    }

    /**
     * Log food detected from chat into today's Progress Log and adjust today's Meal Plan.
     */
    public function logFood(Request $request)
    {
        $request->validate([
            'food_name'        => 'required|string|max:150',
            'calories'         => 'required|numeric|min:1',
            'protein'          => 'nullable|numeric|min:0',
            'carbs'            => 'nullable|numeric|min:0',
            'fat'              => 'nullable|numeric|min:0',
            'portion'          => 'nullable|string|max:100',
            'meal_type'        => 'nullable|string|in:breakfast,lunch,snack,dinner',
            'adjust_meal_plan' => 'nullable|boolean',
        ]);

        $user      = $request->user();
        $foodName  = $request->input('food_name');
        $calories  = (float) $request->input('calories');
        $protein   = (float) ($request->input('protein') ?? 0);
        $carbs     = (float) ($request->input('carbs') ?? 0);
        $fat       = (float) ($request->input('fat') ?? 0);
        $portion   = $request->input('portion') ?? '1 serving';
        $shouldAdjust = $request->boolean('adjust_meal_plan', true);
        
        $todayStr  = now()->toDateString();
        $hour      = (int) now()->format('H');

        // 1. Determine meal slot by time of day if not provided
        $mealType = $request->input('meal_type');
        if (!$mealType) {
            if ($hour < 11) $mealType = 'breakfast';
            elseif ($hour < 16) $mealType = 'lunch';
            elseif ($hour < 19) $mealType = 'snack';
            else $mealType = 'dinner';
        }

        // 2. Update or Create Today's Progress Log
        $log = \App\Models\ProgressLog::firstOrNew([
            'user_id' => $user->id,
            'date'    => $todayStr,
        ]);

        $log->calories_consumed = round((float) ($log->calories_consumed ?? 0) + $calories);
        $log->protein = round((float) ($log->protein ?? 0) + $protein, 1);
        $log->carbs   = round((float) ($log->carbs ?? 0) + $carbs, 1);
        $log->fat     = round((float) ($log->fat ?? 0) + $fat, 1);
        $log->save();

        // Award +10 HealthCoins for logging progress
        try {
            $tokens = app(\App\Services\TokenService::class);
            $tokens->award($user, 'progress_logged', null, ['date' => $todayStr]);
        } catch (\Exception $e) {
            // silent token award error
        }

        // 3. Update / Adjust Today's Meal Plan
        $mealPlan = \App\Models\MealPlan::where('user_id', $user->id)
            ->where('date', $todayStr)
            ->with('mealItems')
            ->first();

        $adjustedSlot = null;
        $compensationMessage = null;

        if ($mealPlan) {
            // Add custom meal item for this photo food into the current slot
            $mealPlan->mealItems()->create([
                'meal_type'   => $mealType,
                'food_id'     => null,
                'quantity'    => 1,
                'unit'        => $portion,
                'calories'    => $calories,
                'protein'     => $protein,
                'carbs'       => $carbs,
                'fat'         => $fat,
                'is_consumed' => true,
            ]);

            // Smart Calorie Compensation for upcoming meal
            if ($shouldAdjust) {
                // If eaten at breakfast/lunch/snack, adjust upcoming dinner/snack
                $upcomingSlot = ($mealType === 'breakfast' || $mealType === 'lunch') ? 'dinner' : ($mealType === 'snack' ? 'dinner' : null);

                if ($upcomingSlot) {
                    $unconsumedItems = $mealPlan->mealItems()
                        ->where('meal_type', $upcomingSlot)
                        ->where('is_consumed', false)
                        ->get();

                    if ($unconsumedItems->isNotEmpty()) {
                        // Calculate how much we need to scale down the upcoming meal
                        $totalUpcomingCalories = $unconsumedItems->sum('calories');
                        $targetReduction = min($calories * 0.6, $totalUpcomingCalories * 0.4); // sensible reduction capped at 40%

                        if ($totalUpcomingCalories > 0 && $targetReduction > 30) {
                            $scaleFactor = max(0.6, ($totalUpcomingCalories - $targetReduction) / $totalUpcomingCalories);
                            foreach ($unconsumedItems as $item) {
                                $item->calories = round($item->calories * $scaleFactor);
                                $item->protein  = round($item->protein * $scaleFactor, 1);
                                $item->carbs    = round($item->carbs * $scaleFactor, 1);
                                $item->fat      = round($item->fat * $scaleFactor, 1);
                                $item->quantity = round($item->quantity * $scaleFactor, 1);
                                $item->save();
                            }
                            $adjustedSlot = ucfirst($upcomingSlot);
                            $savedKcal = round($totalUpcomingCalories - $unconsumedItems->sum('calories'));
                            $compensationMessage = "We automatically adjusted today's {$adjustedSlot} (reduced ~{$savedKcal} kcal) to balance your daily intake.";
                        }
                    }
                }
            }
        }

        $targetCalories = $user->profile?->calories_target ?? 2000;
        $consumedToday  = $log->calories_consumed;
        $remainingKcal  = max(0, $targetCalories - $consumedToday);

        return response()->json([
            'success'          => true,
            'message'          => "Logged {$foodName} (+{$calories} kcal) to today's progress!",
            'food_name'        => $foodName,
            'calories'         => $calories,
            'consumed_today'   => $consumedToday,
            'target_calories'  => $targetCalories,
            'remaining_today'  => $remainingKcal,
            'adjusted_slot'    => $adjustedSlot,
            'compensation_msg' => $compensationMessage,
        ]);
    }
}

