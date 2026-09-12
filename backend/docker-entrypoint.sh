#!/bin/sh
set -e

echo "==> Running storage link..."
php artisan storage:link || true

echo "==> Running database migrations and seeders..."
php artisan migrate --force --seed || true

echo "==> Optimizing caches..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "==> Starting Apache web server..."
exec apache2-foreground
