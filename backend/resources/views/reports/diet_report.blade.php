<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Diet &amp; Nutrition Report - {{ $user->name }}</title>
    <style>
        body { font-family: DejaVu Sans, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 15px; font-size: 11px; line-height: 1.4; }
        .header { background: #1b4332; color: #ffffff; padding: 18px 22px; border-radius: 6px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 0.5px; }
        .header p { margin: 4px 0 0; opacity: 0.9; font-size: 11px; }
        .section { margin-bottom: 18px; }
        .section-title { font-size: 13px; font-weight: bold; color: #1b4332; border-bottom: 2px solid #52b788; padding-bottom: 3px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
        .grid { display: table; width: 100%; table-layout: fixed; }
        .col { display: table-cell; width: 33.33%; padding: 3px 6px; vertical-align: top; box-sizing: border-box; }
        .metric-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 5px; padding: 8px 6px; text-align: center; }
        .metric-box .val { font-size: 16px; font-weight: bold; color: #15803d; }
        .metric-box .lbl { font-size: 9px; font-weight: 600; color: #64748b; margin-top: 2px; text-transform: uppercase; }
        table.data-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 6px; }
        table.data-table th { background: #2d6a4f; color: #ffffff; padding: 6px 8px; text-align: left; font-size: 10px; font-weight: bold; }
        table.data-table td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
        table.data-table tr:nth-child(even) td { background: #f8fafc; }
        .meal-header { background: #d8f3dc; color: #1b4332; font-weight: bold; padding: 5px 8px; border-radius: 4px; margin-top: 8px; font-size: 11px; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-info { background: #e0f2fe; color: #0369a1; }
        .footer { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .empty-notice { color: #64748b; font-style: italic; padding: 8px 0; font-size: 10px; }
    </style>
</head>
<body>

<div class="header">
    <h1>NUTRI-PLAN HEALTH &amp; DIET REPORT</h1>
    <p>Member: <strong>{{ $user->name }}</strong> &nbsp;|&nbsp; Target Date: <strong>{{ $date }}</strong> &nbsp;|&nbsp; Generated: {{ now()->format('d M Y, h:i A') }}</p>
</div>

<!-- Health Profile -->
@if($user->profile)
<div class="section">
    <div class="section-title">Clinical Health Profile &amp; Targets</div>
    <div class="grid">
        <div class="col">
            <div class="metric-box">
                <div class="val">{{ $user->profile->bmi ? number_format($user->profile->bmi, 1) : '—' }}</div>
                <div class="lbl">Body Mass Index (BMI)</div>
            </div>
        </div>
        <div class="col">
            <div class="metric-box">
                <div class="val">{{ $user->profile->bmr ? round($user->profile->bmr) : '—' }}</div>
                <div class="lbl">BMR (kcal / day)</div>
            </div>
        </div>
        <div class="col">
            <div class="metric-box">
                <div class="val">{{ $user->profile->tdee ? round($user->profile->tdee) : '—' }}</div>
                <div class="lbl">TDEE (kcal / day)</div>
            </div>
        </div>
    </div>
    <div class="grid" style="margin-top: 6px;">
        <div class="col">
            <div class="metric-box">
                <div class="val">{{ $user->profile->calories_target ? round($user->profile->calories_target) : '—' }}</div>
                <div class="lbl">Daily Calorie Target</div>
            </div>
        </div>
        <div class="col">
            <div class="metric-box">
                <div class="val">{{ $user->profile->weight_kg ? floatval($user->profile->weight_kg) . ' kg' : '—' }}</div>
                <div class="lbl">Current Weight</div>
            </div>
        </div>
        <div class="col">
            <div class="metric-box">
                <div class="val">{{ ucfirst($user->profile->goal ?? 'Maintain') }}</div>
                <div class="lbl">Goal Trajectory</div>
            </div>
        </div>
    </div>
</div>
@endif

<!-- Meal Plan -->
<div class="section">
    <div class="section-title">Daily Meal Breakdown ({{ $date }})</div>

    @if($plan && $plan->mealItems && $plan->mealItems->count())
        @php
            $grouped = $plan->mealItems->groupBy('meal_type');
            $mealLabels = [
                'breakfast' => 'Breakfast',
                'lunch'     => 'Lunch',
                'snack'     => 'Snack',
                'dinner'    => 'Dinner'
            ];
        @endphp

        @foreach(['breakfast', 'lunch', 'snack', 'dinner'] as $mealType)
            @if(isset($grouped[$mealType]) && count($grouped[$mealType]) > 0)
            <div class="meal-header">{{ $mealLabels[$mealType] ?? ucfirst($mealType) }}</div>
            <table class="data-table">
                <tr>
                    <th style="width: 45%;">Food / Recipe Item</th>
                    <th style="width: 15%;">Quantity</th>
                    <th style="width: 13%;">Calories</th>
                    <th style="width: 9%;">Protein</th>
                    <th style="width: 9%;">Carbs</th>
                    <th style="width: 9%;">Fat</th>
                </tr>
                @foreach($grouped[$mealType] as $item)
                <tr>
                    <td><strong>{{ $item->food->name ?? $item->recipe->name ?? $item->name ?? 'Custom Item' }}</strong></td>
                    <td>{{ $item->quantity }} {{ $item->unit }}</td>
                    <td>{{ round($item->calories) }} kcal</td>
                    <td>{{ round($item->protein, 1) }}g</td>
                    <td>{{ round($item->carbs, 1) }}g</td>
                    <td>{{ round($item->fat, 1) }}g</td>
                </tr>
                @endforeach
            </table>
            @endif
        @endforeach

        <div class="grid" style="margin-top: 10px;">
            <div class="col"><div class="metric-box"><div class="val">{{ round((float)($plan->total_calories ?? 0)) }} kcal</div><div class="lbl">Planned Calories</div></div></div>
            <div class="col"><div class="metric-box"><div class="val">{{ round((float)($plan->protein_target ?? 0)) }}g</div><div class="lbl">Planned Protein</div></div></div>
            <div class="col"><div class="metric-box"><div class="val">{{ $plan->water_intake_liters ?? '2.5' }} L</div><div class="lbl">Hydration Target</div></div></div>
        </div>
    @else
        <p class="empty-notice">No specific meal plan generated for {{ $date }}. You can generate your daily meal plan from the AI Meal Planner screen.</p>
    @endif
</div>

<!-- Recent Progress -->
@if(isset($recentLogs) && $recentLogs->count() > 0)
<div class="section">
    <div class="section-title">Recent 7-Day Progress Logs</div>
    <table class="data-table">
        <tr>
            <th>Date</th>
            <th>Weight (kg)</th>
            <th>Calories Logged</th>
            <th>Water (L)</th>
            <th>Steps</th>
            <th>Workout</th>
        </tr>
        @foreach($recentLogs as $log)
        <tr>
            <td><strong>{{ $log->date }}</strong></td>
            <td>{{ $log->weight ?? '—' }}</td>
            <td>{{ $log->calories_consumed ? round((float)$log->calories_consumed) . ' kcal' : '—' }}</td>
            <td>{{ $log->water_intake_liters ? $log->water_intake_liters . ' L' : '—' }}</td>
            <td>{{ $log->steps ? number_format((int)$log->steps) : '—' }}</td>
            <td>
                @if($log->workout_done)
                    <span class="badge badge-success">Completed</span>
                @else
                    <span class="badge badge-danger">Rest Day</span>
                @endif
            </td>
        </tr>
        @endforeach
    </table>
</div>
@endif

<div class="footer">
    NutriPlan AI &bull; Clinical Nutrition Intelligence Platform &bull; Consult a certified medical professional before starting any extreme calorie regimen.
</div>

</body>
</html>
