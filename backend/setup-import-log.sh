#!/usr/bin/env bash
# setup-import-log.sh
# Creates the Import Log content type and its fields.
# Idempotent — safe to re-run.
#
# Usage: ddev exec bash setup-import-log.sh (from backend/)
set -euo pipefail
cd "$(dirname "$0")"

DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up Import Log content type ==="

# 1. Create content type if it does not exist
"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
if (!NodeType::load('import_log')) {
  NodeType::create([
    'type'              => 'import_log',
    'name'              => 'Import Log',
    'description'       => 'Log entry for a data import run, tracking counts and errors.',
    'help'              => '',
    'new_revision'      => FALSE,
    'preview_mode'      => 1,
    'display_submitted' => TRUE,
  ])->save();
  echo 'Created import_log content type.' . PHP_EOL;
} else {
  echo 'import_log content type already exists.' . PHP_EOL;
}
"

# 2. Fields
"$DRUSH" php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

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
if (!FieldConfig::loadByName('node', 'import_log', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'import_log',
    'label'       => 'Source Database',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to import_log: \$name\" . PHP_EOL;
}

// --- field_records_processed (integer) ---
\$name = 'field_records_processed';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'integer',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'import_log', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'import_log',
    'label'       => 'Records Processed',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to import_log: \$name\" . PHP_EOL;
}

// --- field_records_created (integer) ---
\$name = 'field_records_created';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'integer',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'import_log', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'import_log',
    'label'       => 'Records Created',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to import_log: \$name\" . PHP_EOL;
}

// --- field_records_updated (integer) ---
\$name = 'field_records_updated';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'integer',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'import_log', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'import_log',
    'label'       => 'Records Updated',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to import_log: \$name\" . PHP_EOL;
}

// --- field_records_skipped (integer) ---
\$name = 'field_records_skipped';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'integer',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'import_log', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'import_log',
    'label'       => 'Records Skipped',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to import_log: \$name\" . PHP_EOL;
}

// --- field_errors (text_long) ---
\$name = 'field_errors';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'text_long',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'import_log', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'import_log',
    'label'       => 'Errors',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to import_log: \$name\" . PHP_EOL;
}

// --- field_duration_seconds (integer) ---
\$name = 'field_duration_seconds';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'integer',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'import_log', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'import_log',
    'label'       => 'Duration (seconds)',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to import_log: \$name\" . PHP_EOL;
}

echo 'Import Log fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Import Log setup complete ==="
