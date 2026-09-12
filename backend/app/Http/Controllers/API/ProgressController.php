<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ProgressLog;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ProgressController extends Controller
{
    public function logProgress(Request $request)
    {
        $validated = $request->validate([
            'date'                 => 'nullable|date',
            'weight'               => 'nullable|numeric|min:0',
            'calories_consumed'    => 'nullable|numeric|min:0',
            'protein'              => 'nullable|numeric|min:0',
            'carbs'                => 'nullable|numeric|min:0',
            'fat'                  => 'nullable|numeric|min:0',
            'water_intake_liters'  => 'nullable|numeric|min:0',
            'steps'                => 'nullable|integer|min:0',
            'sleep_hours'          => 'nullable|numeric|min:0|max:24',
            'workout_done'         => 'nullable|boolean',
            'notes'                => 'nullable|string|max:500',
        ]);

        $date = $validated['date'] ?? Carbon::today()->toDateString();
        $user = $request->user();

        $log = ProgressLog::updateOrCreate(
            ['user_id' => $user->id, 'date' => $date],
            array_merge($validated, ['date' => $date])
        );

        // ── Award HealthCoins ──────────────────────────────────────────────────
        $tokens = app(TokenService::class);

        // +10 for logging progress today
        $tokens->award($user, 'progress_logged', null, ['date' => $date]);

        // +15 if workout done
        if (!empty($validated['workout_done'])) {
            $tokens->award($user, 'workout_logged', null, ['date' => $date]);
        }

        // +10 if calories consumed within 10% of target
        $caloriesConsumed = $validated['calories_consumed'] ?? null;
        $caloriesTarget   = $user->profile?->calories_target;
        if ($caloriesConsumed && $caloriesTarget && $caloriesTarget > 0) {
            $pct = abs($caloriesConsumed - $caloriesTarget) / $caloriesTarget;
            if ($pct <= 0.10) {
                $tokens->award($user, 'calorie_hit', null, [
                    'date'             => $date,
                    'consumed'         => $caloriesConsumed,
                    'target'           => $caloriesTarget,
                ]);
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        $newBadges = app(\App\Services\AchievementService::class)->checkAchievements($user);

        // ── Dynamic Calorie Recalibration Check (±2 kg difference) ─────────
        $recalibration = null;
        $profile = $user->profile;
        if (!empty($validated['weight']) && $profile && $profile->weight_kg) {
            $currentProfileWeight = (float) $profile->weight_kg;
            $newWeight            = (float) $validated['weight'];
            $diff                 = round($newWeight - $currentProfileWeight, 2);

            if (abs($diff) >= 2.0) {
                $calculator = app(\App\Services\HealthCalculatorService::class);
                $newBmr    = $calculator->calculateBMR($newWeight, (float) $profile->height_cm, (int) $profile->age, $profile->gender);
                $newTdee   = $calculator->calculateTDEE($newBmr, $profile->activity_level);
                $newTarget = $calculator->calculateCaloriesTarget($newTdee, $profile->goal);

                $direction = $diff < 0 ? 'lost' : 'gained';
                $absDiff   = abs($diff);
                $message   = $diff < 0
                    ? "Great job! You've lost {$absDiff} kg. Would you like to recalibrate your TDEE and calorie targets for optimal progress?"
                    : "Notice: Your weight has changed by +{$absDiff} kg. Would you like to recalibrate your TDEE and calorie targets?";

                $recalibration = [
                    'needed'      => true,
                    'direction'   => $direction,
                    'diff_kg'     => $diff,
                    'abs_diff_kg' => $absDiff,
                    'old_weight'  => $currentProfileWeight,
                    'new_weight'  => $newWeight,
                    'old_bmr'     => (float) $profile->bmr,
                    'new_bmr'     => $newBmr,
                    'old_tdee'    => (float) $profile->tdee,
                    'new_tdee'    => $newTdee,
                    'old_target'  => (float) $profile->calories_target,
                    'new_target'  => $newTarget,
                    'message'     => $message,
                ];
            }
        }
        // ───────────────────────────────────────────────────────────────────

        return response()->json([
            'message'              => 'Progress logged successfully',
            'log'                  => $log,
            'new_badges'           => $newBadges,
            'token_balance'        => $tokens->getBalance($user),
            'recalibration_prompt' => $recalibration,
        ], 201);
    }

    public function analytics(Request $request)
    {
        $user = $request->user();
        $days = $request->input('days', 30);

        $logsQuery = ProgressLog::where('user_id', $user->id)
            ->where('date', '>=', Carbon::today()->subDays($days))
            ->orderBy('date', 'asc');

        $columns = ['date', 'weight', 'calories_consumed', 'water_intake_liters', 'steps', 'sleep_hours', 'workout_done'];

        if ($user->isPremium()) {
            $columns = array_merge($columns, ['protein', 'carbs', 'fat']);
        }

        $logs = $logsQuery->get($columns);

        // Calculate summary stats
        $weights  = $logs->whereNotNull('weight')->pluck('weight');
        $calories = $logs->whereNotNull('calories_consumed')->pluck('calories_consumed');

        // Fall back to health profile weight if no weight logs exist yet
        $profile       = $user->profile;
        $profileWeight = $profile?->weight_kg ? (float) $profile->weight_kg : null;

        $weightStart  = $weights->first()  ?? $profileWeight;
        $weightLatest = $weights->last()   ?? $profileWeight;
        $weightChange = $weights->count() >= 2
            ? round($weights->last() - $weights->first(), 2)
            : null;

        // All-time workout day count (more useful than just 30-day window)
        $totalWorkoutDays = ProgressLog::where('user_id', $user->id)
            ->where('workout_done', true)
            ->count();

        // Check if latest weight triggers recalibration prompt (±2kg vs profile calibrated weight)
        $recalibrationPrompt = null;
        if ($weightLatest && $profileWeight && $profile) {
            $diff = round($weightLatest - $profileWeight, 2);
            if (abs($diff) >= 2.0) {
                $calculator = app(\App\Services\HealthCalculatorService::class);
                $newBmr    = $calculator->calculateBMR((float) $weightLatest, (float) $profile->height_cm, (int) $profile->age, $profile->gender);
                $newTdee   = $calculator->calculateTDEE($newBmr, $profile->activity_level);
                $newTarget = $calculator->calculateCaloriesTarget($newTdee, $profile->goal);

                $direction = $diff < 0 ? 'lost' : 'gained';
                $absDiff   = abs($diff);
                $message   = $diff < 0
                    ? "Great job! You've lost {$absDiff} kg. Would you like to recalibrate your TDEE and calorie targets for optimal progress?"
                    : "Notice: Your weight has changed by +{$absDiff} kg. Would you like to recalibrate your TDEE and calorie targets?";

                $recalibrationPrompt = [
                    'needed'      => true,
                    'direction'   => $direction,
                    'diff_kg'     => $diff,
                    'abs_diff_kg' => $absDiff,
                    'old_weight'  => $profileWeight,
                    'new_weight'  => $weightLatest,
                    'old_bmr'     => (float) $profile->bmr,
                    'new_bmr'     => $newBmr,
                    'old_tdee'    => (float) $profile->tdee,
                    'new_tdee'    => $newTdee,
                    'old_target'  => (float) $profile->calories_target,
                    'new_target'  => $newTarget,
                    'message'     => $message,
                ];
            }
        }

        $summary = [
            'weight_start'         => $weightStart,
            'weight_latest'        => $weightLatest,
            'weight_change'        => $weightChange,
            'avg_calories'         => $calories->count() > 0 ? round($calories->avg(), 1) : null,
            'avg_steps'            => round($logs->whereNotNull('steps')->avg('steps') ?? 0),
            'workout_days'         => $logs->where('workout_done', true)->count(),   // last N days
            'total_workout_days'   => $totalWorkoutDays,                             // all-time
            'has_weight_logs'      => $weights->count() > 0,                        // so frontend knows if it's a profile fallback
            'profile_weight'       => $profileWeight,
            'recalibration_prompt' => $recalibrationPrompt,
        ];

        return response()->json([
            'logs'    => $logs,
            'summary' => $summary,
            'period'  => "{$days} days",
        ]);
    }
}
