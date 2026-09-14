<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->enum('food_preference', ['veg', 'non-veg', 'vegan', 'jain', 'keto', 'paleo'])->default('veg')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            Schema::table('user_profiles', function (Blueprint $table) {
                $table->enum('food_preference', ['veg', 'non-veg', 'vegan', 'jain'])->default('veg')->change();
            });
        }
    }
};
