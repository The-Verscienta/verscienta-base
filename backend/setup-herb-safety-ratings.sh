#!/usr/bin/env bash
# §13.1 — Pregnancy & Lactation Safety Ratings on herb
# Adds field_lactation_safety (list_string) to the herb content type.
# field_pregnancy_safety already exists from prior setup.
# Run inside the Drupal container: docker compose exec drupal bash < backend/setup-herb-safety-ratings.sh
set -euo pipefail

DRUSH="vendor/bin/drush"
cd "$(dirname "$0")"

echo "=== Setting up Herb Lactation Safety Rating field ==="

$DRUSH php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

if (!FieldStorageConfig::loadByName('node', 'field_lactation_safety')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_lactation_safety',
    'entity_type' => 'node',
    'type'        => 'list_string',
    'cardinality' => 1,
    'settings'    => [
      'allowed_values' => [
        ['value' => 'generally_safe',    'label' => 'Generally Safe'],
        ['value' => 'use_caution',       'label' => 'Use Caution'],
        ['value' => 'avoid',             'label' => 'Avoid'],
        ['value' => 'contraindicated',   'label' => 'Contraindicated'],
        ['value' => 'insufficient_data', 'label' => 'Insufficient Data'],
      ],
    ],
  ])->save();
  echo 'field_lactation_safety storage created' . PHP_EOL;
} else {
  echo 'field_lactation_safety storage already exists' . PHP_EOL;
}

if (!FieldConfig::loadByName('node', 'herb', 'field_lactation_safety')) {
  FieldConfig::create([
    'field_name'  => 'field_lactation_safety',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Lactation Safety',
    'required'    => FALSE,
  ])->save();
  echo 'field_lactation_safety attached to herb' . PHP_EOL;
} else {
  echo 'field_lactation_safety already attached to herb' . PHP_EOL;
}
"

$DRUSH cache:rebuild
echo "=== Herb safety ratings setup complete ==="
