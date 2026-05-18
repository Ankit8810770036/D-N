<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::firstOrCreate(['email' => 'admin@dietplanner.com'], [
            'name'     => 'Super Admin',
            'password' => Hash::make('password'),
            'role'     => 'admin',
        ]);



        // Demo user
        User::firstOrCreate(['email' => 'demo@dietplanner.com'], [
            'name'     => 'Demo User',
            'password' => Hash::make('password'),
            'role'     => 'user',
        ]);

        // Seed foods
        $this->call(FoodSeeder::class);
    }
}
