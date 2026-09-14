#!/bin/sh

echo "==> Clearing cached configurations..."
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true
php artisan cache:clear || true

echo "==> Running storage link..."
php artisan storage:link || true

echo "==> Running database migrations..."
php artisan migrate --force || echo "Migration notice: check DB connection if tables are not yet created."

echo "==> Running database seeders..."
php artisan db:seed --force || echo "Seeding notice: already seeded or DB not ready."

echo "==> Starting Apache web server..."
exec apache2-foreground
