<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('age')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->decimal('height_cm', 5, 2)->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->decimal('waist_cm', 5, 2)->nullable();
            $table->enum('goal', ['lose', 'gain', 'maintain'])->default('maintain');
            $table->enum('activity_level', ['sedentary', 'light', 'moderate', 'active', 'very_active'])->default('sedentary');
            $table->decimal('sleep_hours', 3, 1)->nullable();
            $table->json('diseases')->nullable();
            $table->json('allergies')->nullable();
            $table->enum('food_preference', ['veg', 'non-veg', 'vegan', 'jain'])->default('veg');
            // Computed fields
            $table->decimal('bmi', 5, 2)->nullable();
            $table->decimal('bmr', 7, 2)->nullable();
            $table->decimal('tdee', 7, 2)->nullable();
            $table->decimal('calories_target', 7, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
