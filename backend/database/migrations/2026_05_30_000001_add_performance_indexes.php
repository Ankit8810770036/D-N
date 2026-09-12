<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add composite and single-column indexes on high-traffic query columns.
     *
     * These columns are queried on virtually every page load:
     *  - meal_plans:     user_id + date   (Planner, Grocery List, Dashboard)
     *  - progress_logs:  user_id + date   (Progress, Reports, Dashboard streak)
     *  - meal_items:     meal_plan_id     (every meal plan load expands items)
     *  - personal_access_tokens: tokenable_id (every authenticated API request)
     */
    public function up(): void
    {
        // ── meal_plans: queried by user + date on every Planner/Dashboard load ──
        Schema::table('meal_plans', function (Blueprint $table) {
            // Composite index — covers WHERE user_id = ? AND date = ? queries
            $table->index(['user_id', 'date'], 'meal_plans_user_date_idx');
        });

        // ── meal_items: always filtered by meal_plan_id when loading a plan ──
        Schema::table('meal_items', function (Blueprint $table) {
            $table->index('meal_plan_id', 'meal_items_plan_idx');
            // Also index is_consumed for the toggle + consumed calorie sum queries
            $table->index(['meal_plan_id', 'is_consumed'], 'meal_items_plan_consumed_idx');
        });

        // ── progress_logs: queried by user + date on every Dashboard/Progress load ──
        Schema::table('progress_logs', function (Blueprint $table) {
            $table->index(['user_id', 'date'], 'progress_logs_user_date_idx');
        });

        // ── token_transactions: queried per user to check idempotency ──
        Schema::table('token_transactions', function (Blueprint $table) {
            $table->index(['user_id', 'type'], 'token_transactions_user_type_idx');
        });
    }

    /**
     * Reverse the migration — drop all added indexes.
     */
    public function down(): void
    {
        Schema::table('meal_plans', function (Blueprint $table) {
            $table->dropIndex('meal_plans_user_date_idx');
        });

        Schema::table('meal_items', function (Blueprint $table) {
            $table->dropIndex('meal_items_plan_idx');
            $table->dropIndex('meal_items_plan_consumed_idx');
        });

        Schema::table('progress_logs', function (Blueprint $table) {
            $table->dropIndex('progress_logs_user_date_idx');
        });

        Schema::table('token_transactions', function (Blueprint $table) {
            $table->dropIndex('token_transactions_user_type_idx');
        });
    }
};
