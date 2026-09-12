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

    public function downloadGroceryPDF(Request $request)
    {
        $user     = $request->user()->load('profile');
        $todayStr = $request->input('date', Carbon::today()->toDateString());
        
        $today = Carbon::parse($todayStr)->toDateString();
        $end   = Carbon::parse($todayStr)->addDays(7)->toDateString();

        $plans = MealPlan::where('user_id', $user->id)
            ->whereBetween('date', [$today, $end])
            ->orderBy('date')
            ->with(['mealItems.food', 'mealItems.recipe.ingredients.food'])
            ->get();

        $groceries = [];
        foreach ($plans as $plan) {
            foreach ($plan->mealItems as $item) {
                if ($item->recipe) {
                    foreach ($item->recipe->ingredients as $ri) {
                        $foodId = $ri->food_id;
                        if (!isset($groceries[$foodId])) {
                            $groceries[$foodId] = [
                                'name'           => $ri->food->name ?? 'Unknown',
                                'category'       => $ri->food->category ?? 'other',
                                'unit'           => $ri->unit,
                                'total_quantity' => 0,
                                'is_bought'      => (bool) $item->is_bought,
                            ];
                        }
                        $groceries[$foodId]['total_quantity'] += (float) $ri->quantity;
                    }
                } elseif ($item->food_id) {
                    $foodId = $item->food_id;
                    if (!isset($groceries[$foodId])) {
                        $groceries[$foodId] = [
                            'name'           => $item->food->name ?? 'Unknown',
                            'category'       => $item->food->category ?? 'other',
                            'unit'           => $item->unit,
                            'total_quantity' => 0,
                            'is_bought'      => (bool) $item->is_bought,
                        ];
                    }
                    $groceries[$foodId]['total_quantity'] += (float) $item->quantity;
                }
            }
        }

        $list = array_values($groceries);
        usort($list, fn($a, $b) => strcmp($a['name'], $b['name']));

        // Group by category
        $grouped = [];
        foreach ($list as $item) {
            $cat = ucfirst(strtolower($item['category'] ?? 'Other'));
            $grouped[$cat][] = $item;
        }

        $dateRange = $plans->count() > 0
            ? Carbon::parse($plans->first()->date)->format('M j') . ' – ' . Carbon::parse($plans->last()->date)->format('M j, Y')
            : Carbon::parse($today)->format('M j, Y');

        $daysFound = $plans->count();

        $pdf = Pdf::loadView('reports.grocery_report', compact('user', 'grouped', 'list', 'plans', 'dateRange', 'daysFound', 'todayStr'));

        return $pdf->download("grocery_shopping_list_{$todayStr}.pdf");
    }

    public function summary(Request $request, \App\Services\AchievementService $achievementService)
    {
        $user    = $request->user()->load('profile');
        $profile = $user->profile;

        $totalPlans = MealPlan::where('user_id', $user->id)->count();

        // Consolidated single query for progress log metrics
        $progressStats = ProgressLog::where('user_id', $user->id)
            ->selectRaw('
                COUNT(*) as total_logs,
                SUM(CASE WHEN workout_done = 1 THEN 1 ELSE 0 END) as workout_days,
                AVG(calories_consumed) as avg_calories,
                AVG(weight) as avg_weight
            ')
            ->first();

        $latestLog = ProgressLog::where('user_id', $user->id)
            ->latest('date')
            ->first(['date', 'weight']);

        $streak = $achievementService->calculateStreak($user);
        $badges = \App\Models\UserBadge::where('user_id', $user->id)
            ->orderBy('earned_at', 'desc')
            ->get();

        return response()->json([
            'user'    => $user->only('name', 'email'),
            'profile' => $profile,
            'stats'   => [
                'total_plans_generated' => $totalPlans,
                'total_logs'            => (int) ($progressStats->total_logs ?? 0),
                'workout_days'          => (int) ($progressStats->workout_days ?? 0),
                'latest_weight'         => $latestLog?->weight,
                'latest_log_date'       => $latestLog?->date,
                'streak'                => $streak,
                'avg_calories'          => $progressStats->avg_calories ? round((float)$progressStats->avg_calories, 0) : null,
                'avg_weight'            => $progressStats->avg_weight   ? round((float)$progressStats->avg_weight,   1) : null,
            ],
            'has_profile' => (bool) $profile,
            'badges'      => $badges,
        ]);
    }
}
