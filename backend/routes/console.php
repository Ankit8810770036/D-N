<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\User;
use Illuminate\Support\Facades\Log;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Subscription Expiry — runs daily at midnight
|--------------------------------------------------------------------------
| Finds all premium users whose subscription_expires_at has passed and
| downgrades them back to the basic plan automatically.
|
| To activate this on the server, add to crontab:
|   * * * * * php /path-to-project/artisan schedule:run >> /dev/null 2>&1
*/
Artisan::command('subscriptions:expire', function () {
    $expired = User::where('plan_type', 'premium')
        ->whereNotNull('subscription_expires_at')
        ->where('subscription_expires_at', '<', now())
        ->get();

    $count = $expired->count();

    foreach ($expired as $user) {
        $user->update([
            'plan_type'               => 'basic',
            'subscription_expires_at' => null,
        ]);

        Log::info('Subscription expired — user downgraded to basic', [
            'user_id' => $user->id,
            'email'   => $user->email,
        ]);
    }

    $this->info("Done. {$count} subscription(s) expired and downgraded to basic.");
})->purpose('Downgrade users with expired premium subscriptions');

Schedule::command('subscriptions:expire')->dailyAt('00:00');
