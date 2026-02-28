#!/usr/bin/env bash
# §12.2 Item 3 — Herb Pairings backend setup
# Creates the herb_pairing paragraph type and attaches it to the herb content type.
set -euo pipefail

echo "=== Setting up Herb Pairings ==="

DRUSH="vendor/bin/drush"
cd "$(dirname "$0")"

# 1. Create herb_pairing paragraph type
$DRUSH php:eval "
\$type = \Drupal\paragraphs\Entity\ParagraphsType::create([
  'id' => 'herb_pairing',
  'label' => 'Herb Pairing',
]);
\$type->save();
echo 'Created herb_pairing paragraph type' . PHP_EOL;
"

# 2. field_partner_herb — entity_reference → node/herb
$DRUSH field:create \
  --entity-type=paragraph \
  --bundle=herb_pairing \
  --field-name=field_partner_herb \
  --field-label="Partner Herb" \
  --field-type=entity_reference \
  --field-settings='{"target_type":"node"}' \
  --required=1

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('paragraph', 'herb_pairing', 'field_partner_herb');
if (\$field) {
  \$field->setSetting('handler', 'default:node');
  \$field->setSetting('handler_settings', ['target_bundles' => ['herb' => 'herb']]);
  \$field->save();
  echo 'Configured field_partner_herb handler' . PHP_EOL;
}
"

# 3. field_synergistic_action — text_long
$DRUSH field:create \
  --entity-type=paragraph \
  --bundle=herb_pairing \
  --field-name=field_synergistic_action \
  --field-label="Synergistic Action" \
  --field-type=text_long \
  --required=0

# 4. field_example_formula — entity_reference → node/formula (optional)
$DRUSH field:create \
  --entity-type=paragraph \
  --bundle=herb_pairing \
  --field-name=field_example_formula \
  --field-label="Example Formula" \
  --field-type=entity_reference \
  --field-settings='{"target_type":"node"}' \
  --required=0

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('paragraph', 'herb_pairing', 'field_example_formula');
if (\$field) {
  \$field->setSetting('handler', 'default:node');
  \$field->setSetting('handler_settings', ['target_bundles' => ['formula' => 'formula']]);
  \$field->save();
  echo 'Configured field_example_formula handler' . PHP_EOL;
}
"

# 5. Add field_herb_pairings to the herb content type
$DRUSH field:create \
  --entity-type=node \
  --bundle=herb \
  --field-name=field_herb_pairings \
  --field-label="Herb Pairings" \
  --field-type=entity_reference_revisions \
  --field-settings='{"target_type":"paragraph"}' \
  --cardinality=-1 \
  --required=0

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('node', 'herb', 'field_herb_pairings');
if (\$field) {
  \$field->setSetting('handler_settings', ['target_bundles' => ['herb_pairing' => 'herb_pairing']]);
  \$field->save();
  echo 'Configured field_herb_pairings handler' . PHP_EOL;
}
"

# 6. JSON:API config — expose paragraphs
$DRUSH php:eval "
\$config = \Drupal::configFactory()->getEditable('jsonapi_extras.jsonapi_resource_config.paragraph--herb_pairing');
\$config->set('resourceType', 'paragraph--herb_pairing');
\$config->set('path', 'paragraph/herb_pairing');
\$config->set('disabled', FALSE);
\$config->save();
echo 'JSON:API config for paragraph--herb_pairing saved' . PHP_EOL;
"

$DRUSH cache:rebuild
echo "=== Herb Pairings setup complete ==="
