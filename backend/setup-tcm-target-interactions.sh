#!/usr/bin/env bash
# setup-tcm-target-interactions.sh
# Creates the TCM Target Interaction content type and its fields.
# Idempotent — safe to re-run.
#
# Usage: ddev exec bash setup-tcm-target-interactions.sh (from backend/)
set -euo pipefail
cd "$(dirname "$0")"

DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up TCM Target Interaction content type ==="

# 1. Create content type if it does not exist
"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
if (!NodeType::load('tcm_target_interaction')) {
  NodeType::create([
    'type'              => 'tcm_target_interaction',
    'name'              => 'TCM Target Interaction',
    'description'       => 'Interaction between a TCM ingredient/herb and a molecular target.',
    'help'              => '',
    'new_revision'      => TRUE,
    'preview_mode'      => 1,
    'display_submitted' => FALSE,
  ])->save();
  echo 'Created tcm_target_interaction content type.' . PHP_EOL;
} else {
  echo 'tcm_target_interaction content type already exists.' . PHP_EOL;
}
"

# 2. Fields
"$DRUSH" php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- field_ingredient_ref (entity_reference to node/tcm_ingredient, cardinality 1) ---
\$name = 'field_ingredient_ref';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'entity_reference',
    'cardinality' => 1,
    'settings'    => ['target_type' => 'node'],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_target_interaction', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_target_interaction',
    'label'       => 'Ingredient Reference',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['tcm_ingredient' => 'tcm_ingredient'],
      ],
    ],
  ])->save();
  echo \"Attached to tcm_target_interaction: \$name\" . PHP_EOL;
}

// --- field_herb_ref (entity_reference to node/herb, cardinality 1) ---
\$name = 'field_herb_ref';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'entity_reference',
    'cardinality' => 1,
    'settings'    => ['target_type' => 'node'],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_target_interaction', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_target_interaction',
    'label'       => 'Herb Reference',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['herb' => 'herb'],
      ],
    ],
  ])->save();
  echo \"Attached to tcm_target_interaction: \$name\" . PHP_EOL;
}

// --- field_target_name (string, max_length 255) ---
\$name = 'field_target_name';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => 1,
    'settings'    => ['max_length' => 255],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_target_interaction', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_target_interaction',
    'label'       => 'Target Name',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_target_interaction: \$name\" . PHP_EOL;
}

// --- field_uniprot_id (string, max_length 64) ---
\$name = 'field_uniprot_id';
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
if (!FieldConfig::loadByName('node', 'tcm_target_interaction', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_target_interaction',
    'label'       => 'UniProt ID',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_target_interaction: \$name\" . PHP_EOL;
}

// --- field_gene_name (string, max_length 128) ---
\$name = 'field_gene_name';
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
if (!FieldConfig::loadByName('node', 'tcm_target_interaction', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_target_interaction',
    'label'       => 'Gene Name',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_target_interaction: \$name\" . PHP_EOL;
}

// --- field_score (decimal, precision 8, scale 4) ---
\$name = 'field_score';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'decimal',
    'cardinality' => 1,
    'settings'    => ['precision' => 8, 'scale' => 4],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_target_interaction', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_target_interaction',
    'label'       => 'Score',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_target_interaction: \$name\" . PHP_EOL;
}

// --- field_evidence_type (string, cardinality -1, max_length 128) ---
\$name = 'field_evidence_type';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => -1,
    'settings'    => ['max_length' => 128],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_target_interaction', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_target_interaction',
    'label'       => 'Evidence Type',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_target_interaction: \$name\" . PHP_EOL;
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
if (!FieldConfig::loadByName('node', 'tcm_target_interaction', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_target_interaction',
    'label'       => 'Source Database',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_target_interaction: \$name\" . PHP_EOL;
}

echo 'TCM Target Interaction fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== TCM Target Interaction setup complete ==="
