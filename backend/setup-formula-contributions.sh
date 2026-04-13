#!/usr/bin/env bash
# setup-formula-contributions.sh
# Creates the Formula Contribution content type and its fields.
# Idempotent — safe to re-run.
#
# Usage: ddev exec bash setup-formula-contributions.sh (from backend/)
set -euo pipefail
cd "$(dirname "$0")"

DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up Formula Contribution content type ==="

# 1. Create content type if it does not exist
"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
if (!NodeType::load('formula_contribution')) {
  NodeType::create([
    'type'              => 'formula_contribution',
    'name'              => 'Formula Contribution',
    'description'       => 'Community contributions to formulas: clinical notes, modifications, and additions.',
    'help'              => '',
    'new_revision'      => TRUE,
    'preview_mode'      => 1,
    'display_submitted' => TRUE,
  ])->save();
  echo 'Created formula_contribution content type.' . PHP_EOL;
} else {
  echo 'formula_contribution content type already exists.' . PHP_EOL;
}
"

# 2. Fields
"$DRUSH" php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- field_contribution_type (list_string, required) ---
\$name = 'field_contribution_type';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'list_string',
    'cardinality' => 1,
    'settings'    => [
      'allowed_values' => [
        'clinical_note' => 'Clinical Note',
        'modification'  => 'Modification',
        'addition'      => 'Addition',
      ],
    ],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'formula_contribution', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'formula_contribution',
    'label'       => 'Contribution Type',
    'required'    => TRUE,
  ])->save();
  echo \"Attached to formula_contribution: \$name\" . PHP_EOL;
}

// --- field_formula_reference (entity_reference to node/formula, required) ---
\$name = 'field_formula_reference';
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
if (!FieldConfig::loadByName('node', 'formula_contribution', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'formula_contribution',
    'label'       => 'Formula Reference',
    'required'    => TRUE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['formula' => 'formula'],
      ],
    ],
  ])->save();
  echo \"Attached to formula_contribution: \$name\" . PHP_EOL;
}

// --- field_status (list_string, required) ---
\$name = 'field_status';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'list_string',
    'cardinality' => 1,
    'settings'    => [
      'allowed_values' => [
        'pending'  => 'Pending',
        'approved' => 'Approved',
        'rejected' => 'Rejected',
      ],
    ],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'formula_contribution', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'formula_contribution',
    'label'       => 'Status',
    'required'    => TRUE,
  ])->save();
  echo \"Attached to formula_contribution: \$name\" . PHP_EOL;
}

// --- field_clinical_note (text_long) ---
\$name = 'field_clinical_note';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'text_long',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'formula_contribution', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'formula_contribution',
    'label'       => 'Clinical Note',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to formula_contribution: \$name\" . PHP_EOL;
}

// --- field_context (text_long) ---
\$name = 'field_context';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'text_long',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'formula_contribution', \$name)) {
  FieldConfig::create([
    'field_name'   => \$name,
    'entity_type'  => 'node',
    'bundle'       => 'formula_contribution',
    'label'        => 'Context',
    'description'  => 'Context/indication for modifications',
    'required'     => FALSE,
  ])->save();
  echo \"Attached to formula_contribution: \$name\" . PHP_EOL;
}

// --- field_modifications (text_long) ---
\$name = 'field_modifications';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'text_long',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'formula_contribution', \$name)) {
  FieldConfig::create([
    'field_name'   => \$name,
    'entity_type'  => 'node',
    'bundle'       => 'formula_contribution',
    'label'        => 'Modifications',
    'description'  => 'JSON-encoded herb modifications',
    'required'     => FALSE,
  ])->save();
  echo \"Attached to formula_contribution: \$name\" . PHP_EOL;
}

echo 'Formula Contribution fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Formula Contribution setup complete ==="
