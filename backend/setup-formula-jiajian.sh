#!/usr/bin/env bash
# §12.2 Item 4 — Formula Modifications (加减) backend setup
# Creates the formula_modification paragraph type and attaches it to formula.
set -euo pipefail

echo "=== Setting up Formula Modifications (加减) ==="

DRUSH="vendor/bin/drush"
cd "$(dirname "$0")"

# 1. Create formula_modification paragraph type
$DRUSH php:eval "
\$type = \Drupal\paragraphs\Entity\ParagraphsType::create([
  'id' => 'formula_modification',
  'label' => 'Formula Modification',
]);
\$type->save();
echo 'Created formula_modification paragraph type' . PHP_EOL;
"

# 2. field_modification_condition — string, 512
$DRUSH field:create \
  --entity-type=paragraph \
  --bundle=formula_modification \
  --field-name=field_modification_condition \
  --field-label="Modification Condition" \
  --field-type=string \
  --required=0

# 3. field_modification_action — list_string
$DRUSH field:create \
  --entity-type=paragraph \
  --bundle=formula_modification \
  --field-name=field_modification_action \
  --field-label="Action" \
  --field-type=list_string \
  --required=0

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldStorageConfig::loadByName('paragraph', 'field_modification_action');
if (\$field) {
  \$field->setSetting('allowed_values', [
    'add' => 'Add',
    'remove' => 'Remove',
    'increase' => 'Increase',
    'decrease' => 'Decrease',
  ]);
  \$field->save();
  echo 'Set allowed_values for field_modification_action' . PHP_EOL;
}
"

# 4. field_modification_herb — entity_reference → node/herb
$DRUSH field:create \
  --entity-type=paragraph \
  --bundle=formula_modification \
  --field-name=field_modification_herb \
  --field-label="Herb" \
  --field-type=entity_reference \
  --field-settings='{"target_type":"node"}' \
  --required=1

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('paragraph', 'formula_modification', 'field_modification_herb');
if (\$field) {
  \$field->setSetting('handler', 'default:node');
  \$field->setSetting('handler_settings', ['target_bundles' => ['herb' => 'herb']]);
  \$field->save();
  echo 'Configured field_modification_herb handler' . PHP_EOL;
}
"

# 5. field_modification_amount — string, 255
$DRUSH field:create \
  --entity-type=paragraph \
  --bundle=formula_modification \
  --field-name=field_modification_amount \
  --field-label="Amount" \
  --field-type=string \
  --required=0

# 6. field_modification_note — text_long, optional
$DRUSH field:create \
  --entity-type=paragraph \
  --bundle=formula_modification \
  --field-name=field_modification_note \
  --field-label="Note" \
  --field-type=text_long \
  --required=0

# 7. Add field_jia_jian to formula content type
$DRUSH field:create \
  --entity-type=node \
  --bundle=formula \
  --field-name=field_jia_jian \
  --field-label="Formula Modifications (加减)" \
  --field-type=entity_reference_revisions \
  --field-settings='{"target_type":"paragraph"}' \
  --cardinality=-1 \
  --required=0

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('node', 'formula', 'field_jia_jian');
if (\$field) {
  \$field->setSetting('handler_settings', ['target_bundles' => ['formula_modification' => 'formula_modification']]);
  \$field->save();
  echo 'Configured field_jia_jian handler' . PHP_EOL;
}
"

# 8. JSON:API config
$DRUSH php:eval "
\$config = \Drupal::configFactory()->getEditable('jsonapi_extras.jsonapi_resource_config.paragraph--formula_modification');
\$config->set('resourceType', 'paragraph--formula_modification');
\$config->set('path', 'paragraph/formula_modification');
\$config->set('disabled', FALSE);
\$config->save();
echo 'JSON:API config for paragraph--formula_modification saved' . PHP_EOL;
"

$DRUSH cache:rebuild
echo "=== Formula Modifications (加减) setup complete ==="
