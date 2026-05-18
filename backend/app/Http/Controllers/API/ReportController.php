<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MealPlan;
use App\Models\ProgressLog;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function downloadPDF(Request $request)
    {
        $user    = $request->user()->load('profile');
        $date    = $request->input('date', Carbon::today()->toDateString());

        $plan = MealPlan::where('user_id', $user->id)
            ->where('date', $date)
            ->with('mealItems.food')
            ->first();

        $recentLogs = ProgressLog::where('user_id', $user->id)
            ->orderBy('date', 'desc')
            ->take(7)
            ->get();

        $pdf = Pdf::loadView('reports.diet_report', compact('user', 'plan', 'date', 'recentLogs'));

        return $pdf->download("diet_report_{$date}.pdf");
    }

    public function summary(Request $request, \App\Services\AchievementService $achievementService)
    {
        $user    = $request->user()->load('profile');
        $profile = $user->profile;

        $totalPlans    = MealPlan::where('user_id', $user->id)->count();
        $totalLogs     = ProgressLog::where('user_id', $user->id)->count();
        $workoutDays   = ProgressLog::where('user_id', $user->id)->where('workout_done', true)->count();
        $latestLog     = ProgressLog::where('user_id', $user->id)->latest('date')->first();

        $streak = $achievementService->calculateStreak($user);
        $badges = \App\Models\UserBadge::where('user_id', $user->id)
            ->orderBy('earned_at', 'desc')
            ->get();

        return response()->json([
            'user'           => $user->only('name', 'email'),
            'profile'        => $profile,
            'stats'          => [
                'total_plans_generated' => $totalPlans,
                'total_logs'            => $totalLogs,
                'workout_days'          => $workoutDays,
                'latest_weight'         => $latestLog?->weight,
                'latest_log_date'       => $latestLog?->date,
                'streak'                => $streak,
            ],
            'badges'         => $badges,
        ]);
    }
}
