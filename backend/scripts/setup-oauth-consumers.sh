#!/usr/bin/env bash
# Verscienta — Create OAuth consumers for SSO (ERP + CMS).
# These are the OIDC Relying Party registrations in Drupal.
#
# Usage: ddev exec bash scripts/setup-oauth-consumers.sh
# Or:    docker compose exec drupal bash scripts/setup-oauth-consumers.sh
#
# Environment variables (optional overrides):
#   ERP_REDIRECT_URI  — default: http://localhost:4000/auth/user/oidc/callback
#   CMS_REDIRECT_URI  — default: http://localhost:4001/api/auth/oidc/callback
set -euo pipefail

cd "$(dirname "$0")/.."
DRUSH="${DRUSH:-vendor/bin/drush}"

ERP_REDIRECT="${ERP_REDIRECT_URI:-http://localhost:4000/auth/user/oidc/callback}"
CMS_REDIRECT="${CMS_REDIRECT_URI:-http://localhost:4001/api/auth/oidc/callback}"

echo "=== Setting up OAuth Consumers for SSO ==="

"$DRUSH" en -y simple_oauth consumers

"$DRUSH" php:eval "
use Drupal\consumers\Entity\Consumer;

// --- HealthFinance ERP ---
\$erp_label = 'HealthFinance ERP';
\$existing_erp = \\Drupal::entityTypeManager()
  ->getStorage('consumer')
  ->loadByProperties(['label' => \$erp_label]);

if (empty(\$existing_erp)) {
  \$secret = bin2hex(random_bytes(32));
  \$consumer = Consumer::create([
    'label'        => \$erp_label,
    'description'  => 'OIDC client for the HealthFinance ERP application',
    'confidential' => TRUE,
    'pkce'         => TRUE,
    'third_party'  => FALSE,
    'redirect'     => '$ERP_REDIRECT',
    'secret'       => \$secret,
    'grant_types'  => ['authorization_code', 'refresh_token'],
    'access_token_expiration' => 3600,
    'refresh_token_expiration' => 1209600,
    'scopes' => 'openid email profile',
  ]);
  \$consumer->save();
  echo \"Created ERP consumer (UUID: \" . \$consumer->uuid() . \")\" . PHP_EOL;
  echo \"  Client ID: \" . \$consumer->uuid() . PHP_EOL;
  echo \"  Client Secret: \" . \$secret . PHP_EOL;
  echo \"  Redirect URI: $ERP_REDIRECT\" . PHP_EOL;
  echo \"  *** SAVE THE SECRET — it cannot be retrieved later ***\" . PHP_EOL;
} else {
  \$c = reset(\$existing_erp);
  echo \"ERP consumer already exists (UUID: \" . \$c->uuid() . \") — skipping.\" . PHP_EOL;
}

echo PHP_EOL;

// --- Verscienta CMS ---
\$cms_label = 'Verscienta CMS';
\$existing_cms = \\Drupal::entityTypeManager()
  ->getStorage('consumer')
  ->loadByProperties(['label' => \$cms_label]);

if (empty(\$existing_cms)) {
  \$secret = bin2hex(random_bytes(32));
  \$consumer = Consumer::create([
    'label'        => \$cms_label,
    'description'  => 'OIDC client for the Verscienta Clinic Management System',
    'confidential' => TRUE,
    'pkce'         => TRUE,
    'third_party'  => FALSE,
    'redirect'     => '$CMS_REDIRECT',
    'secret'       => \$secret,
    'grant_types'  => ['authorization_code', 'refresh_token'],
    'access_token_expiration' => 3600,
    'refresh_token_expiration' => 1209600,
    'scopes' => 'openid email profile',
  ]);
  \$consumer->save();
  echo \"Created CMS consumer (UUID: \" . \$consumer->uuid() . \")\" . PHP_EOL;
  echo \"  Client ID: \" . \$consumer->uuid() . PHP_EOL;
  echo \"  Client Secret: \" . \$secret . PHP_EOL;
  echo \"  Redirect URI: $CMS_REDIRECT\" . PHP_EOL;
  echo \"  *** SAVE THE SECRET — it cannot be retrieved later ***\" . PHP_EOL;
} else {
  \$c = reset(\$existing_cms);
  echo \"CMS consumer already exists (UUID: \" . \$c->uuid() . \") — skipping.\" . PHP_EOL;
}

echo PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== OAuth consumer setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Copy the Client ID (UUID) and Secret for each consumer"
echo "  2. Set VERSCIENTA_OIDC_CLIENT_ID and VERSCIENTA_OIDC_CLIENT_SECRET in each app's .env"
echo "  3. For production, update redirect URIs via Drupal admin at /admin/config/services/consumer"
