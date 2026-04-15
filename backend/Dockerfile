# Drupal Backend Dockerfile for Coolify Deployment
FROM php:8.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    rsync \
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

# Verify recipe directory was included in the build context
RUN echo "=== Build-time recipe check ===" \
    && ls web/recipes/verscienta_formula/recipe.yml 2>/dev/null \
       && echo "Recipe directory: OK" \
       || echo "WARNING: web/recipes/verscienta_formula/recipe.yml NOT FOUND in image"

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

# Install Webform external libraries (eliminates CDN warnings on the status page)
# CodeMirror 5.65.12 — download npm tarball (preserves lib/addon/mode structure)
RUN mkdir -p /var/www/html/web/libraries/codemirror \
    && curl -sL --fail https://registry.npmjs.org/codemirror/-/codemirror-5.65.12.tgz \
       | tar -xz -C /tmp \
    && cp -r /tmp/package/lib /tmp/package/addon /tmp/package/mode \
       /var/www/html/web/libraries/codemirror/ \
    && rm -rf /tmp/package

# Remaining Webform libraries (individual file downloads)
RUN \
    # jQuery Input Mask 5.0.9
    mkdir -p /var/www/html/web/libraries/jquery.inputmask/dist \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/RobinHerbots/Inputmask@5.0.9/dist/jquery.inputmask.min.js" \
       -o /var/www/html/web/libraries/jquery.inputmask/dist/jquery.inputmask.min.js \
    \
    # intl-tel-input v17.0.19
    && mkdir -p /var/www/html/web/libraries/jquery.intl-tel-input/build/css \
               /var/www/html/web/libraries/jquery.intl-tel-input/build/js \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/jackocnr/intl-tel-input@v17.0.19/build/css/intlTelInput.min.css" \
       -o /var/www/html/web/libraries/jquery.intl-tel-input/build/css/intlTelInput.min.css \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/jackocnr/intl-tel-input@v17.0.19/build/js/intlTelInput.min.js" \
       -o /var/www/html/web/libraries/jquery.intl-tel-input/build/js/intlTelInput.min.js \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/jackocnr/intl-tel-input@v17.0.19/build/js/intlTelInput-jquery.min.js" \
       -o /var/www/html/web/libraries/jquery.intl-tel-input/build/js/intlTelInput-jquery.min.js \
    \
    # RateIt 1.1.5
    && mkdir -p /var/www/html/web/libraries/jquery.rateit/scripts \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/gjunge/rateit.js@1.1.5/scripts/rateit.css" \
       -o /var/www/html/web/libraries/jquery.rateit/scripts/rateit.css \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/gjunge/rateit.js@1.1.5/scripts/jquery.rateit.min.js" \
       -o /var/www/html/web/libraries/jquery.rateit/scripts/jquery.rateit.min.js \
    \
    # Select2 4.0.13
    && mkdir -p /var/www/html/web/libraries/jquery.select2/dist/css \
               /var/www/html/web/libraries/jquery.select2/dist/js \
    && curl -sL --fail "https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css" \
       -o /var/www/html/web/libraries/jquery.select2/dist/css/select2.min.css \
    && curl -sL --fail "https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js" \
       -o /var/www/html/web/libraries/jquery.select2/dist/js/select2.min.js \
    \
    # Text Counter 0.9.1
    && mkdir -p /var/www/html/web/libraries/jquery.textcounter \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/ractoon/jQuery-Text-Counter@0.9.1/textcounter.min.js" \
       -o /var/www/html/web/libraries/jquery.textcounter/textcounter.min.js \
    \
    # Timepicker 1.14.0
    && mkdir -p /var/www/html/web/libraries/jquery.timepicker \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/jonthornton/jquery-timepicker@1.14.0/jquery.timepicker.min.css" \
       -o /var/www/html/web/libraries/jquery.timepicker/jquery.timepicker.min.css \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/jonthornton/jquery-timepicker@1.14.0/jquery.timepicker.min.js" \
       -o /var/www/html/web/libraries/jquery.timepicker/jquery.timepicker.min.js \
    \
    # Popper.js 2.11.6
    && mkdir -p /var/www/html/web/libraries/popperjs/dist/umd \
    && curl -sL --fail "https://unpkg.com/@popperjs/core@2.11.6/dist/umd/popper.js" \
       -o /var/www/html/web/libraries/popperjs/dist/umd/popper.js \
    \
    # Tippy.js 6.3.7
    && mkdir -p /var/www/html/web/libraries/tippyjs/dist \
    && curl -sL --fail "https://unpkg.com/tippy.js@6.3.7/dist/tippy.css" \
       -o /var/www/html/web/libraries/tippyjs/dist/tippy.css \
    && curl -sL --fail "https://unpkg.com/tippy.js@6.3.7/dist/tippy.umd.js" \
       -o /var/www/html/web/libraries/tippyjs/dist/tippy.umd.js \
    \
    # Progress Tracker 2.0.7
    && mkdir -p /var/www/html/web/libraries/progress-tracker/src/styles \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/NigelOToole/progress-tracker@v2.0.7/src/styles/progress-tracker.css" \
       -o /var/www/html/web/libraries/progress-tracker/src/styles/progress-tracker.css \
    \
    # Signature Pad 2.3.0
    && mkdir -p /var/www/html/web/libraries/signature_pad/example/js \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/szimek/signature_pad@v2.3.0/example/js/signature_pad.js" \
       -o /var/www/html/web/libraries/signature_pad/example/js/signature_pad.js \
    \
    # Tabby 12.0.3
    && mkdir -p /var/www/html/web/libraries/tabby/dist/css \
               /var/www/html/web/libraries/tabby/dist/js \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/cferdinandi/tabby@12.0.3/dist/css/tabby-ui.min.css" \
       -o /var/www/html/web/libraries/tabby/dist/css/tabby-ui.min.css \
    && curl -sL --fail "https://cdn.jsdelivr.net/gh/cferdinandi/tabby@12.0.3/dist/js/tabby.min.js" \
       -o /var/www/html/web/libraries/tabby/dist/js/tabby.min.js \
    \
    # Image Picker 0.3.1 (used by webform_image_select)
    && mkdir -p /var/www/html/web/libraries/jquery.image-picker/image-picker \
    && curl -sL --fail "https://cdnjs.cloudflare.com/ajax/libs/image-picker/0.3.1/image-picker.css" \
       -o /var/www/html/web/libraries/jquery.image-picker/image-picker/image-picker.css \
    && curl -sL --fail "https://cdnjs.cloudflare.com/ajax/libs/image-picker/0.3.1/image-picker.min.js" \
       -o /var/www/html/web/libraries/jquery.image-picker/image-picker/image-picker.js

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
    && printf '# Turn off all options we do not need.\nOptions -Indexes -ExecCGI -Includes -IncludesNOExec\n\n# Set the catch-all handler to prevent scripts from being executed.\nSetHandler Drupal_Security_Do_Not_Remove_See_SA_2013_003\n<Files *>\n  SetHandler Drupal_Security_Do_Not_Remove_See_SA_2013_003\n</Files>\n\n# Disable the PHP engine entirely.\n<IfModule mod_php.c>\n  php_flag engine off\n</IfModule>\n' > /var/www/html/private/.htaccess

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

# Healthcheck: give the entrypoint time to finish (database migrations, cache rebuild)
# before declaring the container unhealthy.
# NOTE: Coolify may override these settings. If deploys fail with "unhealthy",
# increase start period and retries in Coolify's service healthcheck settings.
HEALTHCHECK --interval=10s --timeout=5s --start-period=120s --retries=8 \
  CMD curl -sf -o /dev/null http://localhost/user/login || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
