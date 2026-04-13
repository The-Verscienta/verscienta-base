#!/usr/bin/env bash
# Verscienta Health — Review content type setup. Idempotent.
# Run: ddev exec bash setup-review.sh (from backend/)
set -euo pipefail

cd "$(dirname "$0")"
DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up Review content type ==="

"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- Content type ---
if (!NodeType::load('review')) {
  NodeType::create([
    'type'        => 'review',
    'name'        => 'Review',
    'description' => 'A user review or rating for any content.',
  ])->save();
  echo 'Created content type: review' . PHP_EOL;
} else {
  echo 'Content type review already exists.' . PHP_EOL;
}

// --- field_rating (integer) ---
\$name = 'field_rating';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'integer',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'review', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'review',
    'label'       => 'Rating',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to review: \$name\" . PHP_EOL;
}

// --- field_comment (text_long) ---
\$name = 'field_comment';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'text_long',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'review', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'review',
    'label'       => 'Comment',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to review: \$name\" . PHP_EOL;
}

// --- field_reviewed_entity (entity_reference to node, cardinality 1, no target_bundles) ---
\$name = 'field_reviewed_entity';
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
if (!FieldConfig::loadByName('node', 'review', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'review',
    'label'       => 'Reviewed Entity',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => NULL,
      ],
    ],
  ])->save();
  echo \"Attached to review: \$name\" . PHP_EOL;
}

echo 'Review fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Review content type setup complete ==="
