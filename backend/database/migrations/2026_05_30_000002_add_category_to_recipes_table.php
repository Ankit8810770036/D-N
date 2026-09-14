<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add a dedicated 'category' column to the recipes table.
     *
     * Previously, category filtering was done via a LIKE search on the
     * 'description' column — which was inaccurate and unreliable.
     * This column enables exact, indexed category filtering.
     *
     * Common categories: breakfast, lunch, dinner, snack, dessert, drink
     */
    public function up(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $table->string('category')->nullable()->default('general');
            $table->index('category', 'recipes_category_idx');
        });
    }

    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $table->dropIndex('recipes_category_idx');
            $table->dropColumn('category');
        });
    }
};
