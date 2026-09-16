<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MealPlan;
use App\Models\ProgressLog;
use App\Models\UserBadge;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Exception;

class ReportController extends Controller
{
    public function downloadPDF(Request $request)
    {
        try {
            $user    = $request->user()->load('profile');
            $date    = $request->input('date', Carbon::today()->toDateString());

            $plan = MealPlan::where('user_id', $user->id)
                ->where('date', $date)
                ->with(['mealItems.food', 'mealItems.recipe'])
                ->first();

            $recentLogs = ProgressLog::where('user_id', $user->id)
                ->orderBy('date', 'desc')
                ->take(7)
                ->get();

            $pdf = Pdf::loadView('reports.diet_report', compact('user', 'plan', 'date', 'recentLogs'));
            $pdf->setPaper('a4', 'portrait');

            return $pdf->download("diet_report_{$date}.pdf");
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Failed to generate PDF report: ' . $e->getMessage()
            ], 500);
        }
    }

    public function downloadGroceryPDF(Request $request)
    {
        try {
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
                                    'name'           => $ri->food->name ?? $ri->name ?? 'Ingredient',
                                    'category'       => $ri->food->category ?? 'other',
                                    'unit'           => $ri->unit ?? 'g',
                                    'total_quantity' => 0,
                                    'is_bought'      => (bool) $item->is_bought,
                                ];
                            }
                            $groceries[$foodId]['total_quantity'] += (float) $ri->quantity;
                        }
                    } elseif ($item->food_id || $item->food) {
                        $foodId = $item->food_id ?? $item->id;
                        if (!isset($groceries[$foodId])) {
                            $groceries[$foodId] = [
                                'name'           => $item->food->name ?? $item->name ?? 'Food Item',
                                'category'       => $item->food->category ?? 'other',
                                'unit'           => $item->unit ?? 'g',
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
            $pdf->setPaper('a4', 'portrait');

            return $pdf->download("grocery_shopping_list_{$todayStr}.pdf");
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Failed to generate Grocery PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    public function summary(Request $request, \App\Services\AchievementService $achievementService)
    {
        $user    = $request->user()->load('profile');
        $profile = $user->profile;

        $totalPlans = MealPlan::where('user_id', $user->id)->count();

        // Consolidated single query for progress log metrics (cross-database safe for Postgres, MySQL & SQLite)
        $progressStats = ProgressLog::where('user_id', $user->id)
            ->selectRaw('
                COUNT(*) as total_logs,
                SUM(CASE WHEN workout_done THEN 1 ELSE 0 END) as workout_days,
                AVG(calories_consumed) as avg_calories,
                AVG(weight) as avg_weight
            ')
            ->first();

        $latestLog = ProgressLog::where('user_id', $user->id)
            ->latest('date')
            ->first(['date', 'weight']);

        $streak = $achievementService->calculateStreak($user);
        $badges = UserBadge::where('user_id', $user->id)
            ->orderBy('earned_at', 'desc')
            ->get();

        $badgeNameMap = [
            'streak_7'          => '7-Day Streak Warrior',
            'streak_14'         => '14-Day Consistency Master',
            'streak_30'         => '30-Day Nutrition Legend',
            'starter'           => 'First Step Starter',
            'culinary_explorer' => 'Culinary Explorer',
            'water_champion'    => 'Hydration Hero',
            'goal_reached'      => 'Goal Crusher',
        ];

        $formattedBadges = $badges->map(function ($b) use ($badgeNameMap) {
            return [
                'id'         => $b->id,
                'badge_type' => $b->badge_type,
                'badge_name' => $badgeNameMap[$b->badge_type] ?? ucwords(str_replace('_', ' ', $b->badge_type)),
                'earned_at'  => $b->earned_at,
            ];
        });

        return response()->json([
            'user'    => $user->only('name', 'email', 'profile_photo_url'),
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
            'badges'      => $formattedBadges,
        ]);
    }
}
