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
            @ini_set('memory_limit', '256M');
            @set_time_limit(60);

            $user = $request->user()->load('profile');
            $date = $request->input('date', Carbon::today()->toDateString());

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
            $pdf->setOptions([
                'isRemoteEnabled'      => false,
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled'         => false,
                'defaultFont'          => 'DejaVu Sans',
                'dpi'                  => 120,
                'tempDir'              => sys_get_temp_dir(),
                'chroot'               => base_path(),
            ]);

            return $pdf->download("diet_report_{$date}.pdf");
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('PDF Report generation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to generate PDF report: ' . $e->getMessage()
            ], 500);
        }
    }

    public function downloadGroceryPDF(Request $request)
    {
        try {
            @ini_set('memory_limit', '256M');
            @set_time_limit(60);

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
            $pdf->setOptions([
                'isRemoteEnabled'      => false,
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled'         => false,
                'defaultFont'          => 'DejaVu Sans',
                'dpi'                  => 120,
                'tempDir'              => sys_get_temp_dir(),
                'chroot'               => base_path(),
            ]);

            return $pdf->download("grocery_shopping_list_{$todayStr}.pdf");
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('Grocery PDF generation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to generate Grocery PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    public function summary(Request $request, \App\Services\AchievementService $achievementService)
    {
        try {
            $user    = $request->user()->load('profile');
            $profile = $user->profile;

            $totalPlans = MealPlan::where('user_id', $user->id)->count();

            // Portable cross-database aggregate queries (PostgreSQL, MySQL, SQLite)
            $totalLogs   = ProgressLog::where('user_id', $user->id)->count();
            $workoutDays = ProgressLog::where('user_id', $user->id)->where('workout_done', true)->count();
            $avgCalories = ProgressLog::where('user_id', $user->id)->whereNotNull('calories_consumed')->avg('calories_consumed');
            $avgWeight   = ProgressLog::where('user_id', $user->id)->whereNotNull('weight')->avg('weight');

            $latestLog = ProgressLog::where('user_id', $user->id)
                ->latest('date')
                ->first(['date', 'weight']);

            $streak = 0;
            $formattedBadges = [];

            try {
                $achievementService->checkAchievements($user);
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
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Streak/badge check warning in Report summary: ' . $e->getMessage());
            }

            return response()->json([
                'user'    => $user->only('name', 'email', 'profile_photo_url'),
                'profile' => $profile,
                'stats'   => [
                    'total_plans_generated' => (int) $totalPlans,
                    'total_logs'            => (int) $totalLogs,
                    'workout_days'          => (int) $workoutDays,
                    'latest_weight'         => $latestLog?->weight,
                    'latest_log_date'       => $latestLog?->date,
                    'streak'                => (int) $streak,
                    'avg_calories'          => $avgCalories ? round((float)$avgCalories, 0) : null,
                    'avg_weight'            => $avgWeight   ? round((float)$avgWeight,   1) : null,
                ],
                'has_profile' => (bool) $profile,
                'badges'      => $formattedBadges,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Report summary failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'user'    => $request->user()?->only('name', 'email', 'profile_photo_url'),
                'profile' => $request->user()?->profile,
                'stats'   => [
                    'total_plans_generated' => 0,
                    'total_logs'            => 0,
                    'workout_days'          => 0,
                    'latest_weight'         => null,
                    'latest_log_date'       => null,
                    'streak'                => 0,
                    'avg_calories'          => null,
                    'avg_weight'            => null,
                ],
                'has_profile' => (bool) $request->user()?->profile,
                'badges'      => [],
            ]);
        }
    }
}
