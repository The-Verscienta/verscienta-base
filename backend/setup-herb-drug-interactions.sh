#!/usr/bin/env bash
# Setup herb_drug_interaction paragraph type on herb content type.
# Adds field_drug_interactions (entity_reference_revisions) to herb,
# with paragraph bundle: herb_drug_interaction.
# Fields: field_drug_name, field_interaction_type, field_interaction_description
# Run: bash backend/setup-herb-drug-interactions.sh

set -euo pipefail

echo "=== Setting up Herb-Drug Interaction paragraph type ==="

# Step 1: Create paragraph type
ddev drush php:eval "
\$type = \Drupal\paragraphs\Entity\ParagraphsType::load('herb_drug_interaction');
if (!\$type) {
  \$type = \Drupal\paragraphs\Entity\ParagraphsType::create([
    'id' => 'herb_drug_interaction',
    'label' => 'Herb-Drug Interaction',
    'description' => 'A known interaction between this herb and a pharmaceutical drug.',
  ]);
  \$type->save();
  echo 'Created herb_drug_interaction paragraph type' . PHP_EOL;
} else {
  echo 'herb_drug_interaction paragraph type already exists' . PHP_EOL;
}"

# Step 2: Create field storages on paragraph entity
ddev drush php:eval "
\$storage_defs = [
  ['name' => 'field_drug_name',                'type' => 'string',    'settings' => ['max_length' => 255]],
  ['name' => 'field_interaction_type',         'type' => 'string',    'settings' => ['max_length' => 255]],
  ['name' => 'field_interaction_description',  'type' => 'text_long', 'settings' => []],
];
foreach (\$storage_defs as \$def) {
  \$existing = \Drupal\field\Entity\FieldStorageConfig::loadByName('paragraph', \$def['name']);
  if (!\$existing) {
    \Drupal\field\Entity\FieldStorageConfig::create([
      'field_name'  => \$def['name'],
      'entity_type' => 'paragraph',
      'type'        => \$def['type'],
      'settings'    => \$def['settings'],
      'cardinality' => 1,
    ])->save();
    echo 'Created ' . \$def['name'] . ' storage on paragraph' . PHP_EOL;
  } else {
    echo \$def['name'] . ' storage already exists on paragraph' . PHP_EOL;
  }
}"

# Step 3: Attach fields to herb_drug_interaction paragraph bundle
ddev drush php:eval "
\$bundle = 'herb_drug_interaction';
\$field_configs = [
  ['name' => 'field_drug_name',               'label' => 'Drug Name',               'required' => TRUE],
  ['name' => 'field_interaction_type',        'label' => 'Interaction Type',        'required' => FALSE],
  ['name' => 'field_interaction_description', 'label' => 'Interaction Description', 'required' => FALSE],
];
foreach (\$field_configs as \$cfg) {
  if (!\Drupal\field\Entity\FieldConfig::loadByName('paragraph', \$bundle, \$cfg['name'])) {
    \Drupal\field\Entity\FieldConfig::create([
      'field_name'  => \$cfg['name'],
      'entity_type' => 'paragraph',
      'bundle'      => \$bundle,
      'label'       => \$cfg['label'],
      'required'    => \$cfg['required'],
    ])->save();
    echo 'Attached ' . \$cfg['name'] . ' to ' . \$bundle . PHP_EOL;
  } else {
    echo \$cfg['name'] . ' already attached to ' . \$bundle . PHP_EOL;
  }
}"

# Step 4: Create field_drug_interactions storage on node (entity_reference_revisions → paragraph)
ddev drush php:eval "
\$storage = \Drupal\field\Entity\FieldStorageConfig::loadByName('node', 'field_drug_interactions');
if (!\$storage) {
  \Drupal\field\Entity\FieldStorageConfig::create([
    'field_name'  => 'field_drug_interactions',
    'entity_type' => 'node',
    'type'        => 'entity_reference_revisions',
    'settings'    => ['target_type' => 'paragraph'],
    'cardinality' => -1,
  ])->save();
  echo 'Created field_drug_interactions storage on node' . PHP_EOL;
} else {
  echo 'field_drug_interactions storage on node already exists' . PHP_EOL;
}"

# Step 5: Attach field_drug_interactions to herb content type
ddev drush php:eval "
if (!\Drupal\field\Entity\FieldConfig::loadByName('node', 'herb', 'field_drug_interactions')) {
  \Drupal\field\Entity\FieldConfig::create([
    'field_name'  => 'field_drug_interactions',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Drug Interactions',
    'settings'    => [
      'handler'          => 'default:paragraph',
      'handler_settings' => ['target_bundles' => ['herb_drug_interaction' => 'herb_drug_interaction']],
    ],
  ])->save();
  echo 'Attached field_drug_interactions to herb content type' . PHP_EOL;
} else {
  echo 'field_drug_interactions already attached to herb' . PHP_EOL;
}"

ddev drush cache:rebuild
echo "=== Herb-Drug Interaction setup complete ==="
