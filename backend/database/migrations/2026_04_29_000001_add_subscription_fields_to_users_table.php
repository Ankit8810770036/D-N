<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('subscription_id')->nullable()->after('plan_type');
            $table->timestamp('subscribed_at')->nullable()->after('subscription_id');
            $table->timestamp('subscription_expires_at')->nullable()->after('subscribed_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['subscription_id', 'subscribed_at', 'subscription_expires_at']);
        });
    }
};
