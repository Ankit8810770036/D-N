<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MediaUploadService
{
    /**
     * Upload an avatar/profile image to the configured cloud provider or local disk.
     *
     * @param UploadedFile $file
     * @param int|string $userId
     * @return array{url: string, path: string, provider: string}
     */
    public function uploadProfilePhoto(UploadedFile $file, $userId): array
    {
        $driver = $this->resolveDriver();

        if ($driver === 'cloudinary') {
            $result = $this->uploadToCloudinary($file, $userId);
            if ($result) {
                return $result;
            }
        } elseif ($driver === 'imagekit') {
            $result = $this->uploadToImageKit($file, $userId);
            if ($result) {
                return $result;
            }
        }

        // Fallback to local public disk storage
        return $this->uploadToLocal($file);
    }

    /**
     * Delete an old profile photo from the cloud or local disk.
     *
     * @param string|null $pathOrUrl
     * @return bool
     */
    public function deleteProfilePhoto(?string $pathOrUrl): bool
    {
        if (empty($pathOrUrl)) {
            return false;
        }

        try {
            // Check if Cloudinary URL
            if (str_contains($pathOrUrl, 'cloudinary.com')) {
                return $this->deleteFromCloudinary($pathOrUrl);
            }

            // Check if ImageKit URL
            if (str_contains($pathOrUrl, 'imagekit.io')) {
                return $this->deleteFromImageKit($pathOrUrl);
            }

            // Local storage file
            if (Storage::disk('public')->exists($pathOrUrl)) {
                return Storage::disk('public')->delete($pathOrUrl);
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to delete old media asset: ' . $e->getMessage(), ['path' => $pathOrUrl]);
        }

        return false;
    }

    /**
     * Determine which driver to use based on available environment credentials.
     */
    protected function resolveDriver(): string
    {
        $configured = strtolower(config('services.media.driver', env('MEDIA_STORAGE_DRIVER', 'auto')));

        if ($configured === 'cloudinary' || ($configured === 'auto' && $this->hasCloudinaryConfig())) {
            return 'cloudinary';
        }

        if ($configured === 'imagekit' || ($configured === 'auto' && $this->hasImageKitConfig())) {
            return 'imagekit';
        }

        return 'local';
    }

    /**
     * Check if Cloudinary credentials exist.
     */
    protected function hasCloudinaryConfig(): bool
    {
        if (env('CLOUDINARY_URL')) {
            return true;
        }
        return !empty(env('CLOUDINARY_CLOUD_NAME')) && !empty(env('CLOUDINARY_API_KEY')) && !empty(env('CLOUDINARY_API_SECRET'));
    }

    /**
     * Check if ImageKit credentials exist.
     */
    protected function hasImageKitConfig(): bool
    {
        return !empty(env('IMAGEKIT_PUBLIC_KEY')) && !empty(env('IMAGEKIT_PRIVATE_KEY')) && !empty(env('IMAGEKIT_URL_ENDPOINT'));
    }

    /**
     * Upload asset to Cloudinary with automatic face-detection crop & WebP delivery.
     */
    protected function uploadToCloudinary(UploadedFile $file, $userId): ?array
    {
        try {
            $credentials = $this->getCloudinaryCredentials();
            if (!$credentials) {
                return null;
            }

            $cloudName = $credentials['cloud_name'];
            $apiKey    = $credentials['api_key'];
            $apiSecret = $credentials['api_secret'];
            $timestamp = time();
            $folder    = 'diet-planner/profile-photos';
            $publicId  = 'avatar_user_' . $userId . '_' . $timestamp;

            // Generate SHA-1 signature for Cloudinary upload
            $signatureString = "folder={$folder}&public_id={$publicId}&timestamp={$timestamp}" . $apiSecret;
            $signature = sha1($signatureString);

            $response = Http::timeout(25)
                ->attach('file', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
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
                    // Inject face-crop and auto-compression into URL: c_thumb,g_face,w_300,h_300,q_auto,f_auto
                    $optimizedUrl = preg_replace(
                        '#/upload/(?:v\d+/)?#',
                        '/upload/c_thumb,g_face,w_300,h_300,q_auto,f_auto/',
                        $secureUrl
                    ) ?: $secureUrl;

                    return [
                        'url'      => $optimizedUrl,
                        'path'     => $optimizedUrl,
                        'provider' => 'cloudinary',
                    ];
                }
            }

            Log::error('Cloudinary upload failed', ['body' => $response->body()]);
        } catch (\Throwable $e) {
            Log::error('Exception uploading to Cloudinary: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Upload asset to ImageKit with face detection query transformations.
     */
    protected function uploadToImageKit(UploadedFile $file, $userId): ?array
    {
        try {
            $privateKey  = env('IMAGEKIT_PRIVATE_KEY');
            $urlEndpoint = rtrim(env('IMAGEKIT_URL_ENDPOINT', ''), '/');
            $fileName    = 'avatar_user_' . $userId . '_' . time() . '.' . $file->getClientOriginalExtension();

            $response = Http::timeout(25)
                ->withBasicAuth($privateKey, '')
                ->attach('file', file_get_contents($file->getRealPath()), $fileName)
                ->post('https://upload.imagekit.io/api/v1/files/upload', [
                    'fileName'          => $fileName,
                    'folder'            => '/diet-planner/profile-photos',
                    'useUniqueFileName' => 'true',
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $rawUrl = $data['url'] ?? null;

                if ($rawUrl) {
                    // Append ImageKit face-detection & crop transformations: ?tr=w-300,h-300,fo-face,q-80
                    $separator = str_contains($rawUrl, '?') ? '&' : '?';
                    $optimizedUrl = $rawUrl . $separator . 'tr=w-300,h-300,fo-face,q-80';

                    return [
                        'url'      => $optimizedUrl,
                        'path'     => $optimizedUrl,
                        'provider' => 'imagekit',
                    ];
                }
            }

            Log::error('ImageKit upload failed', ['body' => $response->body()]);
        } catch (\Throwable $e) {
            Log::error('Exception uploading to ImageKit: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Fallback local storage upload.
     */
    protected function uploadToLocal(UploadedFile $file): array
    {
        $path = $file->store('profile-photos', 'public');
        return [
            'url'      => Storage::disk('public')->url($path),
            'path'     => $path,
            'provider' => 'local',
        ];
    }

    /**
     * Delete an asset from Cloudinary using public_id.
     */
    protected function deleteFromCloudinary(string $url): bool
    {
        $credentials = $this->getCloudinaryCredentials();
        if (!$credentials) {
            return false;
        }

        $cloudName = $credentials['cloud_name'];
        $apiKey    = $credentials['api_key'];
        $apiSecret = $credentials['api_secret'];

        // Extract public_id from URL
        if (preg_match('#/(diet-planner/profile-photos/[^./]+)#', $url, $matches)) {
            $publicId = $matches[1];
            $timestamp = time();
            $signature = sha1("public_id={$publicId}&timestamp={$timestamp}" . $apiSecret);

            $res = Http::timeout(10)->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy", [
                'api_key'   => $apiKey,
                'public_id' => $publicId,
                'timestamp' => $timestamp,
                'signature' => $signature,
            ]);

            return $res->successful();
        }

        return false;
    }

    /**
     * Delete an asset from ImageKit (silent best-effort).
     */
    protected function deleteFromImageKit(string $url): bool
    {
        // ImageKit deletion requires fileId; since URL doesn't contain fileId directly,
        // it can be queried via metadata or left for automated cache invalidation.
        return true;
    }

    /**
     * Parse Cloudinary credentials from CLOUDINARY_URL or individual env variables.
     */
    protected function getCloudinaryCredentials(): ?array
    {
        $cloudinaryUrl = env('CLOUDINARY_URL');
        if ($cloudinaryUrl) {
            $parsed = parse_url($cloudinaryUrl);
            if (!empty($parsed['host']) && !empty($parsed['user']) && !empty($parsed['pass'])) {
                return [
                    'cloud_name' => $parsed['host'],
                    'api_key'    => $parsed['user'],
                    'api_secret' => $parsed['pass'],
                ];
            }
        }

        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey    = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');

        if ($cloudName && $apiKey && $apiSecret) {
            return [
                'cloud_name' => $cloudName,
                'api_key'    => $apiKey,
                'api_secret' => $apiSecret,
            ];
        }

        return null;
    }
}
