<?php

namespace App\Jobs;

use App\Models\MealPlan;
use App\Models\ProgressLog;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GeneratePdfReportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    public function __construct(
        public User $user,
        public string $date,
        public string $type = 'diet' // 'diet' or 'grocery'
    ) {
        $this->onQueue('low');
    }

    /**
     * Execute the PDF generation in the background.
     */
    public function handle(): void
    {
        try {
            $user = $this->user->fresh(['profile']);
            $date = $this->date;

            if ($this->type === 'diet') {
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

                $path = "reports/user_{$user->id}/diet_report_{$date}.pdf";
                Storage::put($path, $pdf->output());

                Log::info("GeneratePdfReportJob: Diet PDF successfully generated and stored at {$path}");
            }
        } catch (\Throwable $e) {
            Log::error("GeneratePdfReportJob failed for User {$this->user->id}: " . $e->getMessage());
            throw $e;
        }
    }
}
