<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('balance')->default(0);
            $table->timestamps();

            $table->unique('user_id'); // One wallet per user
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_tokens');
    }
};
