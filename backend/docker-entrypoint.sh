#!/bin/sh
set -e

echo "==> Running storage link..."
php artisan storage:link || true

echo "==> Running database migrations..."
php artisan migrate --force || true

echo "==> Running database seeders..."
php artisan db:seed --force || true

echo "==> Optimizing caches..."
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "==> Starting Apache web server..."
exec apache2-foreground
