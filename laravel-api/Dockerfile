FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git unzip zip curl libzip-dev libpng-dev libonig-dev libxml2-dev libicu-dev \
    && docker-php-ext-install pdo_mysql mbstring zip bcmath intl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Prepare Laravel folders before Composer
RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

# Install dependencies
RUN composer install --no-dev --prefer-dist --no-interaction --no-scripts

# Run Laravel package discovery
RUN php artisan package:discover --ansi

# Set writable permissions
RUN chmod -R 775 storage bootstrap/cache

# Start server
CMD php artisan serve --host=0.0.0.0 --port=${PORT:-10000}