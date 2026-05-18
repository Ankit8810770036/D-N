<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meal_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->decimal('total_calories', 7, 2)->default(0);
            $table->decimal('protein_target', 6, 2)->default(0);
            $table->decimal('carbs_target', 6, 2)->default(0);
            $table->decimal('fat_target', 6, 2)->default(0);
            $table->decimal('water_intake_liters', 4, 2)->default(2.0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meal_plans');
    }
};
