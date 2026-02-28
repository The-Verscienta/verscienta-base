#!/usr/bin/env bash
# §12.3 — Formula historical source citations
# Adds field_source_dynasty, field_source_author, field_source_year to formula.
# field_classic_source already exists from prior setup.
# Run inside the Drupal container: docker compose exec drupal bash < backend/setup-formula-source-citations.sh
set -euo pipefail

DRUSH="vendor/bin/drush"
cd "$(dirname "$0")"

echo "=== Setting up Formula Historical Source Citation fields ==="

$DRUSH php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

\$fields = [
  'field_source_dynasty' => 'Source Dynasty',
  'field_source_author'  => 'Source Author',
  'field_source_year'    => 'Source Year',
];

foreach (\$fields as \$name => \$label) {
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
"

$DRUSH cache:rebuild
echo "=== Formula source citation fields setup complete ==="
