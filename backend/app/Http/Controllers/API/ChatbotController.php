<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ChatbotController extends Controller
{
    public function __construct(private GeminiService $gemini) {}

    public function ask(Request $request)
    {
        $user = $request->user();
        
        if (!$user->isPremium()) {
            $date = now()->format('Y-m-d');
            $cacheKey = "user_ai_chats_{$user->id}_{$date}";
            $chatCount = Cache::get($cacheKey, 0);

            if ($chatCount >= 5) {
                return response()->json([
                    'error' => 'Daily AI chat limit reached (5/5). Upgrade to Premium for unlimited access.',
                    'limit_reached' => true
                ], 403);
            }
            
            Cache::put($cacheKey, $chatCount + 1, now()->addDay());
        }

        $request->validate([
            'message' => 'nullable|string|max:1000',
            'image' => 'nullable|string',
            'mime_type' => 'nullable|string'
        ]);

        if (!$this->gemini->isConfigured()) {
            return response()->json([
                'error' => 'Gemini API Key is not configured in the backend .env file.'
            ], 500);
        }

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
                    'data' => $request->input('image')
                ]
            ];
        }

        // --- Build Personalized Context ---
        $profile = $user->profile;
        $contextPrompt = "You are an expert Diet and Nutrition assistant. ";
        if ($profile) {
            $contextPrompt .= "The user you are helping has the following profile: " .
                "Age: {$profile->age}, Gender: {$profile->gender}, Weight: {$profile->weight_kg}kg, Height: {$profile->height_cm}cm, " .
                "Goal: {$profile->goal}, Preference: {$profile->food_preference}. " .
                "Daily Calorie Target: {$profile->calories_target}kcal. " .
                "Existing diseases/conditions: " . (is_array($profile->diseases) ? implode(', ', $profile->diseases) : 'None') . ". ";
        }
        $contextPrompt .= "Please provide concise, medically-sound, and encouraging advice tailored specifically to this individual's metrics. If they upload food, compare it to their daily targets.";

        $reply = $this->gemini->generateContent($parts, $contextPrompt);

        if ($reply !== null) {
            return response()->json(['reply' => $reply]);
        }

        return response()->json(['error' => 'Failed to reach the AI service or an error occurred.'], 500);
    }
}
