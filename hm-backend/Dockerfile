FROM php:8.2-apache

# FIX: prevent "More than one MPM loaded"
# 1. Disable ALL MPM modules first
# 2. Remove any existing MPM load configurations to prevent conflicts
# 3. Enable only mpm_prefork
RUN a2dismod mpm_event mpm_worker mpm_prefork 2>/dev/null || true \
 && rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf \
 && a2enmod mpm_prefork

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libpq-dev \
    libicu-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip intl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable Apache modules
RUN a2enmod rewrite headers

# Set working directory
WORKDIR /var/www/html

# Copy composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy composer files first for better layer caching
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-autoloader

# Copy application code
COPY . .

# Complete composer setup
RUN composer dump-autoload --optimize

# Set Apache to serve the Laravel public directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

# Copy custom Apache configuration
COPY 000-default.conf /etc/apache2/sites-available/000-default.conf

# Update apache2.conf to allow .htaccess overrides
RUN sed -ri -e 's!/var/www/!/var/www/html/public!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Fix permissions and create required directories
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Create entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
