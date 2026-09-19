<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|string|email|max:255|unique:users',
            'password'        => 'required|string|min:8|confirmed',
            'food_preference' => 'sometimes|string',
            'goal'            => 'sometimes|string',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => 'user', // Always 'user' — role cannot be set via public registration
        ]);

        // Create profile with preferences
        UserProfile::create([
            'user_id' => $user->id,
            'food_preference' => $validated['food_preference'] ?? 'veg',
            'goal' => $validated['goal'] ?? 'maintain'
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Award first day login coins (idempotent)
        try {
            app(\App\Services\TokenService::class)->award($user, 'daily_login');
        } catch (\Throwable $e) {}

        // Offload email notification to background queue worker (high priority)
        \App\Jobs\SendVerificationEmailJob::dispatch($user)->onQueue('high');

        return response()->json([
            'message'            => 'Registration successful.',
            'token'              => $token,
            'user'               => $user,
            'email_verified'     => false,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $validated['email'])->first();

        // Auto-initialize super admin if not yet seeded (only permitted in local environment)
        if (app()->environment('local', 'testing') && !$user && $validated['email'] === 'admin@dietplanner.com' && $validated['password'] === 'password') {
            $user = User::firstOrCreate(['email' => 'admin@dietplanner.com'], [
                'name'              => 'Super Admin',
                'password'          => Hash::make('password'),
                'role'              => 'admin',
                'plan_type'         => 'premium',
                'subscription_id'   => 'admin_unlimited',
                'email_verified_at' => now(),
            ]);
        }

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Clean up old tokens on new login to prevent token table bloat
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        // Auto-downgrade if subscription has expired since last login
        if ($user->plan_type === 'premium'
            && $user->subscription_expires_at
            && $user->subscription_expires_at->isPast()) {
            $user->update([
                'plan_type'               => 'basic',
                'subscription_expires_at' => null,
            ]);
            $user->refresh();
        }

        $user->load('profile');
        $tokens = app(\App\Services\TokenService::class);
        
        // Award daily login coins (idempotent — once per day)
        try {
            $tokens->award($user, 'daily_login');
        } catch (\Throwable $e) {}

        $daysUntilExpiry = null;
        if ($user->plan_type === 'premium' && $user->subscription_expires_at) {
            $daysUntilExpiry = (int) now()->diffInDays($user->subscription_expires_at, false);
        }

        $userPayload = array_merge($user->toArray(), [
            'token_balance'     => $tokens->getBalance($user),
            'days_until_expiry' => $daysUntilExpiry,
        ]);

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => $userPayload,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user   = $request->user()->load('profile');
        $tokens = app(\App\Services\TokenService::class);

        // Auto-downgrade mid-session if subscription has expired
        // (fills the gap between daily cron runs)
        if ($user->plan_type === 'premium'
            && $user->subscription_expires_at
            && $user->subscription_expires_at->isPast()) {
            $user->update([
                'plan_type'               => 'basic',
                'subscription_expires_at' => null,
            ]);
            $user->refresh();
        }

        // Award daily login coins (idempotent — won't double-award on same IST day)
        $tokens->award($user, 'daily_login');

        // Calculate days until expiry for the frontend warning banner
        $daysUntilExpiry = null;
        if ($user->plan_type === 'premium' && $user->subscription_expires_at) {
            $daysUntilExpiry = (int) now()->diffInDays($user->subscription_expires_at, false);
        }

        return response()->json(array_merge($user->toArray(), [
            'token_balance'      => $tokens->getBalance($user),
            'days_until_expiry'  => $daysUntilExpiry, // null if basic, negative if expired
        ]));
    }

    public function updatePhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:5120',
        ]);

        $user = $request->user();
        $mediaService = app(\App\Services\MediaUploadService::class);

        // Delete old photo if it exists (cloud or local)
        if ($user->profile_photo_path) {
            $mediaService->deleteProfilePhoto($user->profile_photo_path);
        }

        // Upload to Cloudinary / ImageKit or local disk
        $uploadResult = $mediaService->uploadProfilePhoto($request->file('photo'), $user->id);
        
        $user->update([
            'profile_photo_path' => $uploadResult['path'],
        ]);

        $user->refresh();

        $tokens = app(\App\Services\TokenService::class);
        $daysUntilExpiry = null;
        if ($user->plan_type === 'premium' && $user->subscription_expires_at) {
            $daysUntilExpiry = (int) now()->diffInDays($user->subscription_expires_at, false);
        }

        return response()->json([
            'message'           => 'Profile photo updated successfully',
            'profile_photo_url' => $user->profile_photo_url,
            'provider'          => $uploadResult['provider'] ?? 'local',
            'user'              => array_merge($user->toArray(), [
                'token_balance'     => $tokens->getBalance($user),
                'days_until_expiry' => $daysUntilExpiry,
            ]),
        ]);
    }

    public function deletePhoto(Request $request)
    {
        $user = $request->user();
        $mediaService = app(\App\Services\MediaUploadService::class);

        // Delete photo from cloud or local disk
        if ($user->profile_photo_path) {
            $mediaService->deleteProfilePhoto($user->profile_photo_path);
        }

        $user->update([
            'profile_photo_path' => null,
        ]);

        $user->refresh();

        $tokens = app(\App\Services\TokenService::class);
        $daysUntilExpiry = null;
        if ($user->plan_type === 'premium' && $user->subscription_expires_at) {
            $daysUntilExpiry = (int) now()->diffInDays($user->subscription_expires_at, false);
        }

        return response()->json([
            'message'           => 'Profile photo removed successfully',
            'profile_photo_url' => $user->profile_photo_url,
            'user'              => array_merge($user->toArray(), [
                'token_balance'     => $tokens->getBalance($user),
                'days_until_expiry' => $daysUntilExpiry,
            ]),
        ]);
    }

    // ── Forgot Password ────────────────────────────────────────────────────────
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Tell Laravel's Password broker to generate a token and send the email.
        // The reset link will point to FRONTEND_URL/reset-password?token=...&email=...
        $status = Password::broker()->sendResetLink(
            $request->only('email'),
            function (User $user, string $token) {
                $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
                $url = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);
                $user->sendPasswordResetNotification($token);
                // Override notification URL (custom mailer needed for full override — this sends default)
            }
        );

        // Always return the same message to prevent email enumeration attacks
        return response()->json([
            'message' => 'If an account with that email exists, a password reset link has been sent.',
        ]);
    }

    // ── Reset Password ─────────────────────────────────────────────────────────
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'                 => 'required|string',
            'email'                 => 'required|email',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Revoke all existing API tokens so old sessions are invalidated
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password has been reset successfully. Please log in with your new password.']);
        }

        return response()->json([
            'message' => match($status) {
                Password::INVALID_TOKEN => 'This password reset link is invalid or has expired.',
                Password::INVALID_USER  => 'No account found with that email address.',
                default                 => 'Unable to reset password. Please request a new link.',
            }
        ], 422);
    }
}
