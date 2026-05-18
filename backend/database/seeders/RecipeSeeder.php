<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RecipeSeeder extends Seeder
{
    public function run(): void
    {
        $recipes = [
            [
                'name' => 'Protein Oatmeal',
                'description' => 'A hearty and healthy breakfast with oats, banana, and almonds.',
                'instructions' => '1. Boil oats in milk. 2. Slice banana. 3. Add almonds on top.',
                'image_url' => 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&q=80&w=400',
                'is_premium' => false,
                'ingredients' => [
                    ['name' => 'Oats', 'quantity' => 50, 'unit' => 'g'],
                    ['name' => 'Milk (Full Fat)', 'quantity' => 200, 'unit' => 'ml'],
                    ['name' => 'Banana', 'quantity' => 100, 'unit' => 'g'],
                    ['name' => 'Almonds', 'quantity' => 10, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Quinoa Chickpea Salad',
                'description' => 'A refreshing Mediterranean salad with quinoa and chickpeas.',
                'instructions' => '1. Rinse and cook quinoa. 2. Toss with chickpeas, diced cucumber, and tomato. 3. Drizzle with olive oil.',
                'image_url' => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400',
                'is_premium' => true,
                'ingredients' => [
                    ['name' => 'Quinoa', 'quantity' => 100, 'unit' => 'g'],
                    ['name' => 'Chickpeas', 'quantity' => 50, 'unit' => 'g'],
                    ['name' => 'Cucumber', 'quantity' => 50, 'unit' => 'g'],
                    ['name' => 'Tomato', 'quantity' => 50, 'unit' => 'g'],
                    ['name' => 'Olive Oil', 'quantity' => 10, 'unit' => 'ml'],
                ]
            ],
            [
                'name' => 'Healthy Egg Toast',
                'description' => 'Simple whole wheat toast with boiled eggs.',
                'instructions' => '1. Toast bread. 2. Slice boiled eggs. 3. Place on toast and season.',
                'image_url' => 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=400',
                'is_premium' => false,
                'ingredients' => [
                    ['name' => 'Whole Wheat Bread', 'quantity' => 60, 'unit' => 'g'],
                    ['name' => 'Eggs', 'quantity' => 100, 'unit' => 'g'],
                    ['name' => 'Olive Oil', 'quantity' => 5, 'unit' => 'ml'],
                ]
            ]
        ];

        foreach ($recipes as $rData) {
            $ingredients = $rData['ingredients'];
            unset($rData['ingredients']);

            $recipe = \App\Models\Recipe::firstOrCreate(['name' => $rData['name']], $rData);

            $totalCalories = 0;
            $totalProtein = 0;
            $totalCarbs = 0;
            $totalFat = 0;

            foreach ($ingredients as $ing) {
                $food = \App\Models\Food::where('name', $ing['name'])->first();
                if ($food) {
                    $ratio = $ing['quantity'] / $food->serving_size;
                    $recipe->ingredients()->create([
                        'food_id' => $food->id,
                        'quantity' => $ing['quantity'],
                        'unit' => $ing['unit'],
                    ]);

                    $totalCalories += $food->calories * $ratio;
                    $totalProtein += $food->protein * $ratio;
                    $totalCarbs += $food->carbs * $ratio;
                    $totalFat += $food->fat * $ratio;
                }
            }

            $recipe->update([
                'calories' => $totalCalories,
                'protein' => $totalProtein,
                'carbs' => $totalCarbs,
                'fat' => $totalFat,
            ]);
        }
    }
}
