
FROM php:8.3-cli

# Install required system packages
RUN apt-get update && apt-get install -y \
    git unzip zip curl libzip-dev libpng-dev libonig-dev libxml2-dev \
    libicu-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-install pdo_mysql mbstring zip bcmath gd intl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy Laravel project
COPY . .

# Create Laravel writable directories
RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

# Install production dependencies
RUN composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts

# Run package discovery separately
RUN php artisan package:discover --ansi

# Permissions
RUN chmod -R 775 storage bootstrap/cache

# Render provides the PORT environment variable
ENV PORT=10000

EXPOSE 10000

# Start Laravel server
CMD php artisan serve --host=0.0.0.0 --port=${PORT}
