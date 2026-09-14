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

if [ -n "$PORT" ]; then
    echo "==> Configuring Apache port to $PORT..."
    sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf
fi

echo "==> Starting Apache web server..."
exec apache2-foreground
