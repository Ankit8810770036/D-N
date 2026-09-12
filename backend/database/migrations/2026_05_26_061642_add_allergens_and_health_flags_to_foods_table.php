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
            $table->json('allergens')->nullable()->after('glycemic_index');
            $table->boolean('is_low_sodium')->default(true)->after('allergens');
            $table->boolean('is_thyroid_friendly')->default(true)->after('is_low_sodium');
            $table->boolean('is_heart_friendly')->default(true)->after('is_thyroid_friendly');
            $table->boolean('is_pcod_friendly')->default(true)->after('is_heart_friendly');
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
