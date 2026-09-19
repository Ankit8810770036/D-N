<?php

require 'c:/Users/Ankit kumar singh/Desktop/myProject/Diet and Nutrition Planner Based on Health Metrics/backend/vendor/autoload.php';

$app = require_once 'c:/Users/Ankit kumar singh/Desktop/myProject/Diet and Nutrition Planner Based on Health Metrics/backend/bootstrap/app.php';

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;
use App\Models\Recipe;

$cloudName = env('CLOUDINARY_CLOUD_NAME');
$apiKey    = env('CLOUDINARY_API_KEY');
$apiSecret = env('CLOUDINARY_API_SECRET');

if (!$cloudName || !$apiKey || !$apiSecret) {
    die("Cloudinary credentials missing in .env!\n");
}

function uploadImageToCloudinary($filePath, $folder, $publicId, $cloudName, $apiKey, $apiSecret) {
    $timestamp = time();
    $signatureString = "folder={$folder}&public_id={$publicId}&timestamp={$timestamp}" . $apiSecret;
    $signature = sha1($signatureString);

    $response = Http::timeout(30)
        ->attach('file', file_get_contents($filePath), basename($filePath))
        ->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload", [
            'api_key'   => $apiKey,
            'timestamp' => $timestamp,
            'folder'    => $folder,
            'public_id' => $publicId,
            'signature' => $signature,
        ]);

    if ($response->successful()) {
        $data = $response->json();
        $secureUrl = $data['secure_url'] ?? $data['url'] ?? null;
        if ($secureUrl) {
            // Apply auto-format and auto-quality
            return preg_replace(
                '#/upload/(?:v\d+/)?#',
                '/upload/f_auto,q_auto/',
                $secureUrl
            ) ?: $secureUrl;
        }
    }

    echo "Upload failed for {$publicId}: " . $response->body() . "\n";
    return null;
}

echo "=== 1. UPLOADING WORKOUT IMAGES TO CLOUDINARY ===\n";
$workoutsDir = 'c:/Users/Ankit kumar singh/Desktop/myProject/Diet and Nutrition Planner Based on Health Metrics/frontend/public/workouts';
$workoutFiles = glob($workoutsDir . '/*.jpg');
$workoutMap = [];

foreach ($workoutFiles as $file) {
    $base = basename($file, '.jpg');
    $folder = 'diet-planner/workouts';
    $publicId = $base;
    echo "Uploading workout: {$base}... ";
    
    $cdnUrl = uploadImageToCloudinary($file, $folder, $publicId, $cloudName, $apiKey, $apiSecret);
    if ($cdnUrl) {
        $workoutMap['/workouts/' . basename($file)] = $cdnUrl;
        echo "OK -> {$cdnUrl}\n";
    }
}

echo "\n=== 2. UPLOADING RECIPE / COOKBOOK IMAGES TO CLOUDINARY ===\n";
$recipesDir = 'c:/Users/Ankit kumar singh/Desktop/myProject/Diet and Nutrition Planner Based on Health Metrics/frontend/public/recipes';
$recipeFiles = glob($recipesDir . '/*.jpg');
$recipeMap = [];

foreach ($recipeFiles as $file) {
    $base = basename($file, '.jpg');
    $folder = 'diet-planner/recipes';
    $publicId = $base;
    echo "Uploading recipe: {$base}... ";
    
    $cdnUrl = uploadImageToCloudinary($file, $folder, $publicId, $cloudName, $apiKey, $apiSecret);
    if ($cdnUrl) {
        $recipeMap['/recipes/' . basename($file)] = $cdnUrl;
        echo "OK -> {$cdnUrl}\n";
    }
}

// Save the URL mapping JSON for reference
$mapping = [
    'workouts' => $workoutMap,
    'recipes'  => $recipeMap,
];
file_put_contents(__DIR__ . '/cloudinary_mapping.json', json_encode($mapping, JSON_PRETTY_PRINT));

echo "\n=== 3. UPDATING DATABASE RECIPE RECORDS ===\n";
foreach ($recipeMap as $localPath => $cdnUrl) {
    $affected = Recipe::where('image_url', $localPath)->update(['image_url' => $cdnUrl]);
    echo "Updated {$affected} record(s) for {$localPath}\n";
}

echo "\n=== ALL ASSETS MIGRATED SUCCESSFULLY TO CLOUDINARY! ===\n";
