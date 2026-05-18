<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('progress_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->decimal('weight', 5, 2)->nullable();
            $table->decimal('calories_consumed', 7, 2)->nullable();
            $table->decimal('water_intake_liters', 4, 2)->nullable();
            $table->integer('steps')->nullable();
            $table->decimal('sleep_hours', 3, 1)->nullable();
            $table->boolean('workout_done')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('progress_logs');
    }
};
