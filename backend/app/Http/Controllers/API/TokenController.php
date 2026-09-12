<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\TokenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TokenController extends Controller
{
    public function __construct(private TokenService $tokens) {}

    /**
     * GET /tokens
     * Returns current balance + recent transaction history + completions for specified date (default today).
     */
    public function balance(Request $request)
    {
        $user      = $request->user();
        $date      = $request->input('date', Carbon::now('Asia/Kolkata')->toDateString());
        $balance   = $this->tokens->getBalance($user);
        $history   = $this->tokens->getHistory($user, 20);
        $todayDone = $this->tokens->getTodayCompletions($user, $date);

        // Build challenge list with completion status
        $challenges = [
            ['reason' => 'daily_login',     'label' => 'Daily Login',            'coins' => 5,  'done' => in_array('daily_login',     $todayDone)],
            ['reason' => 'progress_logged', 'label' => 'Log Progress Today',      'coins' => 10, 'done' => in_array('progress_logged', $todayDone)],
            ['reason' => 'workout_logged',  'label' => 'Complete a Workout',      'coins' => 15, 'done' => in_array('workout_logged',  $todayDone)],
            ['reason' => 'calorie_hit',     'label' => 'Hit Calorie Target',      'coins' => 10, 'done' => in_array('calorie_hit',     $todayDone)],
            ['reason' => 'meals_consumed',  'label' => 'Eat All Planned Meals',   'coins' => 10, 'done' => in_array('meals_consumed',  $todayDone)],
        ];

        return response()->json([
            'balance'    => $balance,
            'date'       => $date,
            'challenges' => $challenges,
            'history'    => $history,
        ]);
    }

    /**
     * POST /tokens/daily-login
     * Called automatically by the /me endpoint — awards +5 once per day.
     */
    public function dailyLogin(Request $request)
    {
        $user        = $request->user();
        $transaction = $this->tokens->award($user, 'daily_login');

        return response()->json([
            'awarded'    => $transaction !== null,
            'coins'      => $transaction?->amount ?? 0,
            'balance'    => $this->tokens->getBalance($user),
            'message'    => $transaction ? '🪙 +5 HealthCoins for daily login!' : 'Already claimed today.',
        ]);
    }

    /**
     * POST /tokens/redeem
     * Handles both:
     *   type = 'free'     → spend 500 coins, activate Premium immediately (no payment)
     *   type = 'discount' → spend coins for INR discount, returns discounted amount for Razorpay
     */
    public function redeem(Request $request)
    {
        $validated = $request->validate([
            'type'  => 'required|in:free,discount',
            'coins' => 'required_if:type,discount|integer|min:50',
        ]);

        $user = $request->user();

        if ($user->plan_type === 'premium') {
            return response()->json(['message' => 'You are already a Premium member.'], 422);
        }

        $type = $validated['type'];

        // ── Option A: Full free redemption ────────────────────────────────────
        if ($type === 'free') {
            $cost = 500;
            try {
                $this->tokens->spend($user, 'premium_redeem', $cost, [
                    'plan' => 'premium',
                    'method' => 'full_token_redemption',
                ]);
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }

            // Activate Premium directly
            $user->update([
                'plan_type'               => 'premium',
                'subscription_id'         => 'token_redeem_' . $user->id . '_' . time(),
                'subscribed_at'           => now(),
                'subscription_expires_at' => now()->addMonth(),
            ]);

            return response()->json([
                'success'  => true,
                'message'  => '🎉 Premium activated with HealthCoins! Enjoy 1 month free.',
                'balance'  => $this->tokens->getBalance($user),
                'user'     => $user->fresh(),
            ]);
        }

        // ── Option B: Partial discount ────────────────────────────────────────
        // Discount tiers: 200 coins = ₹100 off, 400 coins = ₹250 off
        $discountTiers = [
            200 => 100,   // 200 coins → ₹100 off  (pay ₹399)
            400 => 250,   // 400 coins → ₹250 off  (pay ₹249)
        ];

        $coinsToSpend = (int) $validated['coins'];

        if (!array_key_exists($coinsToSpend, $discountTiers)) {
            return response()->json([
                'message' => 'Invalid coin amount. Choose 200 coins (₹100 off) or 400 coins (₹250 off).',
            ], 422);
        }

        $discountINR    = $discountTiers[$coinsToSpend];
        $originalINR    = 499;
        $finalINR       = $originalINR - $discountINR;
        $finalPaise     = $finalINR * 100;

        try {
            $this->tokens->spend($user, 'discount_redeem', $coinsToSpend, [
                'discount_inr'  => $discountINR,
                'final_inr'     => $finalINR,
                'original_inr'  => $originalINR,
                'pending_payment' => true,  // Flag — payment not yet completed
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success'       => true,
            'discount_inr'  => $discountINR,
            'final_inr'     => $finalINR,
            'final_paise'   => $finalPaise,
            'balance'       => $this->tokens->getBalance($user),
            'message'       => "🪙 {$coinsToSpend} coins applied! Pay ₹{$finalINR} to complete upgrade.",
        ]);
    }
}
