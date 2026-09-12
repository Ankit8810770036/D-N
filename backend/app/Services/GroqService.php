<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class GroqService
{
    private string $apiKey;
    private string $systemPrompt;

    public function __construct()
    {
        // Always read from config(), never env() directly — config is cached in production
        $this->apiKey = config('services.groq.key', '');
        $this->systemPrompt = "You are an expert Diet and Nutrition Planner assistant integrated into a health app. Provide helpful, encouraging, and concise answers to health and nutrition questions. Tailor advice to the user's profile when provided. Use formatting like **bold text** and bullet points to make responses readable and engaging. Keep responses under 300 words. If a question is entirely unrelated to health, diet, or nutrition, politely redirect the conversation back to these topics.";
    }

    public function isConfigured(): bool
    {
        // Actually check the key — was always returning true before
        return !empty($this->apiKey);
    }

    /**
     * Sends a message to the Groq AI API (Llama 3.3 70B).
     *
     * @param array $parts   Array of message parts (text / inline_data)
     * @param string|null $customSystemInstruction  Optional personalized system context
     * @return string|null The chat reply, or null on failure.
     */
    public function generateContent(array $parts, ?string $customSystemInstruction = null): ?string
    {
        if (empty($this->apiKey)) {
            return $this->getFallbackResponse($parts);
        }

        // Build the user message text from parts
        $userText = '';
        foreach ($parts as $part) {
            if (isset($part['text'])) {
                $userText .= $part['text'] . ' ';
            }
        }
        $userText = trim($userText);

        if (empty($userText)) {
            $userText = 'I have uploaded a food image. Please estimate the calories and nutritional information.';
        }

        $systemContent = $customSystemInstruction ?? $this->systemPrompt;

        try {
            $response = Http::withoutVerifying()
                ->timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type'  => 'application/json',
                ])
                ->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model'       => 'llama-3.3-70b-versatile',
                    'messages'    => [
                        ['role' => 'system', 'content' => $systemContent],
                        ['role' => 'user',   'content' => $userText],
                    ],
                    'temperature' => 0.7,
                    'max_tokens'  => 512,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['choices'][0]['message']['content'] ?? $this->getFallbackResponse($parts);
            }

            // Rate-limited — use intelligent fallback
            if ($response->status() === 429) {
                Log::warning('Groq API rate limited — using fallback response.');
                return $this->getFallbackResponse($parts);
            }

            Log::error('Groq API Error (' . $response->status() . '): ' . $response->body());
            return $this->getFallbackResponse($parts);

        } catch (Exception $e) {
            Log::error('AI Service Exception: ' . $e->getMessage());
            return $this->getFallbackResponse($parts);
        }
    }

    /**
     * Returns a smart, keyword-aware fallback response when the API is unavailable.
     */
    private function getFallbackResponse(array $parts): string
    {
        $userText = '';
        foreach ($parts as $part) {
            if (isset($part['text'])) {
                $userText = strtolower($part['text']);
                break;
            }
        }

        if (str_contains($userText, 'calori') || str_contains($userText, 'kcal')) {
            return "**Calorie Guidance** 🔥\n\nYour daily calorie needs depend on your goal:\n- **Lose weight:** Eat 300–500 kcal below your TDEE\n- **Maintain:** Match your TDEE exactly\n- **Gain muscle:** Eat 200–300 kcal above your TDEE\n\nYour TDEE is already calculated in your health profile. Head to your **Diet Planner** to auto-generate a meal plan perfectly calibrated to your calorie target!";
        }

        if (str_contains($userText, 'protein') || str_contains($userText, 'muscle') || str_contains($userText, 'gym')) {
            return "**Protein & Muscle Building** 💪\n\n**Recommended daily intake:**\n- Sedentary: 0.8g per kg\n- Active/gym: 1.6–2.2g per kg\n- Building muscle: up to 2.5g per kg\n\n**Best sources:**\n- **Veg:** Paneer (18g/100g), Chickpeas (15g/100g), Lentils (9g/100g)\n- **Non-veg:** Chicken breast (31g/100g), Eggs (13g/100g), Fish (22g/100g)\n\nTrack your intake in the **Progress Tracker**!";
        }

        if (str_contains($userText, 'weight loss') || str_contains($userText, 'lose weight') || str_contains($userText, 'fat')) {
            return "**Weight Loss Strategy** ⬇️\n\n1. **Caloric deficit** — 300–500 kcal below TDEE\n2. **High protein** — Preserves muscle (1.8–2g/kg)\n3. **Fiber-rich foods** — Oats, vegetables, legumes keep you full\n4. **Hydration** — 2.5–3L water daily\n5. **Strength training** — Boosts metabolism\n\nSet your goal to \"Lose Weight\" in your profile and use the **AI Meal Planner** for a customized plan!";
        }

        if (str_contains($userText, 'water') || str_contains($userText, 'hydrat')) {
            return "**Hydration Guide** 💧\n\n**Formula: 35ml × body weight (kg) per day**\n\n- 60kg → ~2.1L/day\n- 70kg → ~2.5L/day\n- 80kg → ~2.8L/day\n\n**Tips:** Start mornings with a full glass, drink before each meal, and track water in the **Progress Tracker**!";
        }

        if (str_contains($userText, 'breakfast') || str_contains($userText, 'morning')) {
            return "**Healthy Breakfast Ideas** 🌅\n\nBalance protein + complex carbs + healthy fats:\n\n- **Oats + banana + nuts** (~350 kcal)\n- **Eggs + whole wheat toast** (~400 kcal)\n- **Greek yogurt + berries** (~280 kcal)\n- **Poha + peanuts** (~250 kcal)\n- **Paneer paratha + curd** (~420 kcal)\n\nYour **Diet Planner** auto-generates a personalized breakfast for you!";
        }

        if (str_contains($userText, 'diabetes') || str_contains($userText, 'sugar')) {
            return "**Diabetes & Blood Sugar** 🩺\n\n**Low-GI foods to favour:**\n- Oats, brown rice, quinoa, barley\n- Lentils, chickpeas, kidney beans\n- Leafy vegetables, nuts, seeds\n\n**Foods to limit:**\n- White rice, white bread, sugary drinks\n- Processed snacks, maida-based items\n\nThe app auto-filters low-GI foods when you select 'Diabetes' in your health profile!";
        }

        if (str_contains($userText, 'bmi') || str_contains($userText, 'body mass')) {
            return "**BMI Calculator** ⚖️\n\n**BMI = Weight(kg) ÷ Height(m)²**\n\n| BMI | Category |\n|-----|----------|\n| < 18.5 | Underweight |\n| 18.5–24.9 | ✅ Normal |\n| 25–29.9 | Overweight |\n| ≥ 30 | Obese |\n\nYour BMI is auto-calculated on the **Health Profile** page!";
        }

        if (str_contains($userText, 'sleep') || str_contains($userText, 'rest')) {
            return "**Sleep & Nutrition** 😴\n\nPoor sleep raises hunger hormones (ghrelin) by ~24% and triggers sugar cravings.\n\n**Sleep-friendly foods:**\n- Almonds, walnuts (melatonin)\n- Bananas (magnesium + tryptophan)\n- Warm milk, chamomile tea\n\n**Target:** 7–9 hours/night. Log sleep hours in the **Progress Tracker**!";
        }

        if (str_contains($userText, 'supplement') || str_contains($userText, 'vitamin') || str_contains($userText, 'whey')) {
            return "**Supplements Guide** 💊\n\n- **Whey protein** — 20–25g post-workout\n- **Vitamin D3** — 1000–2000 IU/day\n- **Omega-3** — heart health & inflammation\n- **Magnesium** — sleep and muscle recovery\n- **B12** — essential for vegetarians/vegans\n\nFood first, supplements second! Consult a doctor before starting.";
        }

        $defaults = [
            "**AI Nutrition Assistant** 🥗\n\nI can help you with:\n- **Calorie & macro guidance** for your goals\n- **Meal planning** tips and food suggestions\n- **Weight management** strategies\n- **Condition-specific** advice (diabetes, hypertension)\n- **Hydration** and sleep tips\n- **Supplement** recommendations\n\nHead to the **Diet Planner** to generate your personalized meal plan, or ask me anything specific!",

            "**Here to help!** 💪\n\nThe best steps for your health goals:\n\n1. **Follow your meal plan** from the Diet Planner\n2. **Log daily** in the Progress Tracker\n3. **Stay hydrated** — 2.5L water/day\n4. **Hit your calorie target** shown on the Dashboard\n\nConsistency is everything — even 7 days builds a powerful streak! 🔥",

            "**Nutrition Fundamentals** 🌱\n\n- **Eat whole foods** — less processing, more nutrients\n- **Balance macros** — protein, carbs, and healthy fats\n- **Don't skip meals** — leads to overeating later\n- **80/20 rule** — eat healthy 80%, enjoy treats 20%\n\nUse the **Diet Planner** for your AI-generated meal plan and **Progress** to track your trends!",
        ];

        return $defaults[array_rand($defaults)];
    }
}
