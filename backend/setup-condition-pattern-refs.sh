#!/usr/bin/env bash
# setup-condition-pattern-refs.sh
# Adds field_related_patterns (entity reference → tcm_pattern) to condition content type.
# Run inside the Drupal container: docker compose exec drupal bash < backend/setup-condition-pattern-refs.sh
set -euo pipefail

DRUPAL_ROOT=/var/www/html

cd "$DRUPAL_ROOT"

echo "=== Creating field_related_patterns field storage on node ==="
drush php:eval "
use Drupal\field\Entity\FieldStorageConfig;

if (!FieldStorageConfig::loadByName('node', 'field_related_patterns')) {
  FieldStorageConfig::create([
    'field_name'   => 'field_related_patterns',
    'entity_type'  => 'node',
    'type'         => 'entity_reference',
    'cardinality'  => -1,
    'settings'     => ['target_type' => 'node'],
  ])->save();
  echo 'field_related_patterns storage created' . PHP_EOL;
} else {
  echo 'field_related_patterns storage already exists' . PHP_EOL;
}
"

echo "=== Attaching field_related_patterns to condition bundle ==="
drush php:eval "
use Drupal\field\Entity\FieldConfig;

if (!FieldConfig::loadByName('node', 'condition', 'field_related_patterns')) {
  FieldConfig::create([
    'field_name'   => 'field_related_patterns',
    'entity_type'  => 'node',
    'bundle'       => 'condition',
    'label'        => 'Common TCM Patterns',
    'required'     => FALSE,
    'settings'     => [
      'handler'          => 'default:node',
      'handler_settings' => [
        'target_bundles' => ['tcm_pattern' => 'tcm_pattern'],
        'sort'           => ['field' => '_none'],
        'auto_create'    => FALSE,
      ],
    ],
  ])->save();
  echo 'field_related_patterns attached to condition bundle' . PHP_EOL;
} else {
  echo 'field_related_patterns already attached to condition bundle' . PHP_EOL;
}
"

echo "=== Enabling JSON:API access for field_related_patterns on node--condition ==="
drush php:eval "
// Ensure JSON:API resource type is not restricted (public by default on most sites).
// If resource_type restrictor is in use, add explicit allow here.
echo 'JSON:API uses default allow-all; no extra config needed.' . PHP_EOL;
"

echo "=== Clearing caches ==="
drush cache:rebuild

echo "=== Done: field_related_patterns added to condition content type ==="
