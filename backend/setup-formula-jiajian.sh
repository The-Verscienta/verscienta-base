#!/usr/bin/env bash
# §12.2 — Formula Modifications (加减): paragraph type + fields on formula. Idempotent.
set -euo pipefail

echo "=== Setting up Formula Modifications (加减) ==="

DRUSH="${DRUSH:-vendor/bin/drush}"
cd "$(dirname "$0")"

php_has() {
  "$DRUSH" php:eval "echo $1 ? 'yes' : 'no';" 2>/dev/null | tr -d '\r'
}

# 1. Paragraph type formula_modification
if [[ "$(php_has "\\Drupal\\paragraphs\\Entity\\ParagraphsType::load('formula_modification')")" != "yes" ]]; then
  "$DRUSH" php:eval "
\$type = \Drupal\paragraphs\Entity\ParagraphsType::create([
  'id' => 'formula_modification',
  'label' => 'Formula Modification',
]);
\$type->save();
echo 'Created formula_modification paragraph type' . PHP_EOL;
"
else
  echo "Paragraph type formula_modification already exists — skipping create."
fi

# 2. field_modification_condition (string)
if [[ "$(php_has "\\Drupal\\field\\Entity\\FieldConfig::loadByName('paragraph', 'formula_modification', 'field_modification_condition')")" != "yes" ]]; then
  "$DRUSH" field:create \
    --entity-type=paragraph \
    --bundle=formula_modification \
    --field-name=field_modification_condition \
    --field-label="Modification Condition" \
    --field-type=string \
    --required=0
else
  echo "field_modification_condition already exists — skipping field:create."
fi

"$DRUSH" php:eval "
\$s = \Drupal\field\Entity\FieldStorageConfig::loadByName('paragraph', 'field_modification_condition');
if (\$s && (int) \$s->getSetting('max_length') !== 512) {
  \$s->setSetting('max_length', 512);
  \$s->save();
  echo 'Set max_length=512 for field_modification_condition' . PHP_EOL;
}
"

# 3. field_modification_action (list_string)
if [[ "$(php_has "\\Drupal\\field\\Entity\\FieldConfig::loadByName('paragraph', 'formula_modification', 'field_modification_action')")" != "yes" ]]; then
  "$DRUSH" field:create \
    --entity-type=paragraph \
    --bundle=formula_modification \
    --field-name=field_modification_action \
    --field-label="Action" \
    --field-type=list_string \
    --required=0
fi

"$DRUSH" php:eval "
\$field = \Drupal\field\Entity\FieldStorageConfig::loadByName('paragraph', 'field_modification_action');
if (\$field) {
  \$field->setSetting('allowed_values', [
    'add' => 'Add',
    'remove' => 'Remove',
    'increase' => 'Increase',
    'decrease' => 'Decrease',
  ]);
  \$field->save();
  echo 'Ensured allowed_values for field_modification_action' . PHP_EOL;
}
"

# 4. field_modification_herb (entity reference → herb)
if [[ "$(php_has "\\Drupal\\field\\Entity\\FieldConfig::loadByName('paragraph', 'formula_modification', 'field_modification_herb')")" != "yes" ]]; then
  "$DRUSH" field:create \
    --entity-type=paragraph \
    --bundle=formula_modification \
    --field-name=field_modification_herb \
    --field-label="Herb" \
    --field-type=entity_reference \
    --field-settings='{"target_type":"node"}' \
    --required=1
fi

"$DRUSH" php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('paragraph', 'formula_modification', 'field_modification_herb');
if (\$field) {
  \$field->setSetting('handler', 'default:node');
  \$field->setSetting('handler_settings', ['target_bundles' => ['herb' => 'herb']]);
  \$field->save();
  echo 'Configured field_modification_herb handler' . PHP_EOL;
}
"

# 5. field_modification_amount (string)
if [[ "$(php_has "\\Drupal\\field\\Entity\\FieldConfig::loadByName('paragraph', 'formula_modification', 'field_modification_amount')")" != "yes" ]]; then
  "$DRUSH" field:create \
    --entity-type=paragraph \
    --bundle=formula_modification \
    --field-name=field_modification_amount \
    --field-label="Amount" \
    --field-type=string \
    --required=0
fi

# 6. field_modification_note (text_long)
if [[ "$(php_has "\\Drupal\\field\\Entity\\FieldConfig::loadByName('paragraph', 'formula_modification', 'field_modification_note')")" != "yes" ]]; then
  "$DRUSH" field:create \
    --entity-type=paragraph \
    --bundle=formula_modification \
    --field-name=field_modification_note \
    --field-label="Note" \
    --field-type=text_long \
    --required=0
fi

# 7. field_jia_jian on node formula
if [[ "$(php_has "\\Drupal\\field\\Entity\\FieldConfig::loadByName('node', 'formula', 'field_jia_jian')")" != "yes" ]]; then
  "$DRUSH" field:create \
    --entity-type=node \
    --bundle=formula \
    --field-name=field_jia_jian \
    --field-label="Formula Modifications (加减)" \
    --field-type=entity_reference_revisions \
    --field-settings='{"target_type":"paragraph"}' \
    --cardinality=-1 \
    --required=0
fi

"$DRUSH" php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('node', 'formula', 'field_jia_jian');
if (\$field) {
  \$field->setSetting('handler_settings', ['target_bundles' => ['formula_modification' => 'formula_modification']]);
  \$field->save();
  echo 'Configured field_jia_jian handler' . PHP_EOL;
}
"

# 8. JSON:API Extras — expose paragraph--formula_modification (requires jsonapi_extras enabled)
"$DRUSH" php:eval "
if (!\Drupal::moduleHandler()->moduleExists('jsonapi_extras')) {
  echo 'jsonapi_extras not enabled — skip resource config' . PHP_EOL;
  return;
}
\$config = \Drupal::configFactory()->getEditable('jsonapi_extras.jsonapi_resource_config.paragraph--formula_modification');
\$config->set('resourceType', 'paragraph--formula_modification');
\$config->set('path', 'paragraph/formula_modification');
\$config->set('disabled', FALSE);
\$config->save();
echo 'JSON:API extras config for paragraph--formula_modification saved' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Formula Modifications (加减) setup complete ==="
