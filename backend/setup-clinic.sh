#!/usr/bin/env bash
# Verscienta Health — Clinic content type setup. Idempotent.
# Field storages shared with practitioner (field_address, field_city, etc.)
# are reused — only the FieldConfig for the clinic bundle is created.
# Run: ddev exec bash setup-clinic.sh (from backend/)
set -euo pipefail

cd "$(dirname "$0")"
DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up Clinic content type ==="

"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- Content type ---
if (!NodeType::load('clinic')) {
  NodeType::create([
    'type'        => 'clinic',
    'name'        => 'Clinic',
    'description' => 'A healthcare clinic or practice location.',
  ])->save();
  echo 'Created content type: clinic' . PHP_EOL;
} else {
  echo 'Content type clinic already exists.' . PHP_EOL;
}

// --- Simple string fields (storages may already exist from practitioner) ---
\$string_fields = [
  'field_address' => ['label' => 'Address', 'max_length' => 255],
  'field_city'    => ['label' => 'City',    'max_length' => 128],
  'field_state'   => ['label' => 'State',   'max_length' => 64],
  'field_zip'     => ['label' => 'ZIP',     'max_length' => 16],
  'field_phone'   => ['label' => 'Phone',   'max_length' => 32],
  'field_email'   => ['label' => 'Email',   'max_length' => 255],
  'field_website' => ['label' => 'Website', 'max_length' => 512],
];
foreach (\$string_fields as \$name => \$info) {
  if (!FieldStorageConfig::loadByName('node', \$name)) {
    FieldStorageConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'type'        => 'string',
      'cardinality' => 1,
      'settings'    => ['max_length' => \$info['max_length']],
    ])->save();
    echo \"Created storage: \$name\" . PHP_EOL;
  }
  if (!FieldConfig::loadByName('node', 'clinic', \$name)) {
    FieldConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'bundle'      => 'clinic',
      'label'       => \$info['label'],
      'required'    => FALSE,
    ])->save();
    echo \"Attached to clinic: \$name\" . PHP_EOL;
  }
}

// --- Decimal fields (storages may already exist from practitioner) ---
\$decimal_fields = [
  'field_latitude'  => 'Latitude',
  'field_longitude' => 'Longitude',
];
foreach (\$decimal_fields as \$name => \$label) {
  if (!FieldStorageConfig::loadByName('node', \$name)) {
    FieldStorageConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'type'        => 'decimal',
      'cardinality' => 1,
      'settings'    => ['precision' => 10, 'scale' => 7],
    ])->save();
    echo \"Created storage: \$name\" . PHP_EOL;
  }
  if (!FieldConfig::loadByName('node', 'clinic', \$name)) {
    FieldConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'bundle'      => 'clinic',
      'label'       => \$label,
      'required'    => FALSE,
    ])->save();
    echo \"Attached to clinic: \$name\" . PHP_EOL;
  }
}

// --- field_google_place_id (string) ---
\$name = 'field_google_place_id';
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
if (!FieldConfig::loadByName('node', 'clinic', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'clinic',
    'label'       => 'Google Place ID',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to clinic: \$name\" . PHP_EOL;
}

// --- field_hours (string) ---
\$name = 'field_hours';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => 1,
    'settings'    => ['max_length' => 512],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'clinic', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'clinic',
    'label'       => 'Hours',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to clinic: \$name\" . PHP_EOL;
}

// --- field_practitioners (entity_reference to node/practitioner, multi-value) ---
\$name = 'field_practitioners';
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
if (!FieldConfig::loadByName('node', 'clinic', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'clinic',
    'label'       => 'Practitioners',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['practitioner' => 'practitioner'],
      ],
    ],
  ])->save();
  echo \"Attached to clinic: \$name\" . PHP_EOL;
}

// --- field_modalities (entity_reference to node/modality, multi-value) ---
// Storage may already exist from practitioner.
\$name = 'field_modalities';
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
if (!FieldConfig::loadByName('node', 'clinic', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'clinic',
    'label'       => 'Modalities',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['modality' => 'modality'],
      ],
    ],
  ])->save();
  echo \"Attached to clinic: \$name\" . PHP_EOL;
}

// --- field_accepting_new_patients (boolean) --- storage may already exist ---
\$name = 'field_accepting_new_patients';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'boolean',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'clinic', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'clinic',
    'label'       => 'Accepting New Patients',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to clinic: \$name\" . PHP_EOL;
}

// --- field_insurance_accepted (string, multi-value) ---
\$name = 'field_insurance_accepted';
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
if (!FieldConfig::loadByName('node', 'clinic', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'clinic',
    'label'       => 'Insurance Accepted',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to clinic: \$name\" . PHP_EOL;
}

echo 'Clinic fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Clinic content type setup complete ==="
