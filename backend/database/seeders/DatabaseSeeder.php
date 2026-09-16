<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user (Permanent Super Admin with Premium access)
        User::firstOrCreate(['email' => 'admin@dietplanner.com'], [
            'name'            => 'Super Admin',
            'password'        => Hash::make('password'),
            'role'            => 'admin',
            'plan_type'       => 'premium',
            'subscription_id' => 'admin_unlimited',
        ]);



        // Seed foods & recipes
        $this->call(FoodSeeder::class);
        $this->call(RecipeSeeder::class);

        // Seed initial sample feedback
        \App\Models\Feedback::firstOrCreate(['title' => 'Mobile Login Screen UX'], [
            'user_id'     => 1,
            'category'    => 'ui',
            'rating'      => 5,
            'message'     => 'The mobile screen fits perfectly without extra scrolling now! Great job.',
            'status'      => 'pending',
            'device_info' => ['screen' => '390x844', 'browser' => 'Mobile Safari', 'platform' => 'iPhone'],
        ]);
    }
}
