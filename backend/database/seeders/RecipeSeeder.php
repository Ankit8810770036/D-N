<?php

namespace Database\Seeders;

use App\Models\Food;
use App\Models\Recipe;
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
                'image_url' => 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&q=80&w=600',
                'is_premium' => false,
                'ingredients' => [
                    ['name' => 'Oats', 'quantity' => 50, 'unit' => 'g', 'calories' => 389, 'protein' => 17, 'carbs' => 66, 'fat' => 7, 'category' => 'Grains', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Milk (Full Fat)', 'quantity' => 200, 'unit' => 'ml', 'calories' => 61, 'protein' => 3.2, 'carbs' => 4.8, 'fat' => 3.3, 'category' => 'Dairy', 'is_veg' => true, 'is_vegan' => false, 'is_jain' => false],
                    ['name' => 'Banana', 'quantity' => 100, 'unit' => 'g', 'calories' => 89, 'protein' => 1.1, 'carbs' => 23, 'fat' => 0.3, 'category' => 'Fruits', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Almonds', 'quantity' => 10, 'unit' => 'g', 'calories' => 579, 'protein' => 21, 'carbs' => 22, 'fat' => 50, 'category' => 'Nuts', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                ]
            ],
            [
                'name' => 'Quinoa Chickpea Salad',
                'description' => 'A refreshing Mediterranean salad with quinoa, chickpeas, fresh cucumber, and tomatoes.',
                'instructions' => '1. Rinse and cook quinoa. 2. Toss with chickpeas, diced cucumber, and tomato. 3. Drizzle with olive oil and fresh herbs.',
                'image_url' => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600',
                'is_premium' => true,
                'ingredients' => [
                    ['name' => 'Quinoa', 'quantity' => 100, 'unit' => 'g', 'calories' => 120, 'protein' => 4.4, 'carbs' => 21, 'fat' => 2, 'category' => 'Grains', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Chickpeas', 'quantity' => 50, 'unit' => 'g', 'calories' => 164, 'protein' => 8.9, 'carbs' => 27, 'fat' => 2.6, 'category' => 'Legumes', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => false],
                    ['name' => 'Cucumber', 'quantity' => 50, 'unit' => 'g', 'calories' => 15, 'protein' => 0.7, 'carbs' => 3.6, 'fat' => 0.1, 'category' => 'Vegetables', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Tomato', 'quantity' => 50, 'unit' => 'g', 'calories' => 18, 'protein' => 0.9, 'carbs' => 3.9, 'fat' => 0.2, 'category' => 'Vegetables', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => false],
                    ['name' => 'Olive Oil', 'quantity' => 10, 'unit' => 'ml', 'calories' => 884, 'protein' => 0, 'carbs' => 0, 'fat' => 100, 'category' => 'Oils', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                ]
            ],
            [
                'name' => 'Healthy Egg Toast',
                'description' => 'Crispy whole wheat toast topped with seasoned boiled eggs and olive oil.',
                'instructions' => '1. Toast whole wheat bread. 2. Slice boiled eggs evenly. 3. Place on toast and season with pepper.',
                'image_url' => 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600',
                'is_premium' => false,
                'ingredients' => [
                    ['name' => 'Whole Wheat Bread', 'quantity' => 60, 'unit' => 'g', 'calories' => 247, 'protein' => 13, 'carbs' => 41, 'fat' => 4, 'category' => 'Grains', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => false],
                    ['name' => 'Eggs', 'quantity' => 100, 'unit' => 'g', 'calories' => 155, 'protein' => 13, 'carbs' => 1.1, 'fat' => 11, 'category' => 'Poultry', 'is_veg' => false, 'is_vegan' => false, 'is_jain' => false],
                    ['name' => 'Olive Oil', 'quantity' => 5, 'unit' => 'ml', 'calories' => 884, 'protein' => 0, 'carbs' => 0, 'fat' => 100, 'category' => 'Oils', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                ]
            ],
            [
                'name' => 'Grilled Paneer Power Bowl',
                'description' => 'Protein-packed golden paneer cubes paired with warm brown rice, fresh spinach, and broccoli.',
                'instructions' => '1. Season and lightly grill paneer in olive oil until golden. 2. Steam broccoli florets and sauté spinach. 3. Serve over warm brown rice with roasted flax seeds.',
                'image_url' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
                'is_premium' => false,
                'ingredients' => [
                    ['name' => 'Paneer', 'quantity' => 120, 'unit' => 'g', 'calories' => 265, 'protein' => 18, 'carbs' => 3, 'fat' => 21, 'category' => 'Dairy', 'is_veg' => true, 'is_vegan' => false, 'is_jain' => false],
                    ['name' => 'Brown Rice', 'quantity' => 100, 'unit' => 'g', 'calories' => 216, 'protein' => 5, 'carbs' => 45, 'fat' => 1.8, 'category' => 'Grains', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Spinach', 'quantity' => 60, 'unit' => 'g', 'calories' => 23, 'protein' => 2.9, 'carbs' => 3.6, 'fat' => 0.4, 'category' => 'Vegetables', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => false],
                    ['name' => 'Broccoli', 'quantity' => 70, 'unit' => 'g', 'calories' => 34, 'protein' => 2.8, 'carbs' => 7, 'fat' => 0.4, 'category' => 'Vegetables', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Olive Oil', 'quantity' => 5, 'unit' => 'ml', 'calories' => 884, 'protein' => 0, 'carbs' => 0, 'fat' => 100, 'category' => 'Oils', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                ]
            ],
            [
                'name' => 'Mediterranean Grilled Salmon',
                'description' => 'Heart-healthy pan-seared wild salmon served over fluffy quinoa, diced cucumber, and cherry tomatoes.',
                'instructions' => '1. Season salmon fillet with herbs and sear in olive oil for 4 mins each side. 2. Fluff cooked quinoa. 3. Plate salmon alongside fresh cucumber and tomato salad.',
                'image_url' => 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=600',
                'is_premium' => true,
                'ingredients' => [
                    ['name' => 'Salmon', 'quantity' => 140, 'unit' => 'g', 'calories' => 208, 'protein' => 20, 'carbs' => 0, 'fat' => 13, 'category' => 'Seafood', 'is_veg' => false, 'is_vegan' => false, 'is_jain' => false],
                    ['name' => 'Quinoa', 'quantity' => 80, 'unit' => 'g', 'calories' => 120, 'protein' => 4.4, 'carbs' => 21, 'fat' => 2, 'category' => 'Grains', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Cucumber', 'quantity' => 50, 'unit' => 'g', 'calories' => 15, 'protein' => 0.7, 'carbs' => 3.6, 'fat' => 0.1, 'category' => 'Vegetables', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Tomato', 'quantity' => 50, 'unit' => 'g', 'calories' => 18, 'protein' => 0.9, 'carbs' => 3.9, 'fat' => 0.2, 'category' => 'Vegetables', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => false],
                    ['name' => 'Olive Oil', 'quantity' => 8, 'unit' => 'ml', 'calories' => 884, 'protein' => 0, 'carbs' => 0, 'fat' => 100, 'category' => 'Oils', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                ]
            ],
            [
                'name' => 'High-Protein Chicken & Sweet Potato',
                'description' => 'Juicy grilled chicken breast served with roasted sweet potato mash and steamed broccoli.',
                'instructions' => '1. Marinate chicken breast in garlic, salt, and pepper, then grill until cooked through. 2. Steam broccoli and bake or mash sweet potato. 3. Serve warm.',
                'image_url' => 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&q=80&w=600',
                'is_premium' => false,
                'ingredients' => [
                    ['name' => 'Chicken Breast', 'quantity' => 160, 'unit' => 'g', 'calories' => 165, 'protein' => 31, 'carbs' => 0, 'fat' => 3.6, 'category' => 'Poultry', 'is_veg' => false, 'is_vegan' => false, 'is_jain' => false],
                    ['name' => 'Sweet Potato', 'quantity' => 120, 'unit' => 'g', 'calories' => 86, 'protein' => 1.6, 'carbs' => 20, 'fat' => 0.1, 'category' => 'Vegetables', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Broccoli', 'quantity' => 80, 'unit' => 'g', 'calories' => 34, 'protein' => 2.8, 'carbs' => 7, 'fat' => 0.4, 'category' => 'Vegetables', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Olive Oil', 'quantity' => 5, 'unit' => 'ml', 'calories' => 884, 'protein' => 0, 'carbs' => 0, 'fat' => 100, 'category' => 'Oils', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                ]
            ],
            [
                'name' => 'Greek Yogurt Berry Parfait',
                'description' => 'Creamy probiotic Greek yogurt layered with sliced banana, fresh strawberries, and crunchy chia seeds.',
                'instructions' => '1. Spoon Greek yogurt into a bowl or parfait glass. 2. Layer with sliced banana and fresh strawberries. 3. Garnish with chia seeds and crushed almonds.',
                'image_url' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600',
                'is_premium' => false,
                'ingredients' => [
                    ['name' => 'Greek Yogurt', 'quantity' => 160, 'unit' => 'g', 'calories' => 97, 'protein' => 9, 'carbs' => 6, 'fat' => 5, 'category' => 'Dairy', 'is_veg' => true, 'is_vegan' => false, 'is_jain' => false],
                    ['name' => 'Banana', 'quantity' => 60, 'unit' => 'g', 'calories' => 89, 'protein' => 1.1, 'carbs' => 23, 'fat' => 0.3, 'category' => 'Fruits', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Strawberry', 'quantity' => 50, 'unit' => 'g', 'calories' => 32, 'protein' => 0.7, 'carbs' => 7.7, 'fat' => 0.3, 'category' => 'Fruits', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Chia Seeds', 'quantity' => 10, 'unit' => 'g', 'calories' => 486, 'protein' => 17, 'carbs' => 42, 'fat' => 31, 'category' => 'Seeds', 'is_veg' => true, 'is_vegan' => true, 'is_jain' => true],
                    ['name' => 'Almonds', 'quantity' => 12, 'unit' => 'g', 'calories' => 579, 'protein' => 21, 'carbs' => 22, 'fat' => 50, 'category' => 'Nuts', 'is_veg' => true, 'is_veg' => true, 'is_jain' => true],
                ]
            ]
        ];

        foreach ($recipes as $rData) {
            $ingredients = $rData['ingredients'];
            unset($rData['ingredients']);

            $recipe = Recipe::updateOrCreate(
                ['name' => $rData['name']],
                $rData
            );

            // Clean old recipe ingredients to prevent duplicates upon re-seeding
            $recipe->ingredients()->delete();

            $totalCalories = 0;
            $totalProtein  = 0;
            $totalCarbs    = 0;
            $totalFat      = 0;

            foreach ($ingredients as $ing) {
                $food = Food::where('name', $ing['name'])->first();

                if (!$food) {
                    $food = Food::create([
                        'name'                 => $ing['name'],
                        'category'             => $ing['category'] ?? 'Other',
                        'calories'             => $ing['calories'] ?? 100,
                        'protein'              => $ing['protein'] ?? 5,
                        'carbs'                => $ing['carbs'] ?? 10,
                        'fat'                  => $ing['fat'] ?? 2,
                        'fiber'                => 1.0,
                        'serving_size'         => 100,
                        'serving_unit'         => in_array($ing['unit'], ['ml', 'l']) ? 'ml' : 'g',
                        'is_veg'               => $ing['is_veg'] ?? true,
                        'is_vegan'             => $ing['is_vegan'] ?? true,
                        'is_jain'              => $ing['is_jain'] ?? false,
                        'glycemic_index'       => 25,
                        'allergens'            => [],
                        'is_low_sodium'        => true,
                        'is_thyroid_friendly'  => true,
                        'is_heart_friendly'    => true,
                        'is_pcod_friendly'     => true,
                    ]);
                }

                $servingSize = $food->serving_size > 0 ? $food->serving_size : 100;
                $ratio = $ing['quantity'] / $servingSize;

                $recipe->ingredients()->create([
                    'food_id'  => $food->id,
                    'quantity' => $ing['quantity'],
                    'unit'     => $ing['unit'],
                ]);

                $totalCalories += $food->calories * $ratio;
                $totalProtein  += $food->protein * $ratio;
                $totalCarbs    += $food->carbs * $ratio;
                $totalFat      += $food->fat * $ratio;
            }

            $recipe->update([
                'calories' => round($totalCalories, 1),
                'protein'  => round($totalProtein, 1),
                'carbs'    => round($totalCarbs, 1),
                'fat'      => round($totalFat, 1),
            ]);
        }
    }
}

