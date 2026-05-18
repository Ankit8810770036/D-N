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
        Schema::table('progress_logs', function (Blueprint $table) {
            $table->decimal('protein', 8, 2)->nullable()->after('calories_consumed');
            $table->decimal('carbs', 8, 2)->nullable()->after('protein');
            $table->decimal('fat', 8, 2)->nullable()->after('carbs');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('progress_logs', function (Blueprint $table) {
            $table->dropColumn(['protein', 'carbs', 'fat']);
        });
    }
};
