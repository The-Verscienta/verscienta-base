#!/usr/bin/env bash
# setup-tcm-ingredients.sh
# Creates the TCM Ingredient content type and its fields.
# Idempotent — safe to re-run.
#
# Usage: ddev exec bash setup-tcm-ingredients.sh (from backend/)
set -euo pipefail
cd "$(dirname "$0")"

DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up TCM Ingredient content type ==="

# 1. Create content type if it does not exist
"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
if (!NodeType::load('tcm_ingredient')) {
  NodeType::create([
    'type'              => 'tcm_ingredient',
    'name'              => 'TCM Ingredient',
    'description'       => 'Active compound or ingredient found in TCM herbs.',
    'help'              => '',
    'new_revision'      => TRUE,
    'preview_mode'      => 1,
    'display_submitted' => FALSE,
  ])->save();
  echo 'Created tcm_ingredient content type.' . PHP_EOL;
} else {
  echo 'tcm_ingredient content type already exists.' . PHP_EOL;
}
"

# 2. Fields
"$DRUSH" php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- field_ingredient_id (integer) ---
\$name = 'field_ingredient_id';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'integer',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_ingredient', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_ingredient',
    'label'       => 'Ingredient ID',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_ingredient: \$name\" . PHP_EOL;
}

// --- field_pubchem_cid (integer) ---
\$name = 'field_pubchem_cid';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'integer',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_ingredient', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_ingredient',
    'label'       => 'PubChem CID',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_ingredient: \$name\" . PHP_EOL;
}

// --- field_cas_number (string, max_length 64) ---
\$name = 'field_cas_number';
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
if (!FieldConfig::loadByName('node', 'tcm_ingredient', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_ingredient',
    'label'       => 'CAS Number',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_ingredient: \$name\" . PHP_EOL;
}

// --- field_smiles (string, max_length 1024) ---
\$name = 'field_smiles';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => 1,
    'settings'    => ['max_length' => 1024],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_ingredient', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_ingredient',
    'label'       => 'SMILES',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_ingredient: \$name\" . PHP_EOL;
}

// --- field_molecular_weight (decimal, precision 12, scale 4) ---
\$name = 'field_molecular_weight';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'decimal',
    'cardinality' => 1,
    'settings'    => ['precision' => 12, 'scale' => 4],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_ingredient', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_ingredient',
    'label'       => 'Molecular Weight',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_ingredient: \$name\" . PHP_EOL;
}

// --- field_herb_sources (entity_reference to node/herb, cardinality -1) ---
\$name = 'field_herb_sources';
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
if (!FieldConfig::loadByName('node', 'tcm_ingredient', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_ingredient',
    'label'       => 'Herb Sources',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['herb' => 'herb'],
      ],
    ],
  ])->save();
  echo \"Attached to tcm_ingredient: \$name\" . PHP_EOL;
}

// --- field_source_db (string, max_length 128) ---
\$name = 'field_source_db';
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
if (!FieldConfig::loadByName('node', 'tcm_ingredient', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_ingredient',
    'label'       => 'Source Database',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_ingredient: \$name\" . PHP_EOL;
}

echo 'TCM Ingredient fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== TCM Ingredient setup complete ==="
