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
        if (Schema::hasTable('meal_plans')) {
            Schema::table('meal_plans', function (Blueprint $table) {
                $table->index(['user_id', 'date'], 'meal_plans_user_date_idx');
            });
        }

        if (Schema::hasTable('meal_items')) {
            Schema::table('meal_items', function (Blueprint $table) {
                $table->index('meal_plan_id', 'meal_items_plan_idx');
                $table->index(['meal_plan_id', 'is_consumed'], 'meal_items_plan_consumed_idx');
            });
        }

        if (Schema::hasTable('progress_logs')) {
            Schema::table('progress_logs', function (Blueprint $table) {
                $table->index(['user_id', 'date'], 'progress_logs_user_date_idx');
            });
        }

        if (Schema::hasTable('token_transactions')) {
            Schema::table('token_transactions', function (Blueprint $table) {
                $table->index(['user_id', 'type'], 'token_transactions_user_type_idx');
            });
        }
    }

    /**
     * Reverse the migration — drop all added indexes.
     */
    public function down(): void
    {
        if (Schema::hasTable('meal_plans')) {
            Schema::table('meal_plans', function (Blueprint $table) {
                $table->dropIndex('meal_plans_user_date_idx');
            });
        }

        if (Schema::hasTable('meal_items')) {
            Schema::table('meal_items', function (Blueprint $table) {
                $table->dropIndex('meal_items_plan_idx');
                $table->dropIndex('meal_items_plan_consumed_idx');
            });
        }

        if (Schema::hasTable('progress_logs')) {
            Schema::table('progress_logs', function (Blueprint $table) {
                $table->dropIndex('progress_logs_user_date_idx');
            });
        }

        if (Schema::hasTable('token_transactions')) {
            Schema::table('token_transactions', function (Blueprint $table) {
                $table->dropIndex('token_transactions_user_type_idx');
            });
        }
    }
};
