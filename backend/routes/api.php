<?php

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ChatbotController;
use App\Http\Controllers\API\DietPlannerController;
use App\Http\Controllers\API\FoodController;
use App\Http\Controllers\API\HealthProfileController;
use App\Http\Controllers\API\ProgressController;
use App\Http\Controllers\API\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Diet & Nutrition Planner
|--------------------------------------------------------------------------
*/

// ─── Public Auth Routes (Rate Limited) ────────────────────────────────────
// throttle:max_attempts,decay_minutes
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:10,1');

// ─── Password Reset (Public — no auth required) ────────────────────────────
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/reset-password',  [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

// ─── Setup & Health Check ──────────────────────────────────────────────────
Route::get('/health-check', function () {
    try {
        DB::connection()->getPdo();
        $dbName = DB::connection()->getDatabaseName();
        $foodsCount = Schema::hasTable('foods') ? DB::table('foods')->count() : 0;
        return response()->json([
            'status' => 'healthy',
            'database_connected' => true,
            'database' => $dbName,
            'driver' => DB::connection()->getDriverName(),
            'foods_count' => $foodsCount,
            'tables_exist' => Schema::hasTable('foods'),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'database_connected' => false,
            'error' => $e->getMessage(),
        ], 500);
    }
});

Route::get('/setup-db', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $migrateOutput = \Illuminate\Support\Facades\Artisan::output();

        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        $seedOutput = \Illuminate\Support\Facades\Artisan::output();

        return response()->json([
            'success' => true,
            'message' => 'Database successfully migrated and seeded!',
            'migrate_output' => $migrateOutput,
            'seed_output' => $seedOutput,
            'foods_count' => DB::table('foods')->count(),
            'recipes_count' => DB::table('recipes')->count(),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
        ], 500);
    }
});

// ─── Public Food Browse ────────────────────────────────────────────────────
Route::get('/foods',                    [FoodController::class, 'index']);
Route::get('/foods/{food}',             [FoodController::class, 'show']);
Route::get('/barcode/lookup/{barcode}',  [FoodController::class, 'barcodeLookup']);

// ─── Authenticated Routes ──────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/profile/photo', [AuthController::class, 'updatePhoto']);

    // ── Email Verification ─────────────────────────────────────────────────
    // Resend the verification email (user clicks "Resend" on the frontend banner)
    Route::post('/email/resend-verification', function (Illuminate\Http\Request $request) {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.'], 200);
        }
        try {
            $request->user()->sendEmailVerificationNotification();
            return response()->json(['message' => 'Verification email resent. Please check your inbox.']);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Resend email failed: ' . $e->getMessage());
            return response()->json(['message' => 'Email service is currently initializing. Your account is active.'], 200);
        }
    });

    // Health Profile
    Route::get ('/profile',             [HealthProfileController::class, 'show']);
    Route::put ('/profile/update',      [HealthProfileController::class, 'update']);
    Route::post('/profile/recalibrate', [HealthProfileController::class, 'recalibrate']);

    // Diet Planner
    Route::post('/generate-plan',           [DietPlannerController::class, 'generatePlan']);
    Route::post('/generate-ai-weekly-plan', [DietPlannerController::class, 'generateAiWeeklyPlan']);
    Route::get ('/meal-plan',               [DietPlannerController::class, 'getMealPlan']);
    Route::get ('/grocery-list',   [DietPlannerController::class, 'getGroceryList']);
    Route::get ('/grocery-list/pdf', [ReportController::class, 'downloadGroceryPDF']);
    Route::put ('/grocery-toggle', [DietPlannerController::class, 'toggleGroceryItem']);
    Route::put ('/meal-item/{id}/swap',    [DietPlannerController::class, 'swapMealItem']);
    Route::put ('/meal-item/{id}/consume', [DietPlannerController::class, 'toggleConsumed']);

    // Progress Tracking
    Route::post('/log-progress',   [ProgressController::class, 'logProgress']);
    Route::get ('/analytics',      [ProgressController::class, 'analytics']);

    // HealthCoins
    Route::get ('/tokens',              [\App\Http\Controllers\API\TokenController::class, 'balance']);
    Route::post('/tokens/redeem',       [\App\Http\Controllers\API\TokenController::class, 'redeem']);
    Route::post('/tokens/daily-login',  [\App\Http\Controllers\API\TokenController::class, 'dailyLogin']);

    // Chatbot
    Route::post('/chat', [ChatbotController::class, 'ask'])->middleware('throttle:30,1');

    // Foods & Custom Foods
    Route::post('/foods',          [FoodController::class, 'store']);

    // Reports
    Route::get('/report/pdf',      [ReportController::class, 'downloadPDF']);
    Route::get('/report/summary',  [ReportController::class, 'summary']);

    // Subscription & Payment (Razorpay)
    Route::post('/payment/create-order', [\App\Http\Controllers\API\SubscriptionController::class, 'createOrder']);
    Route::post('/payment/verify',       [\App\Http\Controllers\API\SubscriptionController::class, 'verifyPayment']);
    Route::post('/unsubscribe',          [\App\Http\Controllers\API\SubscriptionController::class, 'downgrade']);

    // Cookbook & Recipes
    Route::apiResource('recipes', \App\Http\Controllers\API\RecipeController::class);

    // Admin-only Data Management
    Route::middleware('can:admin')->group(function () {
        Route::get   ('/admin/stats',        [\App\Http\Controllers\API\AdminController::class, 'getStats']);
        Route::get   ('/admin/users',        [\App\Http\Controllers\API\AdminController::class, 'getUsers']);
        Route::get   ('/admin/export-users', [\App\Http\Controllers\API\AdminController::class, 'exportUsers']);
        Route::put   ('/admin/users/{user}', [\App\Http\Controllers\API\AdminController::class, 'updateUser']);
        Route::delete('/admin/users/{user}', [\App\Http\Controllers\API\AdminController::class, 'destroy']);
        Route::post  ('/admin/refresh-cache', [\App\Http\Controllers\API\AdminController::class, 'refreshCache']);

        Route::put   ('/foods/{food}',  [\App\Http\Controllers\API\FoodController::class, 'update']);
        Route::delete('/foods/{food}',  [\App\Http\Controllers\API\FoodController::class, 'destroy']);
    });
});
