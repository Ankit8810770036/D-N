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
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('category')->default('general'); // bug, feature, accuracy, ui, general
            $table->unsignedTinyInteger('rating')->default(5); // 1-5 stars
            $table->string('title')->nullable();
            $table->text('message');
            $table->json('device_info')->nullable();
            $table->string('status')->default('pending'); // pending, reviewed, resolved
            $table->timestamps();

            $table->index(['category', 'status']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};
