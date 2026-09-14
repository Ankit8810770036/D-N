<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class NvidiaNimService
{
    private string $apiKey;
    private string $baseUrl;
    private string $defaultModel;
    private string $visionModel;
    private string $systemPrompt;

    public function __construct()
    {
        $this->apiKey       = config('services.nvidia.key', env('NVIDIA_NIM_API_KEY', env('NVIDIA_API_KEY', '')));
        $this->baseUrl      = config('services.nvidia.base_url', 'https://integrate.api.nvidia.com/v1/chat/completions');
        $this->defaultModel = config('services.nvidia.model', 'meta/llama-3.2-11b-vision-instruct');
        $this->visionModel  = config('services.nvidia.vision_model', 'meta/llama-3.2-11b-vision-instruct');
        
        $this->systemPrompt = "You are NutriBot, an elite Clinical Dietitian, Nutritionist, and Health AI specialized in Indian diets, culinary traditions, and metabolic wellness (ICMR-NIN guidelines). " .
            "Always act as the platform's proprietary built-in diet AI assistant. NEVER mention NVIDIA, NIM, Meta, Llama, OpenAI, or any external AI providers or model names. " .
            "Provide evidence-based, medically sound, and practical nutrition advice customized for Indian lifestyles (e.g., vegetarian protein pairing, glycemic load management with fiber-rich dals/sabzis, healthy traditional cooking with cold-pressed oils or minimal desi ghee, hydration with chaas/coconut water). " .
            "DOMAIN RESTRICTION RULE: You ONLY answer questions related to diet, Indian food, recipes, calories, macronutrients, hydration, health metrics, fitness, and nutritional wellness. " .
            "If the user asks about ANY unrelated topic (e.g., coding, politics, general history, movie trivia, finance, gaming), politely decline and state that you are the built-in Diet & Nutrition Assistant specialized strictly in diet and nutrition, and offer to help with their dietary or health goals instead. " .
            "Use clear formatting with **bold highlights**, bullet points, and actionable tips. " .
            "Keep answers concise (under 300 words). Strictly adhere to user dietary preferences (Veg, Non-Veg, Vegan, Jain) and medical safeguards.";
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Generate chat content using NVIDIA NIM LLM.
     * Automatically routes to vision model if an image is provided.
     *
     * @param array $parts Array containing text and/or inline_data (base64 image)
     * @param string|null $customSystemInstruction Profile-specific context
     * @return string|null Generated response
     */
    public function generateContent(array $parts, ?string $customSystemInstruction = null): ?string
    {
        if (empty($this->apiKey)) {
            return $this->getFallbackResponse($parts);
        }

        $userText   = '';
        $imageData  = null;
        $mimeType   = 'image/jpeg';

        foreach ($parts as $part) {
            if (isset($part['text'])) {
                $userText .= $part['text'] . ' ';
            }
            if (isset($part['inline_data'])) {
                $imageData = $part['inline_data']['data'] ?? null;
                $mimeType  = $part['inline_data']['mime_type'] ?? 'image/jpeg';
            }
        }
        $userText = trim($userText);

        $systemContent = $customSystemInstruction ?? $this->systemPrompt;

        // Select model and format message content
        if ($imageData) {
            $model = $this->visionModel;
            if (empty($userText)) {
                $userText = 'Please estimate the calories, macronutrients, and health quality of this Indian meal.';
            }

            $userMessageContent = [
                ['type' => 'text', 'text' => $userText],
                [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => "data:{$mimeType};base64,{$imageData}"
                    ]
                ]
            ];
        } else {
            $model = $this->defaultModel;
            if (empty($userText)) {
                $userText = 'Namaste! What are healthy dietary recommendations for today?';
            }
            $userMessageContent = $userText;
        }

        try {
            $response = Http::withoutVerifying()
                ->timeout(35)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type'  => 'application/json',
                    'Accept'        => 'application/json',
                ])
                ->post($this->baseUrl, [
                    'model'       => $model,
                    'messages'    => [
                        ['role' => 'system', 'content' => $systemContent],
                        ['role' => 'user',   'content' => $userMessageContent],
                    ],
                    'temperature' => 0.6,
                    'top_p'       => 0.9,
                    'max_tokens'  => 1024,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $reply = $data['choices'][0]['message']['content'] ?? null;
                if (!empty($reply)) {
                    return $reply;
                }
            }

            if ($response->status() === 429) {
                Log::warning('NVIDIA NIM API rate limited — serving intelligent fallback.');
                return $this->getFallbackResponse($parts);
            }

            Log::error('NVIDIA NIM API Error (' . $response->status() . '): ' . $response->body());
            return $this->getFallbackResponse($parts);

        } catch (Exception $e) {
            Log::error('NVIDIA NIM Service Exception: ' . $e->getMessage());
            return $this->getFallbackResponse($parts);
        }
    }

    /**
     * Smart fallback response when API key is missing or service is temporarily unreachable.
     */
    private function getFallbackResponse(array $parts): string
    {
        $userText = '';
        foreach ($parts as $part) {
            if (isset($part['text'])) {
                $userText .= strtolower($part['text']) . ' ';
            }
        }

        if (str_contains($userText, 'weight loss') || str_contains($userText, 'lose weight') || str_contains($userText, 'fat loss')) {
            return "### 💡 Indian Weight Loss Nutrition Plan\n\n" .
                "• **Roti & Rice Balance**: Limit to **1–2 Phulkas** or **1 small katori Brown/Basmati Rice** per main meal; fill half your plate with green sabzi (Bhindi, Lauki, Palak) and salad (Kheera, Tamatar).\n" .
                "• **Protein First**: Include high-protein staples like **Paneer, Moong Dal, Soya Chunks, Boiled Sprouts, or Boiled Eggs** with every meal.\n" .
                "• **Snack Smart**: Swap fried snacks with **Roasted Makhana, Bhuna Chana, or Sprouted Moong Chaat**.\n" .
                "• **Hydration**: Drink **2.5–3.5 Liters daily**, including refreshing homemade **Chaas (Spiced Buttermilk)** and **Coconut Water**.";
        }

        if (str_contains($userText, 'protein') || str_contains($userText, 'muscle') || str_contains($userText, 'gain')) {
            return "### 💪 High-Protein Indian Diet Optimization\n\n" .
                "• **Top Vegetarian Protein Sources**: Fresh Paneer (18g/100g), Soya Chunks (52g/100g dry), Yellow Moong Dal & Kala Chana, Dahi/Curd, Sattu Drink, and Moong Dal Chilla.\n" .
                "• **Top Non-Veg Sources**: Boiled Eggs/Egg Bhurji (13g protein/2 eggs), Grilled Chicken Breast / Homestyle Chicken Curry (30g protein/100g), Rohu/Katla Fish.\n" .
                "• **Even Distribution**: Aim for **20–35g protein per meal** across Breakfast, Lunch, and Dinner for maximum muscle recovery.";
        }

        if (str_contains($userText, 'water') || str_contains($userText, 'hydration')) {
            return "### 💧 Daily Hydration Target (Indian Climate)\n\n" .
                "• Baseline target: **35ml per kg body weight** (approx. 2.5–3.5L per day).\n" .
                "• Indian Electrolyte Boosters: **Tender Coconut Water (Nariyal Pani)**, **Chaas with roasted jeera**, and **Lemon Water (Nimbu Pani with rock salt)**.";
        }

        return "### 🥗 NutriBot Indian Diet Assistant\n\n" .
            "Namaste! I am your clinical Indian diet and nutrition assistant. I help you tailor authentic Indian meals according to your target calories, macros, and health conditions.\n\n" .
            "You can ask me questions like:\n" .
            "• *'What is a high-protein vegetarian Indian breakfast under 350 calories?'*\n" .
            "• *'How can I control blood sugar using Indian diet staples?'*\n" .
            "• *'Give me a balanced Indian lunch thali combination for weight loss.'*";
    }

    /**
     * Generate a 7-day personalized AI weekly meal plan based on health profile.
     *
     * @param array $userProfile User metrics, diseases, allergies, calories target, etc.
     * @param string $startDate YYYY-MM-DD
     * @return array 7-day structured meal plan
     */
    public function generateWeeklyMealPlan(array $userProfile, string $startDate): array
    {
        $targetCalories = $userProfile['calories_target'] ?? 2000;
        $goal           = $userProfile['goal'] ?? 'maintain';
        $pref           = $userProfile['food_preference'] ?? 'veg';
        $diseases       = !empty($userProfile['diseases']) ? implode(', ', (array)$userProfile['diseases']) : 'None';
        $allergies      = !empty($userProfile['allergies']) ? implode(', ', (array)$userProfile['allergies']) : 'None';
        $weight         = $userProfile['weight_kg'] ?? 65;
        $age            = $userProfile['age'] ?? 28;
        $gender         = $userProfile['gender'] ?? 'male';

        if (empty($this->apiKey)) {
            return $this->getDeterministicWeeklyPlan($userProfile, $startDate);
        }

        $prompt = "You are NutriBot, an expert Clinical Indian Dietitian AI. " .
            "Create an authentic 7-day personalized Indian weekly meal plan starting on {$startDate} tailored to these exact health metrics:\n" .
            "- Daily Calorie Target: {$targetCalories} kcal\n" .
            "- Goal: {$goal}\n" .
            "- Dietary Preference: {$pref} (STRICTLY ADHERE: " . ($pref === 'veg' ? 'Strict Vegetarian: No meat/poultry/fish/egg' : ($pref === 'vegan' ? 'Strict Vegan: No animal products, no dairy, no ghee, no meat' : ($pref === 'jain' ? 'Jain: Vegetarian, no root vegetables like onion/garlic/potatoes' : 'Standard Non-Veg allowed'))) . ")\n" .
            "- Medical Conditions: {$diseases}\n" .
            "- Allergies: {$allergies}\n" .
            "- Profile: {$age}yo {$gender}, {$weight}kg in India.\n\n" .
            "CRITICAL INDIAN MEAL-SLOT RULES:\n" .
            "1. BREAKFAST: Must be authentic Indian breakfast (Poha with peanuts, Moong Dal Chilla with paneer, Vegetable Upma, Steamed Idli Sambhar, Besan Chilla, Vegetable Dalia, Boiled Eggs / Desi Egg Bhurji + Whole Wheat Toast, Oats Porridge/Khichdi). NEVER heavy lunch curries.\n" .
            "2. SNACKS: Healthy Indian evening snacks (Roasted Makhana, Bhuna Chana, Sprouted Moong Chaat, Steamed Dhokla, Almonds/Walnuts, Chaas, Coconut Water, Tulsi Green Tea). NEVER rice or main heavy dishes.\n" .
            "3. LUNCH: Classic Balanced Indian Thali (Roti/Phulka/Brown Rice + Dal Tadka/Moong Dal/Rajma/Chhole/Paneer/Chicken/Fish + Sabzi like Bhindi/Palak/Lauki + Cucumber Salad / Dahi).\n" .
            "4. DINNER: Wholesome & light Indian dinner (Phulkas / Khichdi / Jowar Roti + Dal / Soya Chunks / Paneer / Grilled Fish + Green Sabzi & Salad).\n\n" .
            "OUTPUT REQUIREMENT: Return ONLY a valid, raw JSON object (no markdown quotes, no explanations) matching this exact schema:\n" .
            "{\n" .
            '  "days": [' . "\n" .
            '    {' . "\n" .
            '      "day_number": 1,' . "\n" .
            '      "date": "' . $startDate . '",' . "\n" .
            '      "meals": {' . "\n" .
            '        "breakfast": [' . "\n" .
            '          {"food_name": "Poha (Flattened Rice)", "name": "Vegetable Poha with Peanuts", "quantity": 120, "unit": "g", "calories": 180, "protein": 3.5, "carbs": 35, "fat": 3}' . "\n" .
            '        ],' . "\n" .
            '        "lunch": [' . "\n" .
            '          {"food_name": "Roti (Chapati)", "name": "Whole Wheat Phulkas (2 pcs)", "quantity": 60, "unit": "g", "calories": 170, "protein": 6, "carbs": 32, "fat": 1},' . "\n" .
            '          {"food_name": "Yellow Moong Dal", "name": "Yellow Moong Dal Tadka", "quantity": 150, "unit": "g", "calories": 145, "protein": 9.2, "carbs": 22, "fat": 2.5}' . "\n" .
            '        ],' . "\n" .
            '        "snack": [' . "\n" .
            '          {"food_name": "Roasted Makhana (Fox Nuts)", "name": "Roasted Crispy Makhana", "quantity": 30, "unit": "g", "calories": 110, "protein": 3.2, "carbs": 22, "fat": 1.2}' . "\n" .
            '        ],' . "\n" .
            '        "dinner": [' . "\n" .
            '          {"food_name": "Paneer Bhurji", "name": "Spiced Paneer Bhurji", "quantity": 120, "unit": "g", "calories": 220, "protein": 14.5, "carbs": 4.8, "fat": 16.2}' . "\n" .
            '        ]' . "\n" .
            '      }' . "\n" .
            '    }' . "\n" .
            '  ]' . "\n" .
            '}';

        try {
            $response = Http::withoutVerifying()
                ->timeout(45)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type'  => 'application/json',
                    'Accept'        => 'application/json',
                ])
                ->post($this->baseUrl, [
                    'model'       => $this->defaultModel,
                    'messages'    => [
                        ['role' => 'system', 'content' => 'You are NutriBot, an expert Indian clinical meal planning engine. You respond strictly with raw JSON conforming to the requested schema with no extra text.'],
                        ['role' => 'user',   'content' => $prompt],
                    ],
                    'temperature' => 0.4,
                    'max_tokens'  => 3500,
                ]);

            if ($response->successful()) {
                $rawContent = $response->json()['choices'][0]['message']['content'] ?? '';
                // Clean markdown formatting if returned
                $cleanJson = trim($rawContent);
                if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $cleanJson, $matches)) {
                    $cleanJson = $matches[1];
                }

                $parsed = json_decode($cleanJson, true);
                if (isset($parsed['days']) && is_array($parsed['days']) && count($parsed['days']) >= 5) {
                    return $parsed;
                }
            }
        } catch (Exception $e) {
            Log::warning('AI Weekly Plan generation error: ' . $e->getMessage());
        }

        return $this->getDeterministicWeeklyPlan($userProfile, $startDate);
    }

    /**
     * Fallback high-quality 7-day programmatic clinical Indian weekly meal plan generator.
     */
    public function getDeterministicWeeklyPlan(array $userProfile, string $startDate): array
    {
        $target = $userProfile['calories_target'] ?? 2000;
        $pref   = strtolower(trim($userProfile['food_preference'] ?? 'veg'));
        $isVeg  = in_array($pref, ['veg', 'vegetarian', 'vegan', 'jain']);
        $isVegan= $pref === 'vegan';

        // 7 distinct authentic Indian days of meal templates
        $templates = [
            // Day 1: Poha, Rajma Chawal Thali, Roasted Makhana, Paneer Bhurji with Phulkas
            [
                'breakfast' => [
                    ['food_name' => 'Poha (Flattened Rice)', 'name' => 'Vegetable Poha with Peanuts', 'quantity' => 120, 'unit' => 'g', 'calories' => 180, 'protein' => 3.5, 'carbs' => 35, 'fat' => 3.0],
                    ['food_name' => 'Masala Chai (Low Sugar)', 'name' => 'Adrak Masala Chai', 'quantity' => 150, 'unit' => 'ml', 'calories' => 45, 'protein' => 1.8, 'carbs' => 5.2, 'fat' => 1.8],
                    ['food_name' => 'Papaya (Papeeta)', 'name' => 'Fresh Diced Papaya', 'quantity' => 100, 'unit' => 'g', 'calories' => 43, 'protein' => 0.5, 'carbs' => 11, 'fat' => 0.3],
                ],
                'lunch' => [
                    ['food_name' => 'Steamed Basmati Rice', 'name' => 'Steamed Basmati Rice', 'quantity' => 130, 'unit' => 'g', 'calories' => 160, 'protein' => 3.4, 'carbs' => 35, 'fat' => 0.5],
                    ['food_name' => 'Rajma (Kidney Beans)', 'name' => 'Punjabi Slow-Cooked Rajma', 'quantity' => 160, 'unit' => 'g', 'calories' => 175, 'protein' => 10.2, 'carbs' => 28, 'fat' => 2.5],
                    ['food_name' => 'Cucumber (Kheera Salad)', 'name' => 'Fresh Kheera & Tomato Salad', 'quantity' => 100, 'unit' => 'g', 'calories' => 15, 'protein' => 0.7, 'carbs' => 3.6, 'fat' => 0.1],
                ],
                'snack' => [
                    ['food_name' => 'Roasted Makhana (Fox Nuts)', 'name' => 'Crispy Roasted Makhana', 'quantity' => 30, 'unit' => 'g', 'calories' => 110, 'protein' => 3.2, 'carbs' => 22, 'fat' => 1.2],
                    ['food_name' => 'Tulsi Green Tea', 'name' => 'Antioxidant Tulsi Green Tea', 'quantity' => 200, 'unit' => 'ml', 'calories' => 2, 'protein' => 0, 'carbs' => 0.2, 'fat' => 0],
                ],
                'dinner' => [
                    ['food_name' => 'Phulka', 'name' => 'Warm Whole Wheat Phulkas (2 pcs)', 'quantity' => 60, 'unit' => 'g', 'calories' => 170, 'protein' => 6.0, 'carbs' => 32, 'fat' => 1.0],
                    ['food_name' => $isVegan ? 'Tofu (Soya Paneer)' : 'Paneer Bhurji', 'name' => $isVegan ? 'Spiced Tofu Bhurji' : 'Paneer Bhurji', 'quantity' => 120, 'unit' => 'g', 'calories' => $isVegan ? 102 : 220, 'protein' => $isVegan ? 11.4 : 14.5, 'carbs' => $isVegan ? 2.5 : 4.8, 'fat' => $isVegan ? 5.4 : 16.2],
                    ['food_name' => 'Palak Sabzi (Spinach)', 'name' => 'Garlic Sautéed Palak', 'quantity' => 120, 'unit' => 'g', 'calories' => 60, 'protein' => 3.5, 'carbs' => 4.8, 'fat' => 3.2],
                ]
            ],

            // Day 2: Moong Dal Chilla, Moong Dal Tadka with Phulkas & Bhindi, Bhuna Chana, Chicken/Soya Curry
            [
                'breakfast' => [
                    ['food_name' => 'Moong Dal Chilla', 'name' => 'High-Protein Moong Dal Chilla', 'quantity' => 120, 'unit' => 'g', 'calories' => 185, 'protein' => 11.3, 'carbs' => 24, 'fat' => 4.6],
                    ['food_name' => 'Curd (Dahi)', 'name' => 'Fresh Probiotic Dahi', 'quantity' => 100, 'unit' => 'g', 'calories' => 65, 'protein' => 4.1, 'carbs' => 4.6, 'fat' => 3.5],
                    ['food_name' => 'Pomegranate (Anar)', 'name' => 'Fresh Anar Seeds', 'quantity' => 50, 'unit' => 'g', 'calories' => 41, 'protein' => 0.8, 'carbs' => 9, 'fat' => 0.6],
                ],
                'lunch' => [
                    ['food_name' => 'Phulka', 'name' => 'Whole Wheat Phulkas (2 pcs)', 'quantity' => 60, 'unit' => 'g', 'calories' => 170, 'protein' => 6.0, 'carbs' => 32, 'fat' => 1.0],
                    ['food_name' => 'Yellow Moong Dal', 'name' => 'Moong Dal Tadka with Jeera & Hing', 'quantity' => 150, 'unit' => 'g', 'calories' => 145, 'protein' => 9.2, 'carbs' => 22, 'fat' => 2.5],
                    ['food_name' => 'Bhindi Masala (Okra)', 'name' => 'Homestyle Bhindi Masala', 'quantity' => 100, 'unit' => 'g', 'calories' => 70, 'protein' => 2.0, 'carbs' => 7.0, 'fat' => 4.0],
                ],
                'snack' => [
                    ['food_name' => 'Roasted Chana (Bhuna Chana)', 'name' => 'Crisp Bhuna Chana', 'quantity' => 35, 'unit' => 'g', 'calories' => 135, 'protein' => 7.5, 'carbs' => 21, 'fat' => 2.2],
                    ['food_name' => 'Chaas (Spiced Buttermilk)', 'name' => 'Jeera Pudina Chaas', 'quantity' => 200, 'unit' => 'ml', 'calories' => 40, 'protein' => 2.8, 'carbs' => 3.6, 'fat' => 1.5],
                ],
                'dinner' => [
                    ['food_name' => 'Roti (Chapati)', 'name' => 'Whole Wheat Chapatis', 'quantity' => 70, 'unit' => 'g', 'calories' => 210, 'protein' => 6.6, 'carbs' => 38.5, 'fat' => 2.6],
                    ['food_name' => $isVeg ? 'Soya Chunks Curry' : 'Homestyle Chicken Curry', 'name' => $isVeg ? 'Nutritious Soya Chunks Curry' : 'Tari Wala Chicken Curry', 'quantity' => 160, 'unit' => 'g', 'calories' => $isVeg ? 180 : 225, 'protein' => $isVeg ? 20.8 : 27.0, 'carbs' => $isVeg ? 14 : 5, 'fat' => $isVeg ? 4.0 : 10.8],
                    ['food_name' => 'Cucumber Raita', 'name' => 'Cooling Cucumber Raita', 'quantity' => 100, 'unit' => 'g', 'calories' => 62, 'protein' => 3.8, 'carbs' => 5.4, 'fat' => 2.9],
                ]
            ],

            // Day 3: Idli Sambhar, Chhole with Jeera Brown Rice & Raita, Fruit Chaat, Khichdi with Dahi
            [
                'breakfast' => [
                    ['food_name' => 'Idli (Steamed)', 'name' => 'Steamed Fluffy Idlis (3 pcs)', 'quantity' => 120, 'unit' => 'g', 'calories' => 155, 'protein' => 5.2, 'carbs' => 31, 'fat' => 0.7],
                    ['food_name' => 'Sambhar (South Indian)', 'name' => 'Drumstick & Vegetable Sambhar', 'quantity' => 160, 'unit' => 'g', 'calories' => 110, 'protein' => 5.2, 'carbs' => 18, 'fat' => 2.0],
                ],
                'lunch' => [
                    ['food_name' => 'Brown Rice', 'name' => 'Brown Rice Jeera Pulao', 'quantity' => 130, 'unit' => 'g', 'calories' => 145, 'protein' => 3.8, 'carbs' => 30, 'fat' => 1.2],
                    ['food_name' => 'Chhole (Chickpeas Curry)', 'name' => 'Amritsari Chhole Masala', 'quantity' => 160, 'unit' => 'g', 'calories' => 195, 'protein' => 9.8, 'carbs' => 30, 'fat' => 4.5],
                    ['food_name' => 'Radish (Mooli Salad)', 'name' => 'Mooli & Green Chili Salad', 'quantity' => 80, 'unit' => 'g', 'calories' => 13, 'protein' => 0.5, 'carbs' => 2.7, 'fat' => 0.1],
                ],
                'snack' => [
                    ['food_name' => 'Sprouts Chaat', 'name' => 'Tangy Sprouted Moong Chaat', 'quantity' => 120, 'unit' => 'g', 'calories' => 130, 'protein' => 8.2, 'carbs' => 21, 'fat' => 1.5],
                    ['food_name' => 'Coconut Water (Nariyal Pani)', 'name' => 'Fresh Nariyal Pani', 'quantity' => 240, 'unit' => 'ml', 'calories' => 45, 'protein' => 1.7, 'carbs' => 8.9, 'fat' => 0.5],
                ],
                'dinner' => [
                    ['food_name' => 'Moong Dal Khichdi', 'name' => 'Ayurvedic Vegetable Moong Khichdi', 'quantity' => 160, 'unit' => 'g', 'calories' => 190, 'protein' => 7.0, 'carbs' => 34, 'fat' => 3.2],
                    ['food_name' => 'Curd (Dahi)', 'name' => 'Homemade Fresh Dahi', 'quantity' => 100, 'unit' => 'g', 'calories' => 65, 'protein' => 4.1, 'carbs' => 4.6, 'fat' => 3.5],
                    ['food_name' => 'Lauki Sabzi (Bottle Gourd)', 'name' => 'Light Lauki ki Sabzi', 'quantity' => 100, 'unit' => 'g', 'calories' => 40, 'protein' => 1.3, 'carbs' => 4.6, 'fat' => 1.8],
                ]
            ],

            // Day 4: Vegetable Dalia / Besan Chilla, Palak Paneer with Jowar Roti, Roasted Peanuts, Toor Dal
            [
                'breakfast' => [
                    ['food_name' => 'Besan Chilla', 'name' => 'Nutritious Besan Chilla with Veggies', 'quantity' => 120, 'unit' => 'g', 'calories' => 200, 'protein' => 10.4, 'carbs' => 25, 'fat' => 5.6],
                    ['food_name' => 'Guava (Amrood)', 'name' => 'Fresh Amrood Slices with Chaat Masala', 'quantity' => 100, 'unit' => 'g', 'calories' => 68, 'protein' => 2.6, 'carbs' => 14, 'fat' => 0.9],
                ],
                'lunch' => [
                    ['food_name' => 'Jowar Roti (Sorghum)', 'name' => 'Gluten-Free Jowar Roti (2 pcs)', 'quantity' => 70, 'unit' => 'g', 'calories' => 160, 'protein' => 4.9, 'carbs' => 34, 'fat' => 1.4],
                    ['food_name' => 'Palak Paneer', 'name' => 'Iron-Rich Palak Paneer Gravy', 'quantity' => 150, 'unit' => 'g', 'calories' => 210, 'protein' => 12.8, 'carbs' => 6.2, 'fat' => 15.0],
                    ['food_name' => 'Cucumber (Kheera Salad)', 'name' => 'Kheera Salad with Lemon', 'quantity' => 80, 'unit' => 'g', 'calories' => 12, 'protein' => 0.5, 'carbs' => 2.8, 'fat' => 0.1],
                ],
                'snack' => [
                    ['food_name' => 'Roasted Peanuts (Moongfali)', 'name' => 'Crunchy Roasted Peanuts', 'quantity' => 25, 'unit' => 'g', 'calories' => 142, 'protein' => 6.4, 'carbs' => 4.0, 'fat' => 12.2],
                    ['food_name' => 'Tulsi Green Tea', 'name' => 'Herbal Tulsi Green Tea', 'quantity' => 200, 'unit' => 'ml', 'calories' => 2, 'protein' => 0, 'carbs' => 0.2, 'fat' => 0],
                ],
                'dinner' => [
                    ['food_name' => 'Phulka', 'name' => 'Whole Wheat Phulkas (2 pcs)', 'quantity' => 60, 'unit' => 'g', 'calories' => 170, 'protein' => 6.0, 'carbs' => 32, 'fat' => 1.0],
                    ['food_name' => 'Toor Dal (Arhar Dal)', 'name' => 'Homestyle Arhar Dal Tadka', 'quantity' => 150, 'unit' => 'g', 'calories' => 155, 'protein' => 8.8, 'carbs' => 24, 'fat' => 2.8],
                    ['food_name' => 'Baingan Bharta (Eggplant)', 'name' => 'Roasted Baingan Bharta', 'quantity' => 120, 'unit' => 'g', 'calories' => 88, 'protein' => 2.0, 'carbs' => 7.8, 'fat' => 5.3],
                ]
            ],

            // Day 5: Egg Bhurji / Oats Khichdi, Fish/Paneer Curry with Rice, Almonds, Kala Chana
            [
                'breakfast' => [
                    ['food_name' => $isVeg ? 'Masala Oats' : 'Egg Bhurji (Indian Scramble)', 'name' => $isVeg ? 'Vegetable Masala Oats' : 'Desi Egg Bhurji (2 Eggs)', 'quantity' => 150, 'unit' => 'g', 'calories' => $isVeg ? 170 : 218, 'protein' => $isVeg ? 6.2 : 16.8, 'carbs' => $isVeg ? 29 : 4.3, 'fat' => $isVeg ? 3.5 : 15.0],
                    ['food_name' => 'Whole Wheat Bread', 'name' => 'Toasted Whole Wheat Bread (1 slice)', 'quantity' => 30, 'unit' => 'g', 'calories' => 76, 'protein' => 3.5, 'carbs' => 13.6, 'fat' => 0.9],
                    ['food_name' => 'Apple (Seb)', 'name' => 'Kashmiri Apple Slices', 'quantity' => 80, 'unit' => 'g', 'calories' => 41, 'protein' => 0.2, 'carbs' => 11.2, 'fat' => 0.1],
                ],
                'lunch' => [
                    ['food_name' => 'Steamed Basmati Rice', 'name' => 'Steamed Basmati Rice', 'quantity' => 130, 'unit' => 'g', 'calories' => 160, 'protein' => 3.4, 'carbs' => 35, 'fat' => 0.5],
                    ['food_name' => $isVeg ? 'Kala Chana (Black Chickpeas)' : 'Rohu / Katla Fish Curry', 'name' => $isVeg ? 'Spiced Kala Chana Tari' : 'Bengali Style Rohu Fish Curry', 'quantity' => 150, 'unit' => 'g', 'calories' => $isVeg ? 165 : 190, 'protein' => $isVeg ? 10.5 : 22.5, 'carbs' => $isVeg ? 26 : 4, 'fat' => $isVeg ? 2.8 : 9.2],
                    ['food_name' => 'Tori Sabzi (Ridge Gourd)', 'name' => 'Light Tori ki Sabzi', 'quantity' => 100, 'unit' => 'g', 'calories' => 36, 'protein' => 1.1, 'carbs' => 4.1, 'fat' => 1.6],
                ],
                'snack' => [
                    ['food_name' => 'Almonds (Badam)', 'name' => 'Soaked Mamra Almonds', 'quantity' => 20, 'unit' => 'g', 'calories' => 116, 'protein' => 4.1, 'carbs' => 4.4, 'fat' => 10.0],
                    ['food_name' => 'Namkeen Sattu Drink', 'name' => 'Desi Energy Sattu Drink with Jeera & Lemon', 'quantity' => 200, 'unit' => 'ml', 'calories' => 96, 'protein' => 5.7, 'carbs' => 14.4, 'fat' => 1.6],
                ],
                'dinner' => [
                    ['food_name' => 'Multigrain Roti', 'name' => 'Multigrain Phulkas (2 pcs)', 'quantity' => 60, 'unit' => 'g', 'calories' => 165, 'protein' => 6.7, 'carbs' => 28.5, 'fat' => 2.7],
                    ['food_name' => 'Masoor Dal (Red Lentils)', 'name' => 'High-Fiber Masoor Dal Tadka', 'quantity' => 150, 'unit' => 'g', 'calories' => 140, 'protein' => 9.5, 'carbs' => 21, 'fat' => 2.2],
                    ['food_name' => 'Gobhi Matar Sabzi', 'name' => 'Gobhi Matar ki Sabzi', 'quantity' => 110, 'unit' => 'g', 'calories' => 76, 'protein' => 3.2, 'carbs' => 9.5, 'fat' => 2.9],
                ]
            ],

            // Day 6: Upma with Curry Leaves, Soya/Chicken Pulao with Raita, Roasted Chana, Methi Roti & Dal
            [
                'breakfast' => [
                    ['food_name' => 'Upma (Semolina/Rava)', 'name' => 'Vegetable Rava Upma with Curry Leaves', 'quantity' => 140, 'unit' => 'g', 'calories' => 195, 'protein' => 4.5, 'carbs' => 32, 'fat' => 5.5],
                    ['food_name' => 'Mosambi (Sweet Lime)', 'name' => 'Fresh Sweet Lime Wedges', 'quantity' => 100, 'unit' => 'g', 'calories' => 43, 'protein' => 0.8, 'carbs' => 10.5, 'fat' => 0.1],
                ],
                'lunch' => [
                    ['food_name' => 'Steamed Basmati Rice', 'name' => 'Aromatic Basmati Rice', 'quantity' => 100, 'unit' => 'g', 'calories' => 123, 'protein' => 2.6, 'carbs' => 27, 'fat' => 0.4],
                    ['food_name' => $isVeg ? 'Soya Chunks Curry' : 'Chicken Tikka (Tandoori)', 'name' => $isVeg ? 'High-Protein Soya Masala' : 'Smoky Tandoori Chicken Tikka', 'quantity' => 130, 'unit' => 'g', 'calories' => $isVeg ? 147 : 195, 'protein' => $isVeg ? 16.9 : 30.0, 'carbs' => $isVeg ? 11.2 : 3.2, 'fat' => $isVeg ? 3.3 : 6.5],
                    ['food_name' => 'Cucumber Raita', 'name' => 'Chilled Cucumber Mint Raita', 'quantity' => 100, 'unit' => 'g', 'calories' => 62, 'protein' => 3.8, 'carbs' => 5.4, 'fat' => 2.9],
                ],
                'snack' => [
                    ['food_name' => 'Whole Wheat Khakhra', 'name' => 'Crispy Methi Khakhra', 'quantity' => 30, 'unit' => 'g', 'calories' => 120, 'protein' => 3.5, 'carbs' => 22, 'fat' => 2.0],
                    ['food_name' => 'Lemon Water (Nimbu Pani)', 'name' => 'Nimbu Pani with Black Salt', 'quantity' => 250, 'unit' => 'ml', 'calories' => 15, 'protein' => 0.4, 'carbs' => 3.5, 'fat' => 0],
                ],
                'dinner' => [
                    ['food_name' => 'Phulka', 'name' => 'Whole Wheat Phulkas (2 pcs)', 'quantity' => 60, 'unit' => 'g', 'calories' => 170, 'protein' => 6.0, 'carbs' => 32, 'fat' => 1.0],
                    ['food_name' => 'Chana Dal', 'name' => 'Lauki Chana Dal Tadka', 'quantity' => 150, 'unit' => 'g', 'calories' => 160, 'protein' => 8.5, 'carbs' => 25, 'fat' => 3.0],
                    ['food_name' => 'Methi Sabzi (Fenugreek)', 'name' => 'Sautéed Methi Sabzi', 'quantity' => 100, 'unit' => 'g', 'calories' => 58, 'protein' => 3.5, 'carbs' => 5.0, 'fat' => 2.6],
                ]
            ],

            // Day 7: Plain Dosa with Sambhar, Paneer Tikka Thali, Roasted Makhana, Bajra Roti with Dal
            [
                'breakfast' => [
                    ['food_name' => 'Plain Dosa', 'name' => 'Crispy Plain Dosa', 'quantity' => 70, 'unit' => 'g', 'calories' => 135, 'protein' => 3.2, 'carbs' => 24, 'fat' => 3.0],
                    ['food_name' => 'Sambhar (South Indian)', 'name' => 'Homestyle Vegetable Sambhar', 'quantity' => 150, 'unit' => 'g', 'calories' => 103, 'protein' => 4.8, 'carbs' => 16.8, 'fat' => 1.8],
                ],
                'lunch' => [
                    ['food_name' => 'Phulka', 'name' => 'Whole Wheat Phulkas (2 pcs)', 'quantity' => 60, 'unit' => 'g', 'calories' => 170, 'protein' => 6.0, 'carbs' => 32, 'fat' => 1.0],
                    ['food_name' => $isVegan ? 'Tofu (Soya Paneer)' : 'Paneer (Raw / Grilled)', 'name' => $isVegan ? 'Tandoori Spiced Tofu' : 'Tawa Grilled Paneer Cubes', 'quantity' => 100, 'unit' => 'g', 'calories' => $isVegan ? 85 : 265, 'protein' => $isVegan ? 9.5 : 18.3, 'carbs' => $isVegan ? 2.1 : 3.2, 'fat' => $isVegan ? 4.5 : 20.8],
                    ['food_name' => 'Shimla Mirch (Capsicum)', 'name' => 'Spiced Capsicum Masala', 'quantity' => 100, 'unit' => 'g', 'calories' => 59, 'protein' => 1.6, 'carbs' => 5.6, 'fat' => 3.4],
                ],
                'snack' => [
                    ['food_name' => 'Khaman Dhokla (Steamed)', 'name' => 'Spongy Steamed Khaman Dhokla', 'quantity' => 70, 'unit' => 'g', 'calories' => 122, 'protein' => 4.5, 'carbs' => 19.2, 'fat' => 3.0],
                    ['food_name' => 'Tulsi Green Tea', 'name' => 'Refreshing Green Tea', 'quantity' => 200, 'unit' => 'ml', 'calories' => 2, 'protein' => 0, 'carbs' => 0.2, 'fat' => 0],
                ],
                'dinner' => [
                    ['food_name' => 'Bajra Roti (Pearl Millet)', 'name' => 'Nutritious Bajra Roti', 'quantity' => 45, 'unit' => 'g', 'calories' => 115, 'protein' => 3.5, 'carbs' => 21, 'fat' => 1.6],
                    ['food_name' => 'Yellow Moong Dal', 'name' => 'Light Yellow Moong Dal', 'quantity' => 150, 'unit' => 'g', 'calories' => 145, 'protein' => 9.2, 'carbs' => 22, 'fat' => 2.5],
                    ['food_name' => 'Karela Sabzi (Bitter Gourd)', 'name' => 'Anti-Diabetic Spiced Karela', 'quantity' => 100, 'unit' => 'g', 'calories' => 68, 'protein' => 2.5, 'carbs' => 6.5, 'fat' => 3.6],
                ]
            ],
        ];

        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $currentDate = \Carbon\Carbon::parse($startDate)->addDays($i)->toDateString();
            $template = $templates[$i % count($templates)];

            // Calculate total calories in raw template
            $rawTotalCals = 0;
            foreach ($template as $mItems) {
                foreach ($mItems as $it) {
                    $rawTotalCals += (float) ($it['calories'] ?? 0);
                }
            }

            $scale = $rawTotalCals > 0 ? ($target / $rawTotalCals) : 1.0;

            $scaledMeals = [];
            foreach ($template as $mealType => $mItems) {
                $scaledMeals[$mealType] = [];
                foreach ($mItems as $it) {
                    $scaledMeals[$mealType][] = [
                        'food_name' => $it['food_name'] ?? $it['name'],
                        'name'      => $it['name'],
                        'quantity'  => round(((float) $it['quantity']) * $scale, 1),
                        'unit'      => $it['unit'],
                        'calories'  => round(((float) $it['calories']) * $scale, 1),
                        'protein'   => round(((float) $it['protein']) * $scale, 1),
                        'carbs'     => round(((float) $it['carbs']) * $scale, 1),
                        'fat'       => round(((float) $it['fat']) * $scale, 1),
                    ];
                }
            }

            $days[] = [
                'day_number' => $i + 1,
                'date'       => $currentDate,
                'meals'      => $scaledMeals,
            ];
        }

        return ['days' => $days];
    }
}
