#!/bin/bash
set -e

# Support Render / dynamic PORT variable
PORT="${PORT:-80}"
sed -i "s/80/${PORT}/g" /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf

# Ensure storage directories exist and have proper permissions
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Run database migrations if RUN_MIGRATIONS is true
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force
fi

# Clear old cache
php artisan config:clear
php artisan route:clear

echo "Starting Apache on port $PORT..."
exec apache2-foreground

