<?php

use App\Http\Controllers\API\AuthController;
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

// ─── Public Auth Routes ────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// ─── Public Food Browse ────────────────────────────────────────────────────
Route::get('/foods',         [FoodController::class, 'index']);
Route::get('/foods/{food}',  [FoodController::class, 'show']);

// ─── Authenticated Routes ──────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/profile/photo', [AuthController::class, 'updatePhoto']);

    // Health Profile
    Route::get ('/profile',         [HealthProfileController::class, 'show']);
    Route::put ('/profile/update',  [HealthProfileController::class, 'update']);

    // Diet Planner
    Route::post('/generate-plan',  [DietPlannerController::class, 'generatePlan']);
    Route::get ('/meal-plan',      [DietPlannerController::class, 'getMealPlan']);
    Route::get ('/grocery-list',   [DietPlannerController::class, 'getGroceryList']);
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
    Route::post('/chat',           [\App\Http\Controllers\API\ChatbotController::class, 'ask']);

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
        Route::get   ('/admin/stats',   [\App\Http\Controllers\API\AdminController::class, 'getStats']);
        Route::get   ('/admin/users',   [\App\Http\Controllers\API\AdminController::class, 'getUsers']);
        Route::put   ('/admin/users/{user}', [\App\Http\Controllers\API\AdminController::class, 'updateUser']);
        Route::post  ('/admin/refresh-cache', [\App\Http\Controllers\API\AdminController::class, 'refreshCache']);

        Route::put   ('/foods/{food}',  [\App\Http\Controllers\API\FoodController::class, 'update']);
        Route::delete('/foods/{food}',  [\App\Http\Controllers\API\FoodController::class, 'destroy']);
    });
});
