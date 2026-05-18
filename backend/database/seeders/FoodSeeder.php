<?php

namespace Database\Seeders;

use App\Models\Food;
use Illuminate\Database\Seeder;

class FoodSeeder extends Seeder
{
    public function run(): void
    {
        $foods = [
            // Grains & Cereals
            ['name' => 'Oats',           'category' => 'Grains',    'calories' => 389, 'protein' => 17,  'carbs' => 66, 'fat' => 7,  'fiber' => 10.6, 'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 55],
            ['name' => 'Brown Rice',     'category' => 'Grains',    'calories' => 216, 'protein' => 5,   'carbs' => 45, 'fat' => 1.8,'fiber' => 3.5,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 50],
            ['name' => 'White Rice',     'category' => 'Grains',    'calories' => 130, 'protein' => 2.7, 'carbs' => 28, 'fat' => 0.3,'fiber' => 0.4,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 73],
            ['name' => 'Whole Wheat Bread','category' => 'Grains',  'calories' => 247, 'protein' => 13,  'carbs' => 41, 'fat' => 4,  'fiber' => 7,    'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => false, 'glycemic_index' => 51],
            ['name' => 'Quinoa',         'category' => 'Grains',    'calories' => 120, 'protein' => 4.4, 'carbs' => 21, 'fat' => 2,  'fiber' => 2.8,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 53],
            ['name' => 'Roti (Chapati)', 'category' => 'Grains',    'calories' => 297, 'protein' => 9.4, 'carbs' => 55, 'fat' => 4.6,'fiber' => 3.9,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 62],

            // Proteins - Vegetarian
            ['name' => 'Paneer',         'category' => 'Dairy',     'calories' => 265, 'protein' => 18,  'carbs' => 3,  'fat' => 21, 'fiber' => 0,    'serving_size' => 100, 'is_veg' => true,  'is_vegan' => false, 'is_jain' => false, 'glycemic_index' => 27],
            ['name' => 'Tofu',           'category' => 'Legumes',   'calories' => 76,  'protein' => 8,   'carbs' => 2,  'fat' => 4.8,'fiber' => 0.3,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 15],
            ['name' => 'Lentils (Dal)',   'category' => 'Legumes',   'calories' => 116, 'protein' => 9,   'carbs' => 20, 'fat' => 0.4,'fiber' => 7.9,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 32],
            ['name' => 'Chickpeas',      'category' => 'Legumes',   'calories' => 164, 'protein' => 8.9, 'carbs' => 27, 'fat' => 2.6,'fiber' => 7.6,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => false, 'glycemic_index' => 28],
            ['name' => 'Greek Yogurt',   'category' => 'Dairy',     'calories' => 97,  'protein' => 9,   'carbs' => 6,  'fat' => 5,  'fiber' => 0,    'serving_size' => 100, 'is_veg' => true,  'is_vegan' => false, 'is_jain' => false, 'glycemic_index' => 11],
            ['name' => 'Milk (Full Fat)','category' => 'Dairy',     'calories' => 61,  'protein' => 3.2, 'carbs' => 4.8,'fat' => 3.3,'fiber' => 0,    'serving_size' => 100, 'is_veg' => true,  'is_vegan' => false, 'is_jain' => false, 'glycemic_index' => 27],
            ['name' => 'Rajma (Kidney Beans)','category' => 'Legumes','calories' => 127,'protein' => 8.7,'carbs' => 22.8,'fat' => 0.5,'fiber' => 6.4, 'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => false, 'glycemic_index' => 24],

            // Proteins - Non-Vegetarian
            ['name' => 'Chicken Breast', 'category' => 'Poultry',   'calories' => 165, 'protein' => 31,  'carbs' => 0,  'fat' => 3.6,'fiber' => 0,    'serving_size' => 100, 'is_veg' => false, 'is_vegan' => false, 'is_jain' => false, 'glycemic_index' => 0],
            ['name' => 'Eggs',           'category' => 'Poultry',   'calories' => 155, 'protein' => 13,  'carbs' => 1.1,'fat' => 11, 'fiber' => 0,    'serving_size' => 100, 'is_veg' => false, 'is_vegan' => false, 'is_jain' => false, 'glycemic_index' => 0],
            ['name' => 'Salmon',         'category' => 'Seafood',   'calories' => 208, 'protein' => 20,  'carbs' => 0,  'fat' => 13, 'fiber' => 0,    'serving_size' => 100, 'is_veg' => false, 'is_vegan' => false, 'is_jain' => false, 'glycemic_index' => 0],
            ['name' => 'Tuna',           'category' => 'Seafood',   'calories' => 144, 'protein' => 23,  'carbs' => 0,  'fat' => 5,  'fiber' => 0,    'serving_size' => 100, 'is_veg' => false, 'is_vegan' => false, 'is_jain' => false, 'glycemic_index' => 0],
            ['name' => 'Mutton (Lamb)',  'category' => 'Meat',      'calories' => 294, 'protein' => 25,  'carbs' => 0,  'fat' => 21, 'fiber' => 0,    'serving_size' => 100, 'is_veg' => false, 'is_vegan' => false, 'is_jain' => false, 'glycemic_index' => 0],

            // Fruits
            ['name' => 'Banana',         'category' => 'Fruits',    'calories' => 89,  'protein' => 1.1, 'carbs' => 23, 'fat' => 0.3,'fiber' => 2.6,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 51],
            ['name' => 'Apple',          'category' => 'Fruits',    'calories' => 52,  'protein' => 0.3, 'carbs' => 14, 'fat' => 0.2,'fiber' => 2.4,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 36],
            ['name' => 'Mango',          'category' => 'Fruits',    'calories' => 60,  'protein' => 0.8, 'carbs' => 15, 'fat' => 0.4,'fiber' => 1.6,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 51],
            ['name' => 'Papaya',         'category' => 'Fruits',    'calories' => 43,  'protein' => 0.5, 'carbs' => 11, 'fat' => 0.3,'fiber' => 1.7,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 60],
            ['name' => 'Orange',         'category' => 'Fruits',    'calories' => 47,  'protein' => 0.9, 'carbs' => 12, 'fat' => 0.1,'fiber' => 2.4,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 45],
            ['name' => 'Watermelon',     'category' => 'Fruits',    'calories' => 30,  'protein' => 0.6, 'carbs' => 7.6,'fat' => 0.2,'fiber' => 0.4,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 72],
            ['name' => 'Strawberry',     'category' => 'Fruits',    'calories' => 32,  'protein' => 0.7, 'carbs' => 7.7,'fat' => 0.3,'fiber' => 2,    'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 41],

            // Vegetables
            ['name' => 'Spinach',        'category' => 'Vegetables','calories' => 23,  'protein' => 2.9, 'carbs' => 3.6,'fat' => 0.4,'fiber' => 2.2,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => false, 'glycemic_index' => 15],
            ['name' => 'Broccoli',       'category' => 'Vegetables','calories' => 34,  'protein' => 2.8, 'carbs' => 7,  'fat' => 0.4,'fiber' => 2.6,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 15],
            ['name' => 'Carrot',         'category' => 'Vegetables','calories' => 41,  'protein' => 0.9, 'carbs' => 10, 'fat' => 0.2,'fiber' => 2.8,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 39],
            ['name' => 'Tomato',         'category' => 'Vegetables','calories' => 18,  'protein' => 0.9, 'carbs' => 3.9,'fat' => 0.2,'fiber' => 1.2,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => false, 'glycemic_index' => 15],
            ['name' => 'Cucumber',       'category' => 'Vegetables','calories' => 15,  'protein' => 0.7, 'carbs' => 3.6,'fat' => 0.1,'fiber' => 0.5,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 15],
            ['name' => 'Sweet Potato',   'category' => 'Vegetables','calories' => 86,  'protein' => 1.6, 'carbs' => 20, 'fat' => 0.1,'fiber' => 3,    'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 63],
            ['name' => 'Mushroom',       'category' => 'Vegetables','calories' => 22,  'protein' => 3.1, 'carbs' => 3.3,'fat' => 0.3,'fiber' => 1,    'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => false, 'glycemic_index' => 10],

            // Nuts & Seeds
            ['name' => 'Almonds',        'category' => 'Nuts',      'calories' => 579, 'protein' => 21,  'carbs' => 22, 'fat' => 50, 'fiber' => 12.5, 'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 0],
            ['name' => 'Walnuts',        'category' => 'Nuts',      'calories' => 654, 'protein' => 15,  'carbs' => 14, 'fat' => 65, 'fiber' => 6.7,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 15],
            ['name' => 'Chia Seeds',     'category' => 'Seeds',     'calories' => 486, 'protein' => 17,  'carbs' => 42, 'fat' => 31, 'fiber' => 34.4, 'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 1],
            ['name' => 'Flax Seeds',     'category' => 'Seeds',     'calories' => 534, 'protein' => 18,  'carbs' => 29, 'fat' => 42, 'fiber' => 27.3, 'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 35],
            ['name' => 'Peanuts',        'category' => 'Nuts',      'calories' => 567, 'protein' => 26,  'carbs' => 16, 'fat' => 49, 'fiber' => 8.5,  'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 14],
            ['name' => 'Makhana (Fox Nut)','category' => 'Snacks',  'calories' => 347, 'protein' => 9.7, 'carbs' => 77, 'fat' => 0.1,'fiber' => 14.5, 'serving_size' => 100, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 55],

            // Oils & Fats
            ['name' => 'Olive Oil',      'category' => 'Oils',      'calories' => 884, 'protein' => 0,   'carbs' => 0,  'fat' => 100,'fiber' => 0,    'serving_size' => 15,  'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 0],
            ['name' => 'Ghee',           'category' => 'Dairy',     'calories' => 900, 'protein' => 0,   'carbs' => 0,  'fat' => 100,'fiber' => 0,    'serving_size' => 15,  'is_veg' => true,  'is_vegan' => false, 'is_jain' => false, 'glycemic_index' => 0],

            // Beverages
            ['name' => 'Green Tea',      'category' => 'Beverages', 'calories' => 1,   'protein' => 0,   'carbs' => 0,  'fat' => 0,  'fiber' => 0,    'serving_size' => 240, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 0],
            ['name' => 'Coconut Water',  'category' => 'Beverages', 'calories' => 19,  'protein' => 0.7, 'carbs' => 3.7,'fat' => 0.2,'fiber' => 1.1,  'serving_size' => 240, 'is_veg' => true,  'is_vegan' => true,  'is_jain' => true,  'glycemic_index' => 54],
        ];

        foreach ($foods as $food) {
            Food::firstOrCreate(['name' => $food['name']], $food);
        }

        $this->command->info('✅ Food database seeded with ' . count($foods) . ' items.');
    }
}
