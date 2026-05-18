<?php

namespace App\Services;

use App\Models\UserBadge;
use App\Models\ProgressLog;
use App\Models\MealPlan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AchievementService
{
    public function checkAchievements($user)
    {
        $newBadges = [];

        // 1. Check for 7-day streak
        if (!$this->hasBadge($user, 'streak_7')) {
            if ($this->calculateStreak($user) >= 7) {
                $newBadges[] = $this->awardBadge($user, 'streak_7');
            }
        }

        // 2. Check for Starter (First Log)
        if (!$this->hasBadge($user, 'starter')) {
            if (ProgressLog::where('user_id', $user->id)->exists()) {
                $newBadges[] = $this->awardBadge($user, 'starter');
            }
        }

        // 3. Check for Culinary Explorer (5 Meal Plans)
        if (!$this->hasBadge($user, 'culinary_explorer')) {
            if (MealPlan::where('user_id', $user->id)->count() >= 5) {
                $newBadges[] = $this->awardBadge($user, 'culinary_explorer');
            }
        }

        return $newBadges;
    }

    public function calculateStreak($user)
    {
        $logs = ProgressLog::where('user_id', $user->id)
            ->where('date', '<=', Carbon::today()->toDateString())
            ->orderBy('date', 'desc')
            ->distinct()
            ->pluck('date')
            ->toArray();

        if (empty($logs)) return 0;

        $streak = 0;
        $currentDate = Carbon::today();

        // If no log today, check yesterday
        if ($logs[0] !== $currentDate->toDateString()) {
            $currentDate->subDay();
            if ($logs[0] !== $currentDate->toDateString()) {
                return 0; // Streak broken
            }
        }

        foreach ($logs as $logDate) {
            if ($logDate === $currentDate->toDateString()) {
                $streak++;
                $currentDate->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }

    private function hasBadge($user, $type)
    {
        return UserBadge::where('user_id', $user->id)
            ->where('badge_type', $type)
            ->exists();
    }

    private function awardBadge($user, $type)
    {
        return UserBadge::create([
            'user_id'    => $user->id,
            'badge_type' => $type,
            'earned_at'  => Carbon::now(),
        ]);
    }
}
