<?php

namespace App\Services;

use App\Models\TokenTransaction;
use App\Models\UserToken;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TokenService
{
    // ── Earn amounts ───────────────────────────────────────────────────────────
    const AMOUNTS = [
        'daily_login'      =>  5,
        'progress_logged'  => 10,
        'workout_logged'   => 15,
        'calorie_hit'      => 10,
        'meals_consumed'   => 10,
        'streak_7'         => 50,
        'streak_30'        => 200,
    ];

    // Reasons that can only be earned once per calendar day (midnight IST reset)
    const DAILY_REASONS = [
        'daily_login', 'progress_logged', 'workout_logged', 'calorie_hit', 'meals_consumed',
    ];

    // Reasons that can only be earned once ever (milestone bonuses)
    const ONCE_REASONS = [
        'streak_7', 'streak_30',
    ];

    /**
     * Award coins to a user idempotently per user and per date.
     * Returns the transaction if awarded, null if already awarded for that date/milestone.
     */
    public function award($user, string $reason, ?int $amount = null, array $meta = []): ?TokenTransaction
    {
        $amount     = $amount ?? (self::AMOUNTS[$reason] ?? 0);
        $targetDate = isset($meta['date'])
            ? Carbon::parse($meta['date'], 'Asia/Kolkata')
            : Carbon::now('Asia/Kolkata');

        // Idempotency checks
        if (in_array($reason, self::ONCE_REASONS)) {
            $alreadyEarned = TokenTransaction::where('user_id', $user->id)
                ->where('reason', $reason)
                ->exists();
            if ($alreadyEarned) return null;
        } elseif (in_array($reason, self::DAILY_REASONS)) {
            $startISTinUTC = (clone $targetDate)->startOfDay()->setTimezone('UTC');
            $endISTinUTC   = (clone $targetDate)->endOfDay()->setTimezone('UTC');
            
            $alreadyEarnedOnDate = TokenTransaction::where('user_id', $user->id)
                ->where('reason', $reason)
                ->whereBetween('created_at', [$startISTinUTC, $endISTinUTC])
                ->exists();
            if ($alreadyEarnedOnDate) return null;
        }

        $createdAt = isset($meta['date']) && $targetDate->toDateString() !== Carbon::now('Asia/Kolkata')->toDateString()
            ? (clone $targetDate)->startOfDay()->addHours(12)->setTimezone('UTC')
            : now();

        return DB::transaction(function () use ($user, $reason, $amount, $meta, $targetDate, $createdAt) {
            // Upsert wallet
            $wallet = UserToken::firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0]
            );
            $wallet->increment('balance', $amount);

            // Record transaction
            return TokenTransaction::create([
                'user_id'    => $user->id,
                'type'       => 'earn',
                'reason'     => $reason,
                'amount'     => $amount,
                'meta'       => array_merge($meta, [
                    'date'           => $targetDate->toDateString(),
                    'awarded_at_ist' => Carbon::now('Asia/Kolkata')->toDateTimeString(),
                ]),
                'created_at' => $createdAt,
            ]);
        });
    }

    /**
     * Spend coins. Throws if insufficient balance.
     * Returns the transaction.
     */
    public function spend($user, string $reason, int $amount, array $meta = []): TokenTransaction
    {
        return DB::transaction(function () use ($user, $reason, $amount, $meta) {
            $wallet = UserToken::lockForUpdate()->firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0]
            );

            if ($wallet->balance < $amount) {
                throw new \Exception("Insufficient HealthCoins. You need {$amount} coins but have {$wallet->balance}.");
            }

            $wallet->decrement('balance', $amount);

            return TokenTransaction::create([
                'user_id'    => $user->id,
                'type'       => 'spend',
                'reason'     => $reason,
                'amount'     => -$amount,
                'meta'       => $meta,
                'created_at' => now(),
            ]);
        });
    }

    /**
     * Get the current coin balance for a user. Creates wallet if not exists.
     */
    public function getBalance($user): int
    {
        return UserToken::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        )->balance;
    }

    /**
     * Get last N transactions for a user (newest first).
     */
    public function getHistory($user, int $limit = 20): \Illuminate\Support\Collection
    {
        return TokenTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get which daily challenges are already completed for a specific date (midnight IST reset).
     * Defaults to current date in Asia/Kolkata if date is not provided.
     */
    public function getTodayCompletions($user, ?string $date = null): array
    {
        $targetDate    = $date ? Carbon::parse($date, 'Asia/Kolkata') : Carbon::now('Asia/Kolkata');
        $startISTinUTC = (clone $targetDate)->startOfDay()->setTimezone('UTC');
        $endISTinUTC   = (clone $targetDate)->endOfDay()->setTimezone('UTC');

        $done = TokenTransaction::where('user_id', $user->id)
            ->whereIn('reason', self::DAILY_REASONS)
            ->whereBetween('created_at', [$startISTinUTC, $endISTinUTC])
            ->pluck('reason')
            ->toArray();

        return array_values(array_unique($done));
    }
}
