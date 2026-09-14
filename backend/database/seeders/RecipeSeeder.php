<?php

namespace Database\Seeders;

use App\Models\Food;
use App\Models\Recipe;
use Illuminate\Database\Seeder;

class RecipeSeeder extends Seeder
{
    public function run(): void
    {
        // Clear all legacy recipes so ONLY authentic Indian recipes are present
        Recipe::whereNull('user_id')->delete();

        $recipes = [
            [
                'name' => 'High-Protein Moong Dal Chilla',
                'category' => 'breakfast',
                'description' => 'Crispy and savory golden yellow moong dal crepes loaded with fresh herbs, spices, and grated paneer.',
                'instructions' => "1. Soak yellow moong dal for 2 hours and grind into a smooth batter with ginger and green chili.\n2. Season with cumin, turmeric, and pinch of salt.\n3. Pour a ladle of batter onto a hot non-stick tawa and spread thin.\n4. Top with grated paneer and cook until golden and crisp. Serve hot with mint chutney.",
                'image_url' => '/recipes/moong_chilla.jpg',
                'is_premium' => false,
                'ingredients' => [
                    ['food_name' => 'Moong Dal Chilla', 'quantity' => 120, 'unit' => 'g'],
                    ['food_name' => 'Paneer (Raw / Grilled)', 'quantity' => 40, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Vegetable Poha with Roasted Peanuts',
                'category' => 'breakfast',
                'description' => 'A light and fluffy Maharashtrian staple tempered with mustard seeds, curry leaves, crunchy peanuts, and fresh lemon.',
                'instructions' => "1. Gently rinse poha in a colander and drain.\n2. Heat 1 tsp oil, add mustard seeds, curry leaves, green chilies, and roasted peanuts.\n3. Sauté diced onions and turmeric.\n4. Add drained poha and toss gently on low flame for 2 mins. Garnish with fresh coriander and lemon juice.",
                'image_url' => '/recipes/poha.jpg',
                'is_premium' => false,
                'ingredients' => [
                    ['food_name' => 'Poha (Flattened Rice)', 'quantity' => 120, 'unit' => 'g'],
                    ['food_name' => 'Roasted Peanuts (Moongfali)', 'quantity' => 15, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Steamed Idli with Sambhar',
                'category' => 'breakfast',
                'description' => 'Classic South Indian gut-friendly fermented steamed rice & lentil cakes paired with protein-packed vegetable sambhar.',
                'instructions' => "1. Steam idlis in an idli maker for 10-12 minutes until soft and fluffy.\n2. Prepare vegetable sambhar with toor dal, drumsticks, tomatoes, and sambhar spices.\n3. Serve 3 warm idlis immersed in piping hot sambhar with coconut chutney.",
                'image_url' => '/recipes/idli_sambhar.jpg',
                'is_premium' => false,
                'ingredients' => [
                    ['food_name' => 'Idli (Steamed)', 'quantity' => 120, 'unit' => 'g'],
                    ['food_name' => 'Sambhar (South Indian)', 'quantity' => 160, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Paneer Bhurji with 2 Phulkas & Salad',
                'category' => 'lunch',
                'description' => 'High-protein fresh scrambled paneer sautéed with onions, tomatoes, and aromatic Indian spices, served with warm phulkas.',
                'instructions' => "1. Heat 1 tsp ghee/oil, sauté finely chopped onions, ginger, and green chilies.\n2. Add tomatoes, turmeric, garam masala, and salt until soft.\n3. Crumble fresh paneer into the pan and toss on medium flame for 3 minutes.\n4. Garnish with fresh coriander and serve alongside 2 warm whole wheat phulkas and cucumber salad.",
                'image_url' => '/recipes/paneer_bhurji.jpg',
                'is_premium' => false,
                'ingredients' => [
                    ['food_name' => 'Paneer Bhurji', 'quantity' => 120, 'unit' => 'g'],
                    ['food_name' => 'Phulka', 'quantity' => 60, 'unit' => 'g'],
                    ['food_name' => 'Cucumber (Kheera Salad)', 'quantity' => 80, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Punjabi Rajma Masala with Steamed Basmati Rice',
                'category' => 'lunch',
                'description' => 'Iconic North Indian slow-simmered red kidney beans in a spiced onion-tomato gravy, served over aromatic steamed basmati rice.',
                'instructions' => "1. Pressure cook soaked rajma until melt-in-mouth tender.\n2. In a kadai, sauté pureed onions, ginger-garlic paste, and tomato puree with coriander and cumin powders.\n3. Add cooked rajma along with its broth and simmer for 15 minutes.\n4. Serve over fragrant steamed basmati rice with sliced onions and lemon wedges.",
                'image_url' => '/recipes/rajma_chawal.jpg',
                'is_premium' => false,
                'ingredients' => [
                    ['food_name' => 'Rajma (Kidney Beans)', 'quantity' => 160, 'unit' => 'g'],
                    ['food_name' => 'Steamed Basmati Rice', 'quantity' => 130, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Homestyle Chicken Curry with Rotis',
                'category' => 'dinner',
                'description' => 'Tender chicken pieces simmered in a light, aromatic whole-spice homestyle gravy with whole wheat rotis.',
                'instructions' => "1. Marinate chicken with curd, turmeric, and pinch of salt.\n2. Sauté whole spices (cinnamon, cloves, cardamom), sliced onions, and ginger-garlic paste.\n3. Add tomato puree and chicken pieces; sauté until browned.\n4. Add warm water and simmer covered for 20 minutes. Serve hot with 2 whole wheat rotis.",
                'image_url' => '/recipes/chicken_curry.jpg',
                'is_premium' => false,
                'ingredients' => [
                    ['food_name' => 'Homestyle Chicken Curry', 'quantity' => 170, 'unit' => 'g'],
                    ['food_name' => 'Roti (Chapati)', 'quantity' => 70, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Yellow Moong Dal Tadka with Phulkas & Bhindi',
                'category' => 'lunch',
                'description' => 'Light homestyle yellow moong dal with cumin-garlic tadka, crispy bhindi masala, and soft puffed phulkas.',
                'instructions' => "1. Boil yellow moong dal with turmeric and salt.\n2. In a small pan, temper ghee with cumin seeds, minced garlic, hing, and dried red chilies.\n3. Pour the sizzling tadka over the hot dal.\n4. Serve with 2 fresh phulkas and spiced bhindi sabzi.",
                'image_url' => '/recipes/dal_tadka.jpg',
                'is_premium' => false,
                'ingredients' => [
                    ['food_name' => 'Yellow Moong Dal', 'quantity' => 150, 'unit' => 'g'],
                    ['food_name' => 'Bhindi Masala (Okra)', 'quantity' => 100, 'unit' => 'g'],
                    ['food_name' => 'Phulka', 'quantity' => 60, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Sprouted Moong & Kala Chana Chaat',
                'category' => 'snack',
                'description' => 'Crunchy, zesty Indian fitness chaat made with steamed sprouts, diced cucumber, tomatoes, chaat masala, and fresh lemon.',
                'instructions' => "1. Steam sprouted moong and boiled kala chana for 3 minutes.\n2. Mix with diced cucumber, tomatoes, green chilies, and fresh pomegranate.\n3. Season with rock salt, roasted cumin powder, and chaat masala. Squeeze fresh lemon juice on top.",
                'image_url' => '/recipes/sprouts_chaat.jpg',
                'is_premium' => false,
                'ingredients' => [
                    ['food_name' => 'Sprouts Chaat', 'quantity' => 140, 'unit' => 'g'],
                    ['food_name' => 'Pomegranate (Anar)', 'quantity' => 40, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'High-Protein Soya Chunks Pulao with Raita',
                'category' => 'lunch',
                'description' => 'Fragrant basmati rice cooked with protein-dense soya chunks, carrots, peas, and whole spices with cooling cucumber raita.',
                'instructions' => "1. Soak soya chunks in warm water, squeeze excess moisture, and lightly pan-fry.\n2. In a cooker, sauté whole spices, sliced onions, carrots, and peas.\n3. Add soaked basmati rice and soya chunks with 1.75x water.\n4. Cook for 1 whistle on medium flame. Serve with chilled cucumber mint raita.",
                'image_url' => '/recipes/soya_pulao.jpg',
                'is_premium' => true,
                'ingredients' => [
                    ['food_name' => 'Soya Chunks Curry', 'quantity' => 120, 'unit' => 'g'],
                    ['food_name' => 'Steamed Basmati Rice', 'quantity' => 100, 'unit' => 'g'],
                    ['food_name' => 'Cucumber Raita', 'quantity' => 100, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Palak Paneer with Jowar Roti',
                'category' => 'dinner',
                'description' => 'Vibrant pureed spinach gravy with golden paneer cubes paired with gluten-free, fiber-rich jowar (sorghum) roti.',
                'instructions' => "1. Blanch fresh spinach leaves in boiling water for 2 mins and immediately chill in ice water; blend into a smooth puree.\n2. Sauté garlic, onions, and tomato puree in 1 tsp ghee.\n3. Add the spinach puree, garam masala, and paneer cubes; simmer on low for 4 mins.\n4. Serve hot with freshly made warm Jowar rotis.",
                'image_url' => '/recipes/palak_paneer.jpg',
                'is_premium' => true,
                'ingredients' => [
                    ['food_name' => 'Palak Paneer', 'quantity' => 150, 'unit' => 'g'],
                    ['food_name' => 'Jowar Roti (Sorghum)', 'quantity' => 50, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Desi Egg Bhurji with Whole Wheat Toast',
                'category' => 'breakfast',
                'description' => 'Indian spiced scrambled eggs cooked with chopped onions, green chilies, tomatoes, and cilantro over toasted whole wheat bread.',
                'instructions' => "1. Whisk 2 whole eggs with a splash of milk, salt, and black pepper.\n2. In a pan, sauté onions, green chilies, and tomatoes in 1/2 tsp oil/ghee.\n3. Pour the eggs and scramble gently on medium-low heat until soft and fluffy.\n4. Serve over 2 crisp slices of whole wheat toast with a sprinkle of chaat masala.",
                'image_url' => '/recipes/egg_bhurji.jpg',
                'is_premium' => false,
                'ingredients' => [
                    ['food_name' => 'Egg Bhurji (Indian Scramble)', 'quantity' => 120, 'unit' => 'g'],
                    ['food_name' => 'Whole Wheat Bread', 'quantity' => 55, 'unit' => 'g'],
                ]
            ],
            [
                'name' => 'Comfort Moong Dal Khichdi with Dahi',
                'category' => 'dinner',
                'description' => 'Wholesome, soothing Ayurvedic blend of yellow moong dal and rice cooked with vegetables, cumin, and a dash of desi ghee.',
                'instructions' => "1. Wash equal parts yellow moong dal and rice.\n2. In a cooker, temper cumin seeds, hing, grated ginger, and chopped carrots/peas in 1/2 tsp ghee.\n3. Add dal, rice, turmeric, salt, and 4x water.\n4. Cook for 3 whistles until soft and creamy. Serve warm with 1 bowl of fresh dahi.",
                'image_url' => '/recipes/khichdi.jpg',
                'is_premium' => false,
                'ingredients' => [
                    ['food_name' => 'Moong Dal Khichdi', 'quantity' => 160, 'unit' => 'g'],
                    ['food_name' => 'Curd (Dahi)', 'quantity' => 100, 'unit' => 'g'],
                ]
            ]
        ];

        foreach ($recipes as $rData) {
            $ingredients = $rData['ingredients'];
            unset($rData['ingredients']);

            // Calculate macros from ingredients
            $totCalories = 0;
            $totProtein  = 0;
            $totCarbs    = 0;
            $totFat      = 0;

            $ingredientModels = [];
            foreach ($ingredients as $ing) {
                $food = Food::where('name', $ing['food_name'])->first();
                if ($food) {
                    $ratio = $food->serving_size > 0 ? ($ing['quantity'] / $food->serving_size) : 1;
                    $cal = $food->calories * $ratio;
                    $p   = $food->protein * $ratio;
                    $c   = $food->carbs * $ratio;
                    $f   = $food->fat * $ratio;

                    $totCalories += $cal;
                    $totProtein  += $p;
                    $totCarbs    += $c;
                    $totFat      += $f;

                    $ingredientModels[] = [
                        'food_id'  => $food->id,
                        'quantity' => $ing['quantity'],
                        'unit'     => $ing['unit'] ?? $food->serving_unit,
                    ];
                }
            }

            $rData['calories'] = round($totCalories, 1);
            $rData['protein']  = round($totProtein, 1);
            $rData['carbs']    = round($totCarbs, 1);
            $rData['fat']      = round($totFat, 1);

            $recipe = Recipe::updateOrCreate(
                ['name' => $rData['name']],
                $rData
            );

            // Clean and insert ingredients
            $recipe->ingredients()->delete();

            foreach ($ingredientModels as $ingData) {
                $recipe->ingredients()->create($ingData);
            }
        }

        \Illuminate\Support\Facades\Cache::flush();

        $this->command->info('✅ Indian Recipes database seeded with ' . count($recipes) . ' authentic Indian recipes.');
    }
}
