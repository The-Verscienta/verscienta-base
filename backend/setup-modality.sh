#!/usr/bin/env bash
# Verscienta Health — Modality content type setup. Idempotent.
# Run: ddev exec bash setup-modality.sh (from backend/)
set -euo pipefail

cd "$(dirname "$0")"
DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up Modality content type ==="

"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- Content type ---
if (!NodeType::load('modality')) {
  NodeType::create([
    'type'        => 'modality',
    'name'        => 'Modality',
    'description' => 'A therapeutic modality (e.g. acupuncture, cupping).',
  ])->save();
  echo 'Created content type: modality' . PHP_EOL;
} else {
  echo 'Content type modality already exists.' . PHP_EOL;
}

// --- field_excels_at (string, multi-value) ---
\$name = 'field_excels_at';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => -1,
    'settings'    => ['max_length' => 255],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'modality', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'modality',
    'label'       => 'Excels At',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to modality: \$name\" . PHP_EOL;
}

// --- field_benefits (text_long) ---
\$name = 'field_benefits';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'text_long',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'modality', \$name)) {
  FieldConfig::create([
    'field_name'   => \$name,
    'entity_type'  => 'node',
    'bundle'       => 'modality',
    'label'        => 'Benefits',
    'description'  => 'JSON-encoded benefits data',
    'required'     => FALSE,
  ])->save();
  echo \"Attached to modality: \$name\" . PHP_EOL;
}

// --- field_conditions (entity_reference to node/condition, multi-value) ---
\$name = 'field_conditions';
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
if (!FieldConfig::loadByName('node', 'modality', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'modality',
    'label'       => 'Conditions',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['condition' => 'condition'],
      ],
    ],
  ])->save();
  echo \"Attached to modality: \$name\" . PHP_EOL;
}

// --- field_session_cost_range (string) ---
\$name = 'field_session_cost_range';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => 1,
    'settings'    => ['max_length' => 64],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'modality', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'modality',
    'label'       => 'Session Cost Range',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to modality: \$name\" . PHP_EOL;
}

// --- field_self_practice (boolean) ---
\$name = 'field_self_practice';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'boolean',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'modality', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'modality',
    'label'       => 'Self Practice',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to modality: \$name\" . PHP_EOL;
}

// --- field_sessions_needed (string) ---
\$name = 'field_sessions_needed';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => 1,
    'settings'    => ['max_length' => 64],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'modality', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'modality',
    'label'       => 'Sessions Needed',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to modality: \$name\" . PHP_EOL;
}

// --- field_pairs_well_with (entity_reference to node/modality, multi-value) ---
\$name = 'field_pairs_well_with';
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
if (!FieldConfig::loadByName('node', 'modality', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'modality',
    'label'       => 'Pairs Well With',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['modality' => 'modality'],
      ],
    ],
  ])->save();
  echo \"Attached to modality: \$name\" . PHP_EOL;
}

// --- field_editors_pick (boolean) — storage may already exist from formula ---
\$name = 'field_editors_pick';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'boolean',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'modality', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'modality',
    'label'       => \"Editor's Pick\",
    'required'    => FALSE,
  ])->save();
  echo \"Attached to modality: \$name\" . PHP_EOL;
}

echo 'Modality fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Modality content type setup complete ==="
