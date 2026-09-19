<?php

namespace App\Services;

class HealthCalculatorService
{
    /**
     * Activity level multipliers (Harris-Benedict / WHO standard).
     */
    const ACTIVITY_MULTIPLIERS = [
        'sedentary'  => 1.2,
        'light'      => 1.375,
        'moderate'   => 1.55,
        'active'     => 1.725,
        'very_active'=> 1.9,
    ];

    /**
     * Calculate BMI.
     * Formula: weight(kg) / height(m)²
     */
    public function calculateBMI(float $weight, float $height_cm): float
    {
        $height_m = $height_cm / 100;
        return round($weight / ($height_m * $height_m), 2);
    }

    /**
     * Get BMI classification.
     */
    public function getBMIClassification(float $bmi): string
    {
        if ($bmi < 18.5) return 'Underweight';
        if ($bmi < 25.0) return 'Normal weight';
        if ($bmi < 30.0) return 'Overweight';
        return 'Obese';
    }

    /**
     * Calculate BMR using Mifflin-St Jeor Equation.
     * Male:   10 × weight + 6.25 × height - 5 × age + 5
     * Female: 10 × weight + 6.25 × height - 5 × age - 161
     */
    public function calculateBMR(float $weight, float $height_cm, int $age, string $gender): float
    {
        $base = (10 * $weight) + (6.25 * $height_cm) - (5 * $age);
        return round($gender === 'male' ? $base + 5 : $base - 161, 2);
    }

    /**
     * Calculate TDEE (Total Daily Energy Expenditure).
     * TDEE = BMR × activity_multiplier
     */
    public function calculateTDEE(float $bmr, string $activity_level): float
    {
        $multiplier = self::ACTIVITY_MULTIPLIERS[$activity_level] ?? 1.2;
        return round($bmr * $multiplier, 2);
    }

    /**
     * Calculate calorie target based on goal and safe metabolic floors.
     * Lose:     TDEE - 500  (0.5 kg/week deficit)
     * Gain:     TDEE + 300  (moderate surplus)
     * Maintain: TDEE
     * Safe floor: min 1200 kcal (female/other), min 1500 kcal (male)
     */
    public function calculateCaloriesTarget(float $tdee, string $goal, ?string $gender = 'male'): float
    {
        $rawTarget = match ($goal) {
            'lose'     => $tdee - 500,
            'gain'     => $tdee + 300,
            default    => $tdee,
        };

        $minFloor = ($gender === 'female') ? 1200.0 : 1500.0;
        return round(max($rawTarget, $minFloor), 2);
    }

    /**
     * Calculate macro targets scientifically scaled to body weight and clinical goals.
     * Standard Sports Nutrition guidelines (ISSN / ACSM / ICMR):
     * - Protein:
     *   - Lose (deficit): 1.8g - 2.0g / kg (to preserve lean muscle mass)
     *   - Gain (surplus): 1.8g - 2.2g / kg (to optimize muscle protein synthesis)
     *   - Maintain: 1.4g - 1.6g / kg
     * - Fat: 0.8g - 1.0g / kg (hormonal health & essential fatty acids, min 35g)
     * - Carbs: Balances the remaining calorie pool: (Calories - (Protein*4 + Fat*9)) / 4
     *
     * Returns ['protein_g', 'carbs_g', 'fat_g']
     */
    public function calculateMacros(
        float $calories,
        string $goal = 'maintain',
        string $dietType = 'standard',
        ?float $weightKg = null,
        ?string $gender = null
    ): array {
        // 1. Specialized Diets (Keto / Paleo)
        if ($dietType === 'keto') {
            $fatG = round(($calories * 0.70) / 9, 1);
            $proteinG = round(($calories * 0.25) / 4, 1);
            $carbsG = round(($calories * 0.05) / 4, 1);
            return [
                'protein_g' => $proteinG,
                'carbs_g'   => $carbsG,
                'fat_g'     => $fatG,
            ];
        }

        if ($dietType === 'paleo') {
            $proteinG = round(($calories * 0.35) / 4, 1);
            $fatG = round(($calories * 0.35) / 9, 1);
            $carbsG = round(($calories * 0.30) / 4, 1);
            return [
                'protein_g' => $proteinG,
                'carbs_g'   => $carbsG,
                'fat_g'     => $fatG,
            ];
        }

        // 2. Standard & Preference Diets (Veg, Non-Veg, Vegan, Jain, Standard)
        // If body weight is provided, use gold-standard g/kg bodyweight formulation
        $effectiveWeight = ($weightKg && $weightKg > 20) ? $weightKg : round($calories / 30, 1);

        // Protein per kg determination
        $proteinPerKg = match ($goal) {
            'lose' => 1.8,     // Higher protein during caloric deficit to preserve lean mass
            'gain' => 2.0,     // Optimal for muscle protein synthesis
            default => 1.5,    // Healthy maintenance
        };

        $proteinG = $effectiveWeight * $proteinPerKg;
        // Clamp protein calories between 15% and 35% of total calories
        $minProteinG = ($calories * 0.15) / 4;
        $maxProteinG = ($calories * 0.35) / 4;
        $proteinG = max($minProteinG, min($maxProteinG, $proteinG));

        // Fat determination: 0.8g - 1.0g per kg of bodyweight, bounded by 20% - 30% of total calories
        $fatG = $effectiveWeight * 0.9;
        $minFatG = max(35.0, ($calories * 0.20) / 9);
        $maxFatG = ($calories * 0.30) / 9;
        $fatG = max($minFatG, min($maxFatG, $fatG));

        // Carbs fulfill the remaining caloric balance
        $proteinCals = $proteinG * 4;
        $fatCals = $fatG * 9;
        $remainingCals = max(0, $calories - ($proteinCals + $fatCals));
        $carbsG = max(30.0, $remainingCals / 4);

        return [
            'protein_g' => round($proteinG, 1),
            'carbs_g'   => round($carbsG, 1),
            'fat_g'     => round($fatG, 1),
        ];
    }

    /**
     * Calculate recommended daily water intake in liters.
     * Formula: weight(kg) × 0.033
     */
    public function calculateWaterIntake(float $weight): float
    {
        return round($weight * 0.033, 2);
    }

    /**
     * Calculate ideal weight range using Devine Formula.
     */
    public function calculateIdealWeightRange(float $height_cm, string $gender): array
    {
        $effectiveHeightCm = max($height_cm, 152.4); // Clamp to 5ft for the formula base
        $height_in = ($effectiveHeightCm - 152.4) / 2.54;
        $base = $gender === 'male' ? 50.0 : 45.5;
        $ideal = $base + (2.3 * $height_in);

        return [
            'min' => round(max($ideal - 5, 40), 1),
            'max' => round(max($ideal + 5, 45), 1),
        ];
    }
}
