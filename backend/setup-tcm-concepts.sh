#!/usr/bin/env bash
# §12.2 Item 5 — TCM Concepts database backend setup
set -euo pipefail

echo "=== Setting up TCM Concepts ==="

DRUSH="vendor/bin/drush"
cd "$(dirname "$0")"

# 1. Create concept_category taxonomy vocabulary
$DRUSH php:eval "
if (!\Drupal\taxonomy\Entity\Vocabulary::load('concept_category')) {
  \$vocab = \Drupal\taxonomy\Entity\Vocabulary::create([
    'vid' => 'concept_category',
    'name' => 'Concept Category',
    'description' => 'Categories for TCM theoretical concepts',
  ]);
  \$vocab->save();
  echo 'Created concept_category vocabulary' . PHP_EOL;
}
"

# 2. Create the 6 concept category terms
$DRUSH php:eval "
\$terms = [
  'Fundamental Substances',
  'Pathogenic Factors',
  'Diagnostic Frameworks',
  'Five Element Theory',
  'Treatment Methods',
  'Constitutional Theory',
];
foreach (\$terms as \$name) {
  \$existing = \Drupal::entityTypeManager()->getStorage('taxonomy_term')
    ->loadByProperties(['name' => \$name, 'vid' => 'concept_category']);
  if (empty(\$existing)) {
    \$term = \Drupal\taxonomy\Entity\Term::create([
      'name' => \$name,
      'vid' => 'concept_category',
    ]);
    \$term->save();
    echo 'Created term: ' . \$name . PHP_EOL;
  }
}
"

# 3. Create tcm_concept content type
$DRUSH php:eval "
if (!\Drupal\node\Entity\NodeType::load('tcm_concept')) {
  \$type = \Drupal\node\Entity\NodeType::create([
    'type' => 'tcm_concept',
    'name' => 'TCM Concept',
    'description' => 'TCM theoretical concepts and frameworks',
  ]);
  \$type->save();
  echo 'Created tcm_concept content type' . PHP_EOL;
}
"

# 4. Create fields on tcm_concept

# field_concept_chinese_name
$DRUSH field:create \
  --entity-type=node \
  --bundle=tcm_concept \
  --field-name=field_concept_chinese_name \
  --field-label="Chinese Name" \
  --field-type=string \
  --required=0

# field_concept_pinyin_name
$DRUSH field:create \
  --entity-type=node \
  --bundle=tcm_concept \
  --field-name=field_concept_pinyin_name \
  --field-label="Pinyin Name" \
  --field-type=string \
  --required=0

# field_concept_category — taxonomy reference
$DRUSH field:create \
  --entity-type=node \
  --bundle=tcm_concept \
  --field-name=field_concept_category \
  --field-label="Concept Category" \
  --field-type=entity_reference \
  --field-settings='{"target_type":"taxonomy_term"}' \
  --required=0

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('node', 'tcm_concept', 'field_concept_category');
if (\$field) {
  \$field->setSetting('handler', 'default:taxonomy_term');
  \$field->setSetting('handler_settings', ['target_bundles' => ['concept_category' => 'concept_category']]);
  \$field->save();
  echo 'Configured field_concept_category handler' . PHP_EOL;
}
"

# field_clinical_relevance — text_long
$DRUSH field:create \
  --entity-type=node \
  --bundle=tcm_concept \
  --field-name=field_clinical_relevance \
  --field-label="Clinical Relevance" \
  --field-type=text_long \
  --required=0

# field_related_patterns
$DRUSH field:create \
  --entity-type=node \
  --bundle=tcm_concept \
  --field-name=field_related_patterns \
  --field-label="Related Patterns" \
  --field-type=entity_reference \
  --field-settings='{"target_type":"node"}' \
  --cardinality=-1 \
  --required=0

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('node', 'tcm_concept', 'field_related_patterns');
if (\$field) {
  \$field->setSetting('handler', 'default:node');
  \$field->setSetting('handler_settings', ['target_bundles' => ['tcm_pattern' => 'tcm_pattern']]);
  \$field->save();
  echo 'Configured field_related_patterns handler' . PHP_EOL;
}
"

# field_related_herbs
$DRUSH field:create \
  --entity-type=node \
  --bundle=tcm_concept \
  --field-name=field_related_herbs \
  --field-label="Related Herbs" \
  --field-type=entity_reference \
  --field-settings='{"target_type":"node"}' \
  --cardinality=-1 \
  --required=0

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('node', 'tcm_concept', 'field_related_herbs');
if (\$field) {
  \$field->setSetting('handler', 'default:node');
  \$field->setSetting('handler_settings', ['target_bundles' => ['herb' => 'herb']]);
  \$field->save();
  echo 'Configured field_related_herbs handler' . PHP_EOL;
}
"

# field_related_formulas
$DRUSH field:create \
  --entity-type=node \
  --bundle=tcm_concept \
  --field-name=field_related_formulas \
  --field-label="Related Formulas" \
  --field-type=entity_reference \
  --field-settings='{"target_type":"node"}' \
  --cardinality=-1 \
  --required=0

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldConfig::loadByName('node', 'tcm_concept', 'field_related_formulas');
if (\$field) {
  \$field->setSetting('handler', 'default:node');
  \$field->setSetting('handler_settings', ['target_bundles' => ['formula' => 'formula']]);
  \$field->save();
  echo 'Configured field_related_formulas handler' . PHP_EOL;
}
"

# field_editors_pick — boolean
$DRUSH field:create \
  --entity-type=node \
  --bundle=tcm_concept \
  --field-name=field_editors_pick \
  --field-label="Editor's Pick" \
  --field-type=boolean \
  --required=0

# field_popularity — list_string
$DRUSH field:create \
  --entity-type=node \
  --bundle=tcm_concept \
  --field-name=field_popularity \
  --field-label="Popularity" \
  --field-type=list_string \
  --required=0

$DRUSH php:eval "
\$field = \Drupal\field\Entity\FieldStorageConfig::loadByName('node', 'field_popularity');
if (!\$field) {
  echo 'Note: field_popularity storage may already exist from herb type' . PHP_EOL;
}
\$fieldConfig = \Drupal\field\Entity\FieldConfig::loadByName('node', 'tcm_concept', 'field_popularity');
if (\$fieldConfig) {
  echo 'field_popularity attached to tcm_concept' . PHP_EOL;
}
"

# 5. JSON:API config for node--tcm_concept and taxonomy_term--concept_category
$DRUSH php:eval "
\$configs = [
  'jsonapi_extras.jsonapi_resource_config.node--tcm_concept' => [
    'resourceType' => 'node--tcm_concept',
    'path' => 'node/tcm_concept',
    'disabled' => FALSE,
  ],
  'jsonapi_extras.jsonapi_resource_config.taxonomy_term--concept_category' => [
    'resourceType' => 'taxonomy_term--concept_category',
    'path' => 'taxonomy_term/concept_category',
    'disabled' => FALSE,
  ],
];
foreach (\$configs as \$key => \$values) {
  \$config = \Drupal::configFactory()->getEditable(\$key);
  foreach (\$values as \$k => \$v) {
    \$config->set(\$k, \$v);
  }
  \$config->save();
  echo 'Saved JSON:API config: ' . \$key . PHP_EOL;
}
"

$DRUSH cache:rebuild
echo "=== TCM Concepts setup complete ==="
