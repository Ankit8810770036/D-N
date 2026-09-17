<?php

namespace App\Services;

use App\Models\UserBadge;
use App\Models\ProgressLog;
use App\Models\MealPlan;
use App\Services\TokenService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AchievementService
{
    /**
     * Check and award any newly unlocked achievements/badges for the user.
     */
    public function checkAchievements($user): array
    {
        $newBadges = [];
        $tokens    = app(TokenService::class);
        $streak    = $this->calculateStreak($user);

        // Fetch all existing earned badge types in ONE single indexed query
        $earnedBadgeTypes = UserBadge::where('user_id', $user->id)
            ->pluck('badge_type')
            ->flip()
            ->toArray();

        // 1. Starter Badge (First Log Created)
        if (!isset($earnedBadgeTypes['starter'])) {
            if (ProgressLog::where('user_id', $user->id)->exists()) {
                $newBadges[] = $this->awardBadge($user, 'starter');
                $earnedBadgeTypes['starter'] = true;
            }
        }

        // 2. 7-Day Streak Badge + 50 HealthCoins
        if (!isset($earnedBadgeTypes['streak_7'])) {
            if ($streak >= 7) {
                $newBadges[] = $this->awardBadge($user, 'streak_7');
                $tokens->award($user, 'streak_7', 50, ['streak' => $streak]);
                $earnedBadgeTypes['streak_7'] = true;
            }
        }

        // 3. 14-Day Streak Badge + 100 HealthCoins
        if (!isset($earnedBadgeTypes['streak_14'])) {
            if ($streak >= 14) {
                $newBadges[] = $this->awardBadge($user, 'streak_14');
                $tokens->award($user, 'streak_14', 100, ['streak' => $streak]);
                $earnedBadgeTypes['streak_14'] = true;
            }
        }

        // 4. 30-Day Streak Badge + 200 HealthCoins
        if (!isset($earnedBadgeTypes['streak_30'])) {
            if ($streak >= 30) {
                $newBadges[] = $this->awardBadge($user, 'streak_30');
                $tokens->award($user, 'streak_30', 200, ['streak' => $streak]);
                $earnedBadgeTypes['streak_30'] = true;
            }
        }

        // 5. Culinary Explorer Badge (5+ Meal Plans Created)
        if (!isset($earnedBadgeTypes['culinary_explorer'])) {
            if (MealPlan::where('user_id', $user->id)->count() >= 5) {
                $newBadges[] = $this->awardBadge($user, 'culinary_explorer');
                $earnedBadgeTypes['culinary_explorer'] = true;
            }
        }

        // 6. Water Champion Badge (Logged >= 2.0L water on 3+ distinct days)
        if (!isset($earnedBadgeTypes['water_champion'])) {
            $waterDays = ProgressLog::where('user_id', $user->id)
                ->where('water_intake_liters', '>=', 2.0)
                ->count();
            if ($waterDays >= 3) {
                $newBadges[] = $this->awardBadge($user, 'water_champion');
                $earnedBadgeTypes['water_champion'] = true;
            }
        }

        // 7. Goal Reached Badge (Target weight reached or within 0.5 kg)
        if (!isset($earnedBadgeTypes['goal_reached'])) {
            $profile = $user->profile;
            if ($profile && $profile->weight_kg) {
                $latestWeight = ProgressLog::where('user_id', $user->id)
                    ->whereNotNull('weight')
                    ->latest('date')
                    ->value('weight');

                if ($latestWeight) {
                    $diff = abs((float) $latestWeight - (float) $profile->weight_kg);
                    if ($diff <= 0.5 && ProgressLog::where('user_id', $user->id)->count() >= 3) {
                        $newBadges[] = $this->awardBadge($user, 'goal_reached');
                    }
                }
            }
        }

        return $newBadges;
    }

    /**
     * Calculate consecutive logging streak (in days) using local IST calendar dates.
     * Considers Progress Logs, Consumed Meals, and Token Actions (Logins, Tracking, Workouts).
     */
    public function calculateStreak($user): int
    {
        $userId = is_numeric($user) ? $user : $user->id;

        // 1. Dates from Progress Logs
        $progressDates = ProgressLog::where('user_id', $userId)
            ->pluck('date')
            ->map(function ($d) {
                return $d instanceof Carbon ? $d->toDateString() : substr((string) $d, 0, 10);
            })
            ->toArray();

        // 2. Dates from Consumed Meals in Meal Plans
        $mealDates = MealPlan::where('user_id', $userId)
            ->whereHas('mealItems', function ($q) {
                $q->where('is_consumed', true);
            })
            ->pluck('date')
            ->map(function ($d) {
                return $d instanceof Carbon ? $d->toDateString() : substr((string) $d, 0, 10);
            })
            ->toArray();

        // 3. Dates from Token Transactions (Daily Login, Workouts, Meals, Tracking)
        $tokenDates = \App\Models\TokenTransaction::where('user_id', $userId)
            ->pluck('created_at')
            ->map(function ($dt) {
                return Carbon::parse($dt)->setTimezone('Asia/Kolkata')->toDateString();
            })
            ->toArray();

        // 4. Dates from Meal Plans Created
        $planCreatedDates = MealPlan::where('user_id', $userId)
            ->pluck('created_at')
            ->map(function ($dt) {
                return Carbon::parse($dt)->setTimezone('Asia/Kolkata')->toDateString();
            })
            ->toArray();

        // 5. Date of User Registration (first active day)
        $userCreatedAt = \App\Models\User::where('id', $userId)
            ->pluck('created_at')
            ->map(function ($dt) {
                return Carbon::parse($dt)->setTimezone('Asia/Kolkata')->toDateString();
            })
            ->toArray();

        // Merge, clean, and deduplicate all active dates
        $allActiveDates = array_values(array_unique(array_filter(
            array_merge($progressDates, $mealDates, $tokenDates, $planCreatedDates, $userCreatedAt)
        )));

        if (empty($allActiveDates)) {
            return 0;
        }

        $nowIST       = Carbon::now('Asia/Kolkata');
        $todayStr     = $nowIST->toDateString();
        $yesterdayStr = $nowIST->copy()->subDay()->toDateString();

        $activeDateSet = array_flip($allActiveDates);

        // If neither today nor yesterday has any activity, the streak has lapsed
        $hasToday     = isset($activeDateSet[$todayStr]);
        $hasYesterday = isset($activeDateSet[$yesterdayStr]);

        if (!$hasToday && !$hasYesterday) {
            return 0;
        }

        $streak = 0;
        $cursor = $hasToday ? $nowIST->copy() : $nowIST->copy()->subDay();

        while (isset($activeDateSet[$cursor->toDateString()])) {
            $streak++;
            $cursor->subDay();
        }

        return $streak;
    }

    private function hasBadge($user, string $type): bool
    {
        return UserBadge::where('user_id', $user->id)
            ->where('badge_type', $type)
            ->exists();
    }

    private function awardBadge($user, string $type): UserBadge
    {
        return UserBadge::create([
            'user_id'    => $user->id,
            'badge_type' => $type,
            'earned_at'  => Carbon::now('Asia/Kolkata'),
        ]);
    }
}

