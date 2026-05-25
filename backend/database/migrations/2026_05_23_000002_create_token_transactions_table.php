<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('token_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['earn', 'spend']);
            $table->string('reason'); // e.g. 'daily_login', 'workout_logged', 'premium_redeem'
            $table->integer('amount'); // positive = earn, negative = spend
            $table->json('meta')->nullable(); // e.g. {"date": "2026-05-23", "discount_inr": 100}
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'reason', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('token_transactions');
    }
};
