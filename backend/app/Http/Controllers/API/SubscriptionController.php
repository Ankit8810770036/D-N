<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    private string $keyId;
    private string $keySecret;
    private string $baseUrl = 'https://api.razorpay.com/v1';

    public function __construct()
    {
        $this->keyId     = config('services.razorpay.key_id', '');
        $this->keySecret = config('services.razorpay.key_secret', '');
    }

    /**
     * Step 1: Create a Razorpay order.
     * Frontend calls this to get an order_id before opening the checkout modal.
     */
    public function createOrder(Request $request)
    {
        $user = $request->user();

        if ($user->plan_type === 'premium') {
            return response()->json(['message' => 'You are already a Premium member.'], 422);
        }

        // Amount in paise (₹499 = 49900 paise)
        $amountInPaise = 49900;

        try {
            $response = Http::withBasicAuth($this->keyId, $this->keySecret)
                ->post("{$this->baseUrl}/orders", [
                    'amount'          => $amountInPaise,
                    'currency'        => 'INR',
                    'receipt'         => 'receipt_user_' . $user->id . '_' . time(),
                    'notes'           => [
                        'user_id'    => $user->id,
                        'user_email' => $user->email,
                        'plan'       => 'premium',
                    ],
                ]);

            if (!$response->successful()) {
                Log::error('Razorpay createOrder failed', ['body' => $response->body()]);
                return response()->json(['message' => 'Payment gateway error. Please try again.'], 502);
            }

            $order = $response->json();

            return response()->json([
                'order_id'  => $order['id'],
                'amount'    => $order['amount'],
                'currency'  => $order['currency'],
                'key_id'    => $this->keyId,
                'user_name' => $user->name,
                'user_email'=> $user->email,
            ]);

        } catch (\Exception $e) {
            Log::error('Razorpay createOrder exception', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Could not initiate payment. Please check your connection.'], 500);
        }
    }

    /**
     * Step 2: Verify payment signature and upgrade the user.
     * Called after Razorpay checkout is successful on the frontend.
     */
    public function verifyPayment(Request $request)
    {
        $request->validate([
            'razorpay_order_id'   => 'required|string',
            'razorpay_payment_id' => 'required|string',
            'razorpay_signature'  => 'required|string',
        ]);

        $user = $request->user();

        // Verify HMAC-SHA256 signature
        $expectedSignature = hash_hmac(
            'sha256',
            $request->razorpay_order_id . '|' . $request->razorpay_payment_id,
            $this->keySecret
        );

        if (!hash_equals($expectedSignature, $request->razorpay_signature)) {
            Log::warning('Razorpay signature mismatch', [
                'user_id'    => $user->id,
                'order_id'   => $request->razorpay_order_id,
                'payment_id' => $request->razorpay_payment_id,
            ]);
            return response()->json(['message' => 'Payment verification failed. Please contact support.'], 422);
        }

        // Signature is valid — upgrade the user
        $user->update([
            'plan_type'       => 'premium',
            'subscription_id' => $request->razorpay_payment_id,
            'subscribed_at'   => now(),
            'subscription_expires_at' => now()->addMonth(),
        ]);

        Log::info('User upgraded to premium', [
            'user_id'    => $user->id,
            'payment_id' => $request->razorpay_payment_id,
        ]);

        return response()->json([
            'message' => '🎉 Welcome to Premium! Your plan has been activated.',
            'user'    => $user->fresh(),
        ]);
    }

    /**
     * Downgrade user back to Basic plan.
     */
    public function downgrade(Request $request)
    {
        $user = $request->user();

        if ($user->plan_type === 'basic') {
            return response()->json(['message' => 'You are already on the Basic plan.'], 422);
        }

        $user->update([
            'plan_type'                => 'basic',
            'subscription_expires_at'  => null,
        ]);

        return response()->json([
            'message' => 'Subscription cancelled. You have been downgraded to Basic.',
            'user'    => $user->fresh(),
        ]);
    }
}
