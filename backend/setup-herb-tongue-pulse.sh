#!/usr/bin/env bash
# §12.2 — Tongue & Pulse Diagnosis fields on herb content type
# Adds field_tongue_indication and field_pulse_indication (string fields) to herb.
# Run inside the Drupal container: docker compose exec drupal bash < backend/setup-herb-tongue-pulse.sh
set -euo pipefail

DRUSH="vendor/bin/drush"
cd "$(dirname "$0")"

echo "=== Setting up Tongue & Pulse Diagnosis fields on herb ==="

# 1. field_tongue_indication — string (plain text, no format)
$DRUSH php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

if (!FieldStorageConfig::loadByName('node', 'field_tongue_indication')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_tongue_indication',
    'entity_type' => 'node',
    'type'        => 'string_long',
    'cardinality' => 1,
  ])->save();
  echo 'field_tongue_indication storage created' . PHP_EOL;
} else {
  echo 'field_tongue_indication storage already exists' . PHP_EOL;
}

if (!FieldConfig::loadByName('node', 'herb', 'field_tongue_indication')) {
  FieldConfig::create([
    'field_name'  => 'field_tongue_indication',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Tongue Indication',
    'required'    => FALSE,
  ])->save();
  echo 'field_tongue_indication attached to herb' . PHP_EOL;
} else {
  echo 'field_tongue_indication already attached to herb' . PHP_EOL;
}
"

# 2. field_pulse_indication — string (plain text)
$DRUSH php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

if (!FieldStorageConfig::loadByName('node', 'field_pulse_indication')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_pulse_indication',
    'entity_type' => 'node',
    'type'        => 'string_long',
    'cardinality' => 1,
  ])->save();
  echo 'field_pulse_indication storage created' . PHP_EOL;
} else {
  echo 'field_pulse_indication storage already exists' . PHP_EOL;
}

if (!FieldConfig::loadByName('node', 'herb', 'field_pulse_indication')) {
  FieldConfig::create([
    'field_name'  => 'field_pulse_indication',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Pulse Indication',
    'required'    => FALSE,
  ])->save();
  echo 'field_pulse_indication attached to herb' . PHP_EOL;
} else {
  echo 'field_pulse_indication already attached to herb' . PHP_EOL;
}
"

$DRUSH cache:rebuild
echo "=== Tongue & Pulse Diagnosis fields setup complete ==="
