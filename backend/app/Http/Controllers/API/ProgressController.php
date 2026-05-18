<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ProgressLog;
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

        $log = ProgressLog::updateOrCreate(
            ['user_id' => $request->user()->id, 'date' => $date],
            array_merge($validated, ['date' => $date])
        );

        $newBadges = app(\App\Services\AchievementService::class)->checkAchievements($request->user());

        return response()->json([
            'message'    => 'Progress logged successfully',
            'log'        => $log,
            'new_badges' => $newBadges,
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
        $weights    = $logs->whereNotNull('weight')->pluck('weight');
        $calories   = $logs->whereNotNull('calories_consumed')->pluck('calories_consumed');

        $summary = [
            'weight_start'  => $weights->first(),
            'weight_latest' => $weights->last(),
            'weight_change' => $weights->count() >= 2 ? round($weights->last() - $weights->first(), 2) : null,
            'avg_calories'  => $calories->count() > 0 ? round($calories->avg(), 1) : null,
            'avg_steps'     => round($logs->whereNotNull('steps')->avg('steps') ?? 0),
            'workout_days'  => $logs->where('workout_done', true)->count(),
        ];

        return response()->json([
            'logs'    => $logs,
            'summary' => $summary,
            'period'  => "{$days} days",
        ]);
    }
}
