#!/usr/bin/env bash
# Verscienta Health — Missing condition fields
# Attaches field_modalities and field_related_herbs to the condition bundle.
# These field storages already exist from practitioner/clinic/other setups;
# we only create the FieldConfig to attach them to the condition bundle.
#
# The legacy setup-entity-references.sh used different names:
#   field_treatment_approaches (→ field_modalities)
#   field_helpful_herbs        (→ field_related_herbs)
# Both naming conventions will work after this script runs.
#
# Idempotent — safe to re-run.
set -euo pipefail

cd "$(dirname "$0")"
DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up missing condition fields ==="

"$DRUSH" php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- field_modalities (entity_reference to modality, multi-value) ---
if (!FieldStorageConfig::loadByName('node', 'field_modalities')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_modalities',
    'entity_type' => 'node',
    'type'        => 'entity_reference',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'node'],
  ])->save();
  echo 'Created storage: field_modalities' . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'condition', 'field_modalities')) {
  FieldConfig::create([
    'field_name'  => 'field_modalities',
    'entity_type' => 'node',
    'bundle'      => 'condition',
    'label'       => 'Treatment Modalities',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['modality' => 'modality'],
      ],
    ],
  ])->save();
  echo 'Attached field_modalities to condition' . PHP_EOL;
}

// --- field_related_herbs (entity_reference to herb, multi-value) ---
if (!FieldStorageConfig::loadByName('node', 'field_related_herbs')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_related_herbs',
    'entity_type' => 'node',
    'type'        => 'entity_reference',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'node'],
  ])->save();
  echo 'Created storage: field_related_herbs' . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'condition', 'field_related_herbs')) {
  FieldConfig::create([
    'field_name'  => 'field_related_herbs',
    'entity_type' => 'node',
    'bundle'      => 'condition',
    'label'       => 'Related Herbs',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['herb' => 'herb'],
      ],
    ],
  ])->save();
  echo 'Attached field_related_herbs to condition' . PHP_EOL;
}

echo 'Condition missing fields done.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Condition missing fields setup complete ==="
