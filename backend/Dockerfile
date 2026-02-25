# Drupal Backend Dockerfile for Coolify Deployment
FROM php:8.3-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libwebp-dev \
    libavif-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp --with-avif \
    && docker-php-ext-install pdo pdo_mysql mysqli mbstring exif pcntl bcmath gd zip opcache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Enable Apache modules
RUN a2enmod rewrite headers expires

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Copy application code
COPY . .

# Run composer scripts after copying all files
RUN composer run-script post-update-cmd || true

# Create settings.php from default template (settings.php is gitignored)
# and enable settings.local.php include
RUN cp /var/www/html/web/sites/default/default.settings.php \
       /var/www/html/web/sites/default/settings.php \
    && sed -i 's/^# if (file_exists.*settings\.local\.php.*/if (file_exists($app_root . "\/" . $site_path . "\/settings.local.php")) {/' \
       /var/www/html/web/sites/default/settings.php \
    && sed -i 's/^#   include.*settings\.local\.php.*/  include $app_root . "\/" . $site_path . "\/settings.local.php";/' \
       /var/www/html/web/sites/default/settings.php \
    && sed -i 's/^# }$/}/' /var/www/html/web/sites/default/settings.php

# Create settings.local.php with production configuration from env vars
COPY docker/settings.local.php /var/www/html/web/sites/default/settings.local.php

# Install jQuery JSONView library for JSON field display
RUN mkdir -p /var/www/html/web/libraries/jquery-jsonview/dist \
    && curl -sL https://raw.githubusercontent.com/yesmeck/jquery-jsonview/master/dist/jquery.jsonview.js \
       -o /var/www/html/web/libraries/jquery-jsonview/dist/jquery.jsonview.js \
    && curl -sL https://raw.githubusercontent.com/yesmeck/jquery-jsonview/master/dist/jquery.jsonview.css \
       -o /var/www/html/web/libraries/jquery-jsonview/dist/jquery.jsonview.css

# Install JSON Editor library (max v5.x for compatibility)
RUN mkdir -p /var/www/html/web/libraries/jsoneditor/dist \
    && curl -sL https://cdn.jsdelivr.net/npm/jsoneditor@5.26.3/dist/jsoneditor.min.js \
       -o /var/www/html/web/libraries/jsoneditor/dist/jsoneditor.min.js \
    && curl -sL https://cdn.jsdelivr.net/npm/jsoneditor@5.26.3/dist/jsoneditor.min.css \
       -o /var/www/html/web/libraries/jsoneditor/dist/jsoneditor.min.css \
    && curl -sL https://cdn.jsdelivr.net/npm/jsoneditor@5.26.3/dist/jsoneditor-icons.svg \
       -o /var/www/html/web/libraries/jsoneditor/dist/jsoneditor-icons.svg

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Create files directory with proper permissions
RUN mkdir -p /var/www/html/web/sites/default/files \
    && chown -R www-data:www-data /var/www/html/web/sites/default/files \
    && chmod -R 775 /var/www/html/web/sites/default/files

# Create private files directory (must be inside project root for Package Manager)
RUN mkdir -p /var/www/html/private \
    && chown -R www-data:www-data /var/www/html/private \
    && chmod -R 775 /var/www/html/private \
    && echo -e 'Deny from all' > /var/www/html/private/.htaccess

# Apache configuration
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html/web\n\
    <Directory /var/www/html/web>\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
    ErrorLog ${APACHE_LOG_DIR}/error.log\n\
    CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

# PHP configuration for production
RUN echo 'output_buffering = 4096\n\
memory_limit = 512M\n\
upload_max_filesize = 64M\n\
post_max_size = 64M\n\
max_execution_time = 300\n\
max_input_vars = 10000\n\
realpath_cache_size = 4096K\n\
realpath_cache_ttl = 600\n\
opcache.enable=1\n\
opcache.memory_consumption=256\n\
opcache.interned_strings_buffer=16\n\
opcache.max_accelerated_files=20000\n\
opcache.validate_timestamps=0\n\
opcache.save_comments=1\n\
opcache.fast_shutdown=1' > /usr/local/etc/php/conf.d/drupal.ini

# Copy entrypoint script (handles settings.php at runtime, after volumes mount)
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
