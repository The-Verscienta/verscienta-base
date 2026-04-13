#!/usr/bin/env bash
# setup-tcm-clinical-evidence.sh
# Creates the TCM Clinical Evidence content type and its fields.
# Idempotent — safe to re-run.
#
# Usage: ddev exec bash setup-tcm-clinical-evidence.sh (from backend/)
set -euo pipefail
cd "$(dirname "$0")"

DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up TCM Clinical Evidence content type ==="

# 0. Enable the link module (needed for field_source_url)
"$DRUSH" en -y link

# 1. Create content type if it does not exist
"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
if (!NodeType::load('tcm_clinical_evidence')) {
  NodeType::create([
    'type'              => 'tcm_clinical_evidence',
    'name'              => 'TCM Clinical Evidence',
    'description'       => 'Clinical study or evidence record related to TCM herbs and formulas.',
    'help'              => '',
    'new_revision'      => TRUE,
    'preview_mode'      => 1,
    'display_submitted' => FALSE,
  ])->save();
  echo 'Created tcm_clinical_evidence content type.' . PHP_EOL;
} else {
  echo 'tcm_clinical_evidence content type already exists.' . PHP_EOL;
}
"

# 2. Fields
"$DRUSH" php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- field_evidence_id (string, max_length 128) ---
\$name = 'field_evidence_id';
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
if (!FieldConfig::loadByName('node', 'tcm_clinical_evidence', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_clinical_evidence',
    'label'       => 'Evidence ID',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_clinical_evidence: \$name\" . PHP_EOL;
}

// --- field_herb_refs (entity_reference to node/herb, cardinality -1) ---
\$name = 'field_herb_refs';
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
if (!FieldConfig::loadByName('node', 'tcm_clinical_evidence', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_clinical_evidence',
    'label'       => 'Herb References',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['herb' => 'herb'],
      ],
    ],
  ])->save();
  echo \"Attached to tcm_clinical_evidence: \$name\" . PHP_EOL;
}

// --- field_formula_ref (entity_reference to node/formula, cardinality 1) ---
\$name = 'field_formula_ref';
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
if (!FieldConfig::loadByName('node', 'tcm_clinical_evidence', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_clinical_evidence',
    'label'       => 'Formula Reference',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['formula' => 'formula'],
      ],
    ],
  ])->save();
  echo \"Attached to tcm_clinical_evidence: \$name\" . PHP_EOL;
}

// --- field_study_type (string, cardinality -1, max_length 128) ---
\$name = 'field_study_type';
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
if (!FieldConfig::loadByName('node', 'tcm_clinical_evidence', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_clinical_evidence',
    'label'       => 'Study Type',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_clinical_evidence: \$name\" . PHP_EOL;
}

// --- field_summary (text_long) ---
\$name = 'field_summary';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'text_long',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_clinical_evidence', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_clinical_evidence',
    'label'       => 'Summary',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_clinical_evidence: \$name\" . PHP_EOL;
}

// --- field_outcome (text_long) ---
\$name = 'field_outcome';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'text_long',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_clinical_evidence', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_clinical_evidence',
    'label'       => 'Outcome',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_clinical_evidence: \$name\" . PHP_EOL;
}

// --- field_source_url (link) ---
\$name = 'field_source_url';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'link',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'tcm_clinical_evidence', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_clinical_evidence',
    'label'       => 'Source URL',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_clinical_evidence: \$name\" . PHP_EOL;
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
if (!FieldConfig::loadByName('node', 'tcm_clinical_evidence', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'tcm_clinical_evidence',
    'label'       => 'Source Database',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to tcm_clinical_evidence: \$name\" . PHP_EOL;
}

echo 'TCM Clinical Evidence fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== TCM Clinical Evidence setup complete ==="
