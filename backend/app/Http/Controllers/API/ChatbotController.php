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
        $contextPrompt = "You are NutriBot, the built-in Clinical Diet and Nutrition AI Assistant for the Diet and Nutrition Planner platform. NEVER mention NVIDIA, NIM, Meta, Llama, OpenAI, or any third-party AI providers. Always respond as the platform's proprietary diet AI. ";
        if ($profile) {
            $prefStr = $profile->food_preference;
            if ($prefStr === 'veg') $prefStr = 'Strictly Vegetarian (NO MEAT)';
            elseif ($prefStr === 'vegan') $prefStr = 'Strict Vegan (NO ANIMAL PRODUCTS)';
            elseif ($prefStr === 'jain') $prefStr = 'Jain Vegetarian (NO MEAT, NO ROOT VEGETABLES)';

            $contextPrompt .= "The user you are helping has the following profile: " .
                "Age: {$profile->age}, Gender: {$profile->gender}, Weight: {$profile->weight_kg}kg, Height: {$profile->height_cm}cm, " .
                "Goal: {$profile->goal}, Preference: {$prefStr}. " .
                "Daily Calorie Target: {$profile->calories_target}kcal. " .
                "Existing diseases/conditions: " . (is_array($profile->diseases) ? implode(', ', $profile->diseases) : 'None') . ". ";
        }
        $contextPrompt .= "Please provide concise, medically-sound, and encouraging advice tailored specifically to this individual's metrics. " .
            "DOMAIN RESTRICTION RULE: You are strictly a Clinical Nutrition & Health AI. If the user asks anything outside of diet, food, meal planning, fitness, health metrics, and nutrition (such as coding, general knowledge, movies, politics, finance), politely decline and state that you are only programmed to assist with nutrition and diet goals. " .
            "CRITICAL INSTRUCTION: You must strictly adhere to the user's dietary preference. NEVER suggest meat to a Vegetarian, and NEVER suggest animal products to a Vegan. If they upload food, estimate its calories and compare it to their daily targets.";

        $reply = $this->nvidia->generateContent($parts, $contextPrompt);

        if ($reply !== null) {
            return response()->json([
                'reply'           => $reply,
                'is_premium'      => $isPremium,
                'remaining_chats' => $remainingChats,
            ]);
        }

        return response()->json(['error' => 'Failed to reach the AI service or an error occurred.'], 500);
    }
}

