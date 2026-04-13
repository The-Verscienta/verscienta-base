#!/usr/bin/env bash
# Verscienta Health — Practitioner content type setup. Idempotent.
# Run: ddev exec bash setup-practitioner.sh (from backend/)
set -euo pipefail

cd "$(dirname "$0")"
DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up Practitioner content type ==="

"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- Content type ---
if (!NodeType::load('practitioner')) {
  NodeType::create([
    'type'        => 'practitioner',
    'name'        => 'Practitioner',
    'description' => 'A healthcare practitioner.',
  ])->save();
  echo 'Created content type: practitioner' . PHP_EOL;
} else {
  echo 'Content type practitioner already exists.' . PHP_EOL;
}

// --- Simple string fields ---
\$string_fields = [
  'field_name'        => ['label' => 'Name',        'max_length' => 255],
  'field_address'     => ['label' => 'Address',     'max_length' => 255],
  'field_city'        => ['label' => 'City',        'max_length' => 128],
  'field_state'       => ['label' => 'State',       'max_length' => 64],
  'field_zip'         => ['label' => 'ZIP',         'max_length' => 16],
  'field_zip_code'    => ['label' => 'ZIP Code',    'max_length' => 16],
  'field_phone'       => ['label' => 'Phone',       'max_length' => 32],
  'field_email'       => ['label' => 'Email',       'max_length' => 255],
  'field_website'     => ['label' => 'Website',     'max_length' => 512],
  'field_credentials' => ['label' => 'Credentials', 'max_length' => 512],
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
  if (!FieldConfig::loadByName('node', 'practitioner', \$name)) {
    FieldConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'bundle'      => 'practitioner',
      'label'       => \$info['label'],
      'required'    => FALSE,
    ])->save();
    echo \"Attached to practitioner: \$name\" . PHP_EOL;
  }
}

// --- field_practice_type (list_string) ---
\$name = 'field_practice_type';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'list_string',
    'cardinality' => 1,
    'settings'    => [
      'allowed_values' => [
        'solo'     => 'Solo',
        'group'    => 'Group',
        'clinic'   => 'Clinic',
        'hospital' => 'Hospital',
      ],
    ],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'practitioner', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'practitioner',
    'label'       => 'Practice Type',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to practitioner: \$name\" . PHP_EOL;
}

// --- Decimal fields (latitude, longitude) ---
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
  if (!FieldConfig::loadByName('node', 'practitioner', \$name)) {
    FieldConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'bundle'      => 'practitioner',
      'label'       => \$label,
      'required'    => FALSE,
    ])->save();
    echo \"Attached to practitioner: \$name\" . PHP_EOL;
  }
}

// --- field_bio (text_long) ---
\$name = 'field_bio';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'text_long',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'practitioner', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'practitioner',
    'label'       => 'Bio',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to practitioner: \$name\" . PHP_EOL;
}

// --- field_years_experience (integer) ---
\$name = 'field_years_experience';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'integer',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'practitioner', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'practitioner',
    'label'       => 'Years of Experience',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to practitioner: \$name\" . PHP_EOL;
}

// --- Boolean fields ---
\$boolean_fields = [
  'field_accepting_patients'     => 'Accepting Patients',
  'field_accepting_new_patients' => 'Accepting New Patients',
];
foreach (\$boolean_fields as \$name => \$label) {
  if (!FieldStorageConfig::loadByName('node', \$name)) {
    FieldStorageConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'type'        => 'boolean',
      'cardinality' => 1,
    ])->save();
    echo \"Created storage: \$name\" . PHP_EOL;
  }
  if (!FieldConfig::loadByName('node', 'practitioner', \$name)) {
    FieldConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'bundle'      => 'practitioner',
      'label'       => \$label,
      'required'    => FALSE,
    ])->save();
    echo \"Attached to practitioner: \$name\" . PHP_EOL;
  }
}

// --- field_modalities (entity_reference to node/modality, multi-value) ---
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
if (!FieldConfig::loadByName('node', 'practitioner', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'practitioner',
    'label'       => 'Modalities',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['modality' => 'modality'],
      ],
    ],
  ])->save();
  echo \"Attached to practitioner: \$name\" . PHP_EOL;
}

// --- field_clinic (entity_reference to node/clinic, cardinality 1) ---
\$name = 'field_clinic';
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
if (!FieldConfig::loadByName('node', 'practitioner', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'practitioner',
    'label'       => 'Clinic',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['clinic' => 'clinic'],
      ],
    ],
  ])->save();
  echo \"Attached to practitioner: \$name\" . PHP_EOL;
}

echo 'Practitioner fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Practitioner content type setup complete ==="
