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
        Schema::table('foods', function (Blueprint $table) {
            $table->json('allergens')->nullable();
            $table->boolean('is_low_sodium')->default(true);
            $table->boolean('is_thyroid_friendly')->default(true);
            $table->boolean('is_heart_friendly')->default(true);
            $table->boolean('is_pcod_friendly')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('foods', function (Blueprint $table) {
            $table->dropColumn([
                'allergens',
                'is_low_sodium',
                'is_thyroid_friendly',
                'is_heart_friendly',
                'is_pcod_friendly'
            ]);
        });
    }
};
