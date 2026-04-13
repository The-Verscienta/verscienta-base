#!/usr/bin/env bash
# §12.3 — Herb Processing Variations (Paozhi 炮製) backend setup
# Creates the herb_processing paragraph type and attaches it to the herb content type.
# Run inside the Drupal container: docker compose exec drupal bash < backend/setup-herb-processing.sh
set -euo pipefail

DRUSH="${DRUSH:-vendor/bin/drush}"
cd "$(dirname "$0")"

php_has() {
  "$DRUSH" php:eval "echo $1 ? 'yes' : 'no';" 2>/dev/null | tr -d '\r'
}

echo "=== Setting up Herb Processing Variations (Paozhi 炮製) ==="

# 1. Create herb_processing paragraph type
"$DRUSH" php:eval "
use Drupal\paragraphs\Entity\ParagraphsType;
if (!ParagraphsType::load('herb_processing')) {
  ParagraphsType::create([
    'id'    => 'herb_processing',
    'label' => 'Herb Processing (Paozhi)',
  ])->save();
  echo 'Created herb_processing paragraph type' . PHP_EOL;
} else {
  echo 'herb_processing paragraph type already exists' . PHP_EOL;
}
"

# 2. field_processing_method — string (required)
if [[ "$(php_has "\\Drupal\\field\\Entity\\FieldConfig::loadByName('paragraph', 'herb_processing', 'field_processing_method')")" != "yes" ]]; then
  "$DRUSH" field:create \
    --entity-type=paragraph \
    --bundle=herb_processing \
    --field-name=field_processing_method \
    --field-label="Processing Method" \
    --field-type=string \
    --required=1
else
  echo "field_processing_method already exists — skipping field:create."
fi

# 3. field_processing_effect — text_long (how properties change)
if [[ "$(php_has "\\Drupal\\field\\Entity\\FieldConfig::loadByName('paragraph', 'herb_processing', 'field_processing_effect')")" != "yes" ]]; then
  "$DRUSH" field:create \
    --entity-type=paragraph \
    --bundle=herb_processing \
    --field-name=field_processing_effect \
    --field-label="Effect on Properties" \
    --field-type=text_long \
    --required=0
else
  echo "field_processing_effect already exists — skipping field:create."
fi

# 4. field_processing_indication_change — text_long (how indications shift)
if [[ "$(php_has "\\Drupal\\field\\Entity\\FieldConfig::loadByName('paragraph', 'herb_processing', 'field_processing_indication_change')")" != "yes" ]]; then
  "$DRUSH" field:create \
    --entity-type=paragraph \
    --bundle=herb_processing \
    --field-name=field_processing_indication_change \
    --field-label="Indication Change" \
    --field-type=text_long \
    --required=0
else
  echo "field_processing_indication_change already exists — skipping field:create."
fi

# 5. Add field_processing_variations to herb content type
if [[ "$(php_has "\\Drupal\\field\\Entity\\FieldConfig::loadByName('node', 'herb', 'field_processing_variations')")" != "yes" ]]; then
  "$DRUSH" field:create \
    --entity-type=node \
    --bundle=herb \
    --field-name=field_processing_variations \
    --field-label="Processing Variations (Paozhi)" \
    --field-type=entity_reference_revisions \
    --field-settings='{"target_type":"paragraph"}' \
    --cardinality=-1 \
    --required=0
else
  echo "field_processing_variations already exists — skipping field:create."
fi

"$DRUSH" php:eval "
use Drupal\field\Entity\FieldConfig;
\$field = FieldConfig::loadByName('node', 'herb', 'field_processing_variations');
if (\$field) {
  \$field->setSetting('handler_settings', ['target_bundles' => ['herb_processing' => 'herb_processing']]);
  \$field->save();
  echo 'Configured field_processing_variations handler' . PHP_EOL;
}
"

# 6. Expose via JSON:API
"$DRUSH" php:eval "
\$config = \Drupal::configFactory()->getEditable('jsonapi_extras.jsonapi_resource_config.paragraph--herb_processing');
\$config->set('resourceType', 'paragraph--herb_processing');
\$config->set('path', 'paragraph/herb_processing');
\$config->set('disabled', FALSE);
\$config->save();
echo 'JSON:API config for paragraph--herb_processing saved' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Herb Processing Variations setup complete ==="
