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
     * Get both current streak and longest streak ever for a user.
     */
    public function getStreakStats($user, ?string $clientDate = null): array
    {
        $userId = is_numeric($user) ? (int) $user : (int) $user->id;
        $allActiveDates = $this->getAllActiveDates($userId);

        if (empty($allActiveDates)) {
            return [
                'current_streak' => 0,
                'longest_streak' => 0,
                'streak'         => 0,
            ];
        }

        $activeDateSet = array_flip($allActiveDates);

        // Determine today and yesterday candidates across client local time, IST, and UTC
        $nowIST   = Carbon::now('Asia/Kolkata');
        $nowUTC   = Carbon::now('UTC');
        
        $todayCandidates = [];
        if ($clientDate && preg_match('/^\d{4}-\d{2}-\d{2}$/', $clientDate)) {
            $todayCandidates[] = $clientDate;
        }
        $todayCandidates[] = $nowIST->toDateString();
        $todayCandidates[] = $nowUTC->toDateString();
        $todayCandidates = array_values(array_unique($todayCandidates));

        $yesterdayCandidates = [];
        foreach ($todayCandidates as $tDate) {
            $yesterdayCandidates[] = Carbon::parse($tDate)->subDay()->toDateString();
        }
        $yesterdayCandidates = array_values(array_unique($yesterdayCandidates));

        // Find active start point for current streak
        $activeAnchorDate = null;
        foreach ($todayCandidates as $t) {
            if (isset($activeDateSet[$t])) {
                $activeAnchorDate = $t;
                break;
            }
        }

        if (!$activeAnchorDate) {
            foreach ($yesterdayCandidates as $y) {
                if (isset($activeDateSet[$y])) {
                    $activeAnchorDate = $y;
                    break;
                }
            }
        }

        $currentStreak = 0;
        if ($activeAnchorDate) {
            $cursor = Carbon::parse($activeAnchorDate);
            while (isset($activeDateSet[$cursor->toDateString()])) {
                $currentStreak++;
                $cursor->subDay();
            }
        }

        // Calculate Longest Streak Ever across historical sorted dates
        sort($allActiveDates);
        $longestStreak = 0;
        if (!empty($allActiveDates)) {
            $currentRun = 1;
            $longestStreak = 1;
            $count = count($allActiveDates);
            for ($i = 1; $i < $count; $i++) {
                try {
                    $prev = Carbon::createFromFormat('Y-m-d', $allActiveDates[$i - 1])->startOfDay();
                    $curr = Carbon::createFromFormat('Y-m-d', $allActiveDates[$i])->startOfDay();
                    $diff = $prev->diffInDays($curr);
                    if ($diff === 1) {
                        $currentRun++;
                        if ($currentRun > $longestStreak) {
                            $longestStreak = $currentRun;
                        }
                    } elseif ($diff > 1) {
                        $currentRun = 1;
                    }
                } catch (\Throwable $e) {
                    continue;
                }
            }
        }

        // Guarantee longest streak is never lower than current streak or earned badges
        $longestStreak = max($longestStreak, $currentStreak);

        $badgeBoosts = [
            'streak_30' => 30,
            'streak_14' => 14,
            'streak_7'  => 7,
        ];
        foreach ($badgeBoosts as $bType => $minVal) {
            if (UserBadge::where('user_id', $userId)->where('badge_type', $bType)->exists()) {
                $longestStreak = max($longestStreak, $minVal);
            }
        }

        return [
            'current_streak' => $currentStreak,
            'longest_streak' => $longestStreak,
            'streak'         => $currentStreak,
        ];
    }

    /**
     * Calculate consecutive logging streak (in days).
     */
    public function calculateStreak($user, ?string $clientDate = null): int
    {
        return $this->getStreakStats($user, $clientDate)['current_streak'];
    }

    /**
     * Calculate all-time longest streak (in days).
     */
    public function calculateLongestStreak($user, ?string $clientDate = null): int
    {
        return $this->getStreakStats($user, $clientDate)['longest_streak'];
    }

    /**
     * Collect and sanitize all unique active activity dates for a user.
     */
    private function getAllActiveDates(int $userId): array
    {
        $dates = [];

        // 1. Progress Logs date and created_at
        $progressDates = ProgressLog::where('user_id', $userId)
            ->pluck('date')
            ->map(fn($d) => $d instanceof Carbon ? $d->toDateString() : substr(trim((string) $d), 0, 10))
            ->toArray();
        $dates = array_merge($dates, $progressDates);

        $progressCreated = ProgressLog::where('user_id', $userId)
            ->pluck('created_at')
            ->flatMap(function ($dt) {
                if (!$dt) return [];
                return [
                    Carbon::parse($dt)->setTimezone('Asia/Kolkata')->toDateString(),
                    Carbon::parse($dt)->toDateString(),
                ];
            })
            ->toArray();
        $dates = array_merge($dates, $progressCreated);

        // 2. Consumed Meals in Meal Plans
        $mealDates = MealPlan::where('user_id', $userId)
            ->whereHas('mealItems', fn($q) => $q->where('is_consumed', true))
            ->pluck('date')
            ->map(fn($d) => $d instanceof Carbon ? $d->toDateString() : substr(trim((string) $d), 0, 10))
            ->toArray();
        $dates = array_merge($dates, $mealDates);

        // 3. Token Transactions (Daily Login, Workouts, Tracking)
        $tokenDates = \App\Models\TokenTransaction::where('user_id', $userId)
            ->pluck('created_at')
            ->flatMap(function ($dt) {
                if (!$dt) return [];
                return [
                    Carbon::parse($dt)->setTimezone('Asia/Kolkata')->toDateString(),
                    Carbon::parse($dt)->toDateString(),
                ];
            })
            ->toArray();
        $dates = array_merge($dates, $tokenDates);

        // 4. Meal Plans Created
        $planCreated = MealPlan::where('user_id', $userId)
            ->pluck('created_at')
            ->flatMap(function ($dt) {
                if (!$dt) return [];
                return [
                    Carbon::parse($dt)->setTimezone('Asia/Kolkata')->toDateString(),
                    Carbon::parse($dt)->toDateString(),
                ];
            })
            ->toArray();
        $dates = array_merge($dates, $planCreated);

        // 5. Badges Earned
        $badgeDates = UserBadge::where('user_id', $userId)
            ->pluck('earned_at')
            ->flatMap(function ($dt) {
                if (!$dt) return [];
                return [
                    Carbon::parse($dt)->setTimezone('Asia/Kolkata')->toDateString(),
                    Carbon::parse($dt)->toDateString(),
                ];
            })
            ->toArray();
        $dates = array_merge($dates, $badgeDates);

        // 6. User Account Registration
        $userCreatedAt = \App\Models\User::where('id', $userId)
            ->pluck('created_at')
            ->flatMap(function ($dt) {
                if (!$dt) return [];
                return [
                    Carbon::parse($dt)->setTimezone('Asia/Kolkata')->toDateString(),
                    Carbon::parse($dt)->toDateString(),
                ];
            })
            ->toArray();
        $dates = array_merge($dates, $userCreatedAt);

        // Filter valid YYYY-MM-DD strings only and deduplicate
        return array_values(array_unique(array_filter($dates, function ($d) {
            return is_string($d) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $d);
        })));
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

