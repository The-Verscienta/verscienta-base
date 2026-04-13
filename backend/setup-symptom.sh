#!/usr/bin/env bash
# setup-symptom.sh
# Creates the Symptom content type and its fields.
# Idempotent — safe to re-run.
#
# Usage: ddev exec bash setup-symptom.sh (from backend/)
set -euo pipefail
cd "$(dirname "$0")"

DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up Symptom content type ==="

# 1. Create content type if it does not exist
"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
if (!NodeType::load('symptom')) {
  NodeType::create([
    'type'              => 'symptom',
    'name'              => 'Symptom',
    'description'       => 'A clinical symptom with category and related conditions.',
    'help'              => '',
    'new_revision'      => TRUE,
    'preview_mode'      => 1,
    'display_submitted' => FALSE,
  ])->save();
  echo 'Created symptom content type.' . PHP_EOL;
} else {
  echo 'symptom content type already exists.' . PHP_EOL;
}
"

# 2. Fields
"$DRUSH" php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- field_category (string, max_length 128) ---
\$name = 'field_category';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => 1,
    'settings'    => ['max_length' => 128],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'symptom', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'symptom',
    'label'       => 'Category',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to symptom: \$name\" . PHP_EOL;
}

// --- field_related_conditions (entity_reference to node/condition, cardinality -1) ---
\$name = 'field_related_conditions';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'entity_reference',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'node'],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'symptom', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'symptom',
    'label'       => 'Related Conditions',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['condition' => 'condition'],
      ],
    ],
  ])->save();
  echo \"Attached to symptom: \$name\" . PHP_EOL;
}

echo 'Symptom fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Symptom setup complete ==="
