#!/usr/bin/env bash
# §12.3 — Formula historical source citations
# Adds field_source_dynasty, field_source_author, field_source_year, and (if missing)
# field_classic_source on the formula bundle. Idempotent.
# Run: ddev exec bash setup-formula-source-citations.sh (from backend/)
set -euo pipefail

DRUSH="${DRUSH:-vendor/bin/drush}"
cd "$(dirname "$0")"

echo "=== Setting up Formula historical source citation fields ==="

"$DRUSH" php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

\$dynasty_author_year = [
  'field_source_dynasty' => 'Source Dynasty',
  'field_source_author'  => 'Source Author',
  'field_source_year'    => 'Source Year',
];

foreach (\$dynasty_author_year as \$name => \$label) {
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
  if (!FieldConfig::loadByName('node', 'formula', \$name)) {
    FieldConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'bundle'      => 'formula',
      'label'       => \$label,
      'required'    => FALSE,
    ])->save();
    echo \"Attached to formula: \$name\" . PHP_EOL;
  }
}

// Classic Source (same as setup-additional-fields.sh) — create only if missing.
\$classic = 'field_classic_source';
if (!FieldStorageConfig::loadByName('node', \$classic)) {
  FieldStorageConfig::create([
    'field_name'  => \$classic,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => 1,
    'settings'    => ['max_length' => 255],
  ])->save();
  echo \"Created storage: \$classic\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'formula', \$classic)) {
  FieldConfig::create([
    'field_name'  => \$classic,
    'entity_type' => 'node',
    'bundle'      => 'formula',
    'label'       => 'Classic Source',
    'description' => 'Original text where this formula appears',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to formula: \$classic\" . PHP_EOL;
}
"

"$DRUSH" cache:rebuild
echo "=== Formula source citation fields setup complete ==="
