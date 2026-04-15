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

# Ensure private directory has the Drupal-required .htaccess (SA-CORE-2013-003)
PRIVATE_HTACCESS="/var/www/html/private/.htaccess"
if [ ! -f "$PRIVATE_HTACCESS" ] || ! grep -q "Drupal_Security_Do_Not_Remove_See_SA_2006_006" "$PRIVATE_HTACCESS" 2>/dev/null; then
  cat > "$PRIVATE_HTACCESS" << 'HTEOF'
# Turn off all options we don't need.
Options -Indexes -ExecCGI -Includes -IncludesNOExec

# Set the catch-all handler to prevent scripts from being executed.
SetHandler Drupal_Security_Do_Not_Remove_See_SA_2006_006
<Files *>
  # Override the handler again if we're run later in the evaluation list.
  SetHandler Drupal_Security_Do_Not_Remove_See_SA_2006_006
</Files>

# If we know how to do it safely, disable the PHP engine entirely.
<IfModule mod_php.c>
  php_flag engine off
</IfModule>
HTEOF
fi

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

  # Clean up stale action configs BEFORE updatedb to suppress plugin-not-found errors
  echo "Cleaning stale action configs..."
  ./vendor/bin/drush config:delete system.action.node_purge_action 2>/dev/null || true
  ./vendor/bin/drush config:delete system.action.node_restore_action 2>/dev/null || true

  echo "Running database updates..."
  if ! ./vendor/bin/drush updatedb --no-interaction 2>&1; then
    echo "ERROR: Database updates failed. Container will not start with stale schema." >&2
    exit 1
  fi

  # Apply recipes only if the formula content type doesn't exist yet.
  # Once applied, the recipe is not re-run — config may have diverged intentionally.
  RECIPE_DIR="/var/www/html/web/recipes/verscienta_formula"
  if ./vendor/bin/drush config:get node.type.formula name 2>/dev/null | grep -q 'formula'; then
    echo "Formula content type already exists — skipping recipe apply."
  elif [ -d "$RECIPE_DIR" ]; then
    echo "Applying Verscienta formula recipe..."
    if ! ./vendor/bin/drush recipe "$RECIPE_DIR" 2>&1; then
      echo "WARNING: Recipe apply failed. Continuing..." >&2
    fi
  else
    echo "WARNING: Recipe directory not found at $RECIPE_DIR" >&2
  fi

  # Uninstall deprecated and obsolete extensions on every start.
  # - auto_updates_extensions: obsolete (Drupal says "immediately uninstall")
  # - field_layout: deprecated core module (removed in Drupal 12)
  # - ai_content_suggestions, ai_logging: deprecated AI submodules, not used
  # drush pm:uninstall is idempotent — safe to run when already uninstalled.
  echo "Uninstalling deprecated/obsolete extensions..."
  ./vendor/bin/drush pm:uninstall \
    auto_updates_extensions \
    field_layout \
    ai_content_suggestions \
    ai_logging \
    --no-interaction 2>/dev/null || true

  echo "Rebuilding cache..."
  if ! ./vendor/bin/drush cache:rebuild 2>&1; then
    echo "ERROR: Cache rebuild failed." >&2
    exit 1
  fi

  # Fix ownership of files created by drush (runs as root) so Apache (www-data)
  # can read/write the compiled service container and Twig cache in files/php/.
  chown -R www-data:www-data "${SETTINGS_DIR}/files"
fi

# Start Apache
exec apache2-foreground
