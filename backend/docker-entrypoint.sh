#!/bin/sh
set -e

echo "==> Clearing cached configurations..."
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

echo "==> Running storage link..."
php artisan storage:link || true

echo "==> Running database migrations..."
php artisan migrate --force

echo "==> Running database seeders..."
php artisan db:seed --force || true

echo "==> Optimizing caches..."
php artisan route:cache || true
php artisan view:cache || true

echo "==> Starting Apache web server..."
exec apache2-foreground
