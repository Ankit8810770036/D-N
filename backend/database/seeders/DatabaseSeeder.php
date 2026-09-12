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
    }
}
