<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('foods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->nullable();
            $table->decimal('calories', 7, 2)->default(0);
            $table->decimal('protein', 6, 2)->default(0);
            $table->decimal('carbs', 6, 2)->default(0);
            $table->decimal('fat', 6, 2)->default(0);
            $table->decimal('fiber', 6, 2)->default(0);
            $table->json('vitamins')->nullable();
            $table->decimal('serving_size', 6, 2)->default(100);
            $table->string('serving_unit')->default('g');
            $table->boolean('is_veg')->default(true);
            $table->boolean('is_vegan')->default(false);
            $table->boolean('is_jain')->default(false);
            $table->decimal('glycemic_index', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('foods');
    }
};
