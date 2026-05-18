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
     * Calculate calorie target based on goal.
     * Lose:     TDEE - 500  (0.5 kg/week deficit)
     * Gain:     TDEE + 300  (moderate surplus)
     * Maintain: TDEE
     */
    public function calculateCaloriesTarget(float $tdee, string $goal): float
    {
        return match ($goal) {
            'lose'     => round($tdee - 500, 2),
            'gain'     => round($tdee + 300, 2),
            default    => $tdee,
        };
    }

    /**
     * Calculate macro targets from calorie goal.
     * Protein: 30%, Carbs: 45%, Fat: 25%
     * Returns [protein_g, carbs_g, fat_g]
     */
    public function calculateMacros(float $calories, string $goal = 'maintain', string $dietType = 'standard'): array
    {
        if ($dietType === 'keto') {
            return [
                'protein_g' => round(($calories * 0.25) / 4, 1),
                'carbs_g'   => round(($calories * 0.05) / 4, 1),
                'fat_g'     => round(($calories * 0.70) / 9, 1),
            ];
        }

        if ($dietType === 'paleo') {
            return [
                'protein_g' => round(($calories * 0.35) / 4, 1),
                'carbs_g'   => round(($calories * 0.25) / 4, 1),
                'fat_g'     => round(($calories * 0.40) / 9, 1),
            ];
        }

        // High-protein for muscle gain
        $proteinPct = $goal === 'gain' ? 0.35 : 0.30;
        $carbsPct   = $goal === 'lose' ? 0.40 : 0.45;
        $fatPct     = 1 - $proteinPct - $carbsPct;

        return [
            'protein_g' => round(($calories * $proteinPct) / 4, 1), // 4 kcal per gram
            'carbs_g'   => round(($calories * $carbsPct)   / 4, 1),
            'fat_g'     => round(($calories * $fatPct)     / 9, 1), // 9 kcal per gram
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
