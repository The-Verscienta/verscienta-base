<?php

/**
 * @file
 * Production settings loaded from environment variables.
 * This file is copied into place by the Dockerfile.
 */

// Private file path
$settings['file_private_path'] = '/var/www/html/private';

// Database configuration from environment variables
if (getenv('DRUPAL_DATABASE_HOST')) {
  $databases['default']['default'] = [
    'database' => getenv('DRUPAL_DATABASE_NAME'),
    'username' => getenv('DRUPAL_DATABASE_USER'),
    'password' => getenv('DRUPAL_DATABASE_PASSWORD'),
    'host' => getenv('DRUPAL_DATABASE_HOST'),
    'port' => getenv('DRUPAL_DATABASE_PORT') ?: '3306',
    'driver' => 'mysql',
    'prefix' => '',
    'collation' => 'utf8mb4_general_ci',
    'init_commands' => [
      'isolation_level' => 'SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED',
    ],
  ];
}

// Hash salt from environment
if (getenv('DRUPAL_HASH_SALT')) {
  $settings['hash_salt'] = getenv('DRUPAL_HASH_SALT');
}

// Trusted host patterns from environment (comma-separated)
if (getenv('TRUSTED_HOST_PATTERNS')) {
  $settings['trusted_host_patterns'] = explode(',', getenv('TRUSTED_HOST_PATTERNS'));
}

// Reverse proxy settings (Coolify / Traefik / nginx)
// Drupal must trust forwarded headers to detect the correct scheme and host.
$settings['reverse_proxy'] = TRUE;
$settings['reverse_proxy_addresses'] = ['0.0.0.0/0'];
$settings['reverse_proxy_header'] = 'X-Forwarded-For';

// Config sync directory
$settings['config_sync_directory'] = '../config/sync';

// Security: Secure session cookies
$settings['session_cookie_secure'] = TRUE;
$settings['session_cookie_httponly'] = TRUE;
$settings['session_cookie_samesite'] = 'Lax';

// Security: Disable unnecessary error output in production
$config['system.logging']['error_level'] = 'hide';

// Security: File permissions hardening
$settings['file_chmod_directory'] = 0755;
$settings['file_chmod_file'] = 0644;

// Security: Restrict permissions for settings files
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');

// Redis configuration from environment
if (getenv('REDIS_HOST') && class_exists('Drupal') && \Drupal::hasContainer()) {
  try {
    if (\Drupal::service('module_handler')->moduleExists('redis')) {
      $settings['redis.connection']['host'] = getenv('REDIS_HOST');
      $settings['redis.connection']['port'] = getenv('REDIS_PORT') ?: '6379';
      $settings['cache']['default'] = 'cache.backend.redis';
    }
  } catch (\Exception $e) {
    // Redis module not available, skip.
  }
}
