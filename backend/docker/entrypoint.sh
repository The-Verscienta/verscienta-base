#!/bin/bash
set -e

SETTINGS_DIR="/var/www/html/web/sites/default"
SETTINGS_FILE="${SETTINGS_DIR}/settings.php"
LOCAL_SETTINGS="/var/www/html/web/sites/default/settings.local.php"

# Ensure settings.php exists (may have been removed or never created)
if [ ! -f "$SETTINGS_FILE" ]; then
  echo "Creating settings.php from default template..."
  cp "${SETTINGS_DIR}/default.settings.php" "$SETTINGS_FILE"
fi

# Ensure settings.local.php include is enabled in settings.php
if ! grep -q "^if (file_exists.*settings\.local\.php" "$SETTINGS_FILE"; then
  echo "Enabling settings.local.php include..."
  # Uncomment the include block
  sed -i 's/^# if (file_exists.*settings\.local\.php.*/if (file_exists($app_root . "\/" . $site_path . "\/settings.local.php")) {/' "$SETTINGS_FILE"
  sed -i 's/^#   include.*settings\.local\.php.*/  include $app_root . "\/" . $site_path . "\/settings.local.php";/' "$SETTINGS_FILE"
  sed -i 's/^# }$/}/' "$SETTINGS_FILE"
fi

# Always write settings.local.php from the bundled template
# This ensures env vars are always read, even if an old version exists
cp /var/www/html/docker/settings.local.php "$LOCAL_SETTINGS"

# Ensure correct permissions
chmod 644 "$SETTINGS_FILE"
chmod 644 "$LOCAL_SETTINGS"
chown www-data:www-data "$SETTINGS_FILE" "$LOCAL_SETTINGS"

# Remove static robots.txt so the RobotsTxt module can serve a dynamic one
rm -f /var/www/html/web/robots.txt

# Ensure files directory exists and has correct permissions
mkdir -p "${SETTINGS_DIR}/files"
chown -R www-data:www-data "${SETTINGS_DIR}/files"

# Ensure private files directory exists (inside project root for Package Manager)
mkdir -p /var/www/html/private
chown -R www-data:www-data /var/www/html/private

# Ensure config sync directory exists
mkdir -p /var/www/html/config/sync

# When running with bind-mounted volumes (development), enable OPcache timestamp
# validation so PHP detects changed files instead of serving stale cached bytecode.
# This prevents "Cannot redeclare" errors from OPcache caching build-time files.
if mount | grep -q '/var/www/html.*bind'; then
  echo "Bind mount detected — enabling OPcache timestamp validation for development."
  echo "opcache.validate_timestamps=1" > /usr/local/etc/php/conf.d/zz-dev-opcache.ini
fi

# Reset OPcache to clear any stale entries from the image build
php -d opcache.enable_cli=1 -r "if (function_exists('opcache_reset')) { opcache_reset(); }" 2>/dev/null || true

# Wait for database to be ready
if [ -n "$DRUPAL_DATABASE_HOST" ]; then
  echo "Waiting for database..."
  until php -r "new PDO('mysql:host='.getenv('DRUPAL_DATABASE_HOST').';port='.getenv('DRUPAL_DATABASE_PORT').';dbname='.getenv('DRUPAL_DATABASE_NAME'), getenv('DRUPAL_DATABASE_USER'), getenv('DRUPAL_DATABASE_PASSWORD'));" 2>/dev/null; do
    sleep 2
  done
  echo "Database is ready!"

  # Apply any pending database/entity updates via drush
  cd /var/www/html
  echo "Running database updates..."
  ./vendor/bin/drush updatedb --no-interaction 2>&1 || echo "Database update check completed (non-fatal if failed)."

  # Apply recipes to ensure form/view display configs exist
  echo "Applying Verscienta recipes..."
  ./vendor/bin/drush recipe web/recipes/verscienta_formula 2>&1 || echo "Recipe apply completed (non-fatal if already applied)."

  echo "Rebuilding cache..."
  ./vendor/bin/drush cache:rebuild 2>&1 || echo "Cache rebuild completed (non-fatal if failed)."
fi

# Start Apache
exec apache2-foreground
