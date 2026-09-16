<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add indexes for high-frequency filters, joins, and sorting columns
     * to eliminate query bottlenecks and full-table scans.
     */
    public function up(): void
    {
        if (Schema::hasTable('feedbacks')) {
            Schema::table('feedbacks', function (Blueprint $table) {
                $table->index(['user_id', 'status'], 'feedbacks_user_status_idx');
                $table->index(['status', 'category'], 'feedbacks_status_category_idx');
                $table->index('rating', 'feedbacks_rating_idx');
            });
        }

        if (Schema::hasTable('recipes')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->index(['user_id', 'category'], 'recipes_user_category_idx');
                $table->index('is_premium', 'recipes_is_premium_idx');
            });
        }

        if (Schema::hasTable('recipe_ingredients')) {
            Schema::table('recipe_ingredients', function (Blueprint $table) {
                $table->index(['recipe_id', 'food_id'], 'recipe_ingredients_recipe_food_idx');
            });
        }

        if (Schema::hasTable('foods')) {
            Schema::table('foods', function (Blueprint $table) {
                $table->index(['user_id', 'category'], 'foods_user_category_idx');
                $table->index(['is_veg', 'category'], 'foods_is_veg_category_idx');
                $table->index('name', 'foods_name_idx');
            });
        }

        if (Schema::hasTable('user_badges')) {
            Schema::table('user_badges', function (Blueprint $table) {
                $table->index(['user_id', 'badge_type'], 'user_badges_user_badge_idx');
            });
        }

        if (Schema::hasTable('token_transactions')) {
            Schema::table('token_transactions', function (Blueprint $table) {
                $table->index(['user_id', 'reason', 'created_at'], 'token_transactions_user_reason_date_idx');
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index('role', 'users_role_idx');
                $table->index('plan_type', 'users_plan_type_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('feedbacks')) {
            Schema::table('feedbacks', function (Blueprint $table) {
                $table->dropIndex('feedbacks_user_status_idx');
                $table->dropIndex('feedbacks_status_category_idx');
                $table->dropIndex('feedbacks_rating_idx');
            });
        }

        if (Schema::hasTable('recipes')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->dropIndex('recipes_user_category_idx');
                $table->dropIndex('recipes_is_premium_idx');
            });
        }

        if (Schema::hasTable('recipe_ingredients')) {
            Schema::table('recipe_ingredients', function (Blueprint $table) {
                $table->dropIndex('recipe_ingredients_recipe_food_idx');
            });
        }

        if (Schema::hasTable('foods')) {
            Schema::table('foods', function (Blueprint $table) {
                $table->dropIndex('foods_user_category_idx');
                $table->dropIndex('foods_is_veg_category_idx');
                $table->dropIndex('foods_name_idx');
            });
        }

        if (Schema::hasTable('user_badges')) {
            Schema::table('user_badges', function (Blueprint $table) {
                $table->dropIndex('user_badges_user_badge_idx');
            });
        }

        if (Schema::hasTable('token_transactions')) {
            Schema::table('token_transactions', function (Blueprint $table) {
                $table->dropIndex('token_transactions_user_reason_date_idx');
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex('users_role_idx');
                $table->dropIndex('users_plan_type_idx');
            });
        }
    }
};
