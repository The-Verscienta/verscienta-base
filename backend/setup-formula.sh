#!/usr/bin/env bash
# Verscienta Health — Formula content type (recipe + source citations + 加减).
# Run from repo backend dir, e.g.: ddev exec bash setup-formula.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DRUSH="${DRUSH:-vendor/bin/drush}"

echo "🌿 Setting up Formula content type..."

echo "📋 Checking prerequisites (node types: herb, condition)..."
"$DRUSH" php:eval "
\$missing = [];
foreach (['herb', 'condition'] as \$id) {
  if (!\Drupal\node\Entity\NodeType::load(\$id)) {
    \$missing[] = \$id;
  }
}
if (\$missing) {
  fwrite(STDERR, 'Missing node type(s): ' . implode(', ', \$missing) . \"\\nCreate them first (e.g. content-type setup scripts), then re-run.\\n\");
  exit(1);
}
"

echo "📦 Enabling required modules..."
"$DRUSH" en -y paragraphs entity_reference_revisions options text

echo "📜 Applying Formula recipe..."
if [[ -d "web/recipes/verscienta_formula" ]]; then
  "$DRUSH" recipe web/recipes/verscienta_formula
elif [[ -d "recipes/verscienta_formula" ]]; then
  "$DRUSH" recipe recipes/verscienta_formula
else
  echo "❌ Recipe not found (expected web/recipes/verscienta_formula or recipes/verscienta_formula)" >&2
  exit 1
fi

echo "🔧 Enabling JSON:API..."
"$DRUSH" en -y jsonapi jsonapi_extras

# Anonymous GET of published JSON:API resources needs "access content" (idempotent).
"$DRUSH" php:eval "
\$role = \Drupal\user\Entity\Role::load('anonymous');
if (\$role && !\$role->hasPermission('access content')) {
  \$role->grantPermission('access content');
  \$role->save();
  echo 'Granted anonymous: access content' . PHP_EOL;
}
"

echo "➕ Source citations (dynasty / author / year) + classic source if missing..."
bash "$SCRIPT_DIR/setup-formula-source-citations.sh"

echo "➕ Formula modifications (加减)..."
bash "$SCRIPT_DIR/setup-formula-jiajian.sh"

echo "➕ Adding missing formula fields (identity, clinical, decision, biomedical)..."
"$DRUSH" php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- Simple string fields ---
\$string_fields = [
  'field_formula_chinese_name' => 'Chinese Name',
  'field_formula_era'          => 'Historical Era',
  'field_commercial_forms'     => 'Commercial Forms',
];
foreach (\$string_fields as \$name => \$label) {
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

// --- Boolean fields ---
\$boolean_fields = [
  'field_editors_pick'       => \"Editor's Pick\",
  'field_available_premade'  => 'Available Pre-made',
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

// --- List (select) fields ---
\$list_fields = [
  'field_formula_popularity' => [
    'label'   => 'Popularity',
    'values'  => [
      'classic_staple'       => 'Classic Staple',
      'commonly_prescribed'  => 'Commonly Prescribed',
      'specialty'            => 'Specialty',
      'historical_rare'      => 'Historical / Rare',
    ],
  ],
  'field_preparation_difficulty' => [
    'label'   => 'Preparation Difficulty',
    'values'  => [
      'easy'               => 'Easy',
      'moderate'           => 'Moderate',
      'advanced'           => 'Advanced',
      'practitioner_only'  => 'Practitioner Only',
    ],
  ],
  'field_treatment_duration' => [
    'label'   => 'Treatment Duration',
    'values'  => [
      'acute_short'          => 'Acute / Short-term',
      'weeks'                => 'Weeks',
      'months'               => 'Months',
      'seasonal'             => 'Seasonal',
      'constitutional_long'  => 'Constitutional / Long-term',
    ],
  ],
  'field_formula_category' => [
    'label'   => 'Formula Category',
    'values'  => [
      'tonifying'           => 'Tonifying',
      'clearing_heat'       => 'Clearing Heat',
      'releasing_exterior'  => 'Releasing Exterior',
      'regulating_qi'       => 'Regulating Qi',
      'blood_invigorating'  => 'Blood Invigorating',
      'phlegm_resolving'    => 'Phlegm Resolving',
      'digestive'           => 'Digestive',
      'calming'             => 'Calming',
      'warming_interior'    => 'Warming Interior',
      'other'               => 'Other',
    ],
  ],
  'field_evidence_strength' => [
    'label'   => 'Evidence Strength',
    'values'  => [
      'strong'            => 'Strong',
      'moderate'          => 'Moderate',
      'preliminary'       => 'Preliminary',
      'traditional_only'  => 'Traditional Only',
    ],
  ],
];
foreach (\$list_fields as \$name => \$info) {
  if (!FieldStorageConfig::loadByName('node', \$name)) {
    FieldStorageConfig::create([
      'field_name'    => \$name,
      'entity_type'   => 'node',
      'type'          => 'list_string',
      'cardinality'   => 1,
      'settings'      => ['allowed_values' => \$info['values']],
    ])->save();
    echo \"Created storage: \$name\" . PHP_EOL;
  }
  if (!FieldConfig::loadByName('node', 'formula', \$name)) {
    FieldConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'bundle'      => 'formula',
      'label'       => \$info['label'],
      'required'    => FALSE,
    ])->save();
    echo \"Attached to formula: \$name\" . PHP_EOL;
  }
}

// --- Text (long) fields for clinical data ---
\$text_long_fields = [
  'field_actions'            => 'Actions',
  'field_indications'        => 'Indications',
  'field_contraindications'  => 'Contraindications',
  'field_modification_notes' => 'Modification Notes',
];
foreach (\$text_long_fields as \$name => \$label) {
  if (!FieldStorageConfig::loadByName('node', \$name)) {
    FieldStorageConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'type'        => 'text_long',
      'cardinality' => 1,
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

// --- Multi-value string for biomedical conditions ---
\$bio = 'field_biomedical_conditions';
if (!FieldStorageConfig::loadByName('node', \$bio)) {
  FieldStorageConfig::create([
    'field_name'  => \$bio,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => -1,
    'settings'    => ['max_length' => 255],
  ])->save();
  echo \"Created storage: \$bio\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'formula', \$bio)) {
  FieldConfig::create([
    'field_name'   => \$bio,
    'entity_type'  => 'node',
    'bundle'       => 'formula',
    'label'        => 'Biomedical Conditions',
    'description'  => 'Western medical condition equivalents',
    'required'     => FALSE,
  ])->save();
  echo \"Attached to formula: \$bio\" . PHP_EOL;
}

// --- Entity reference to parent formula ---
\$parent = 'field_parent_formula';
if (!FieldStorageConfig::loadByName('node', \$parent)) {
  FieldStorageConfig::create([
    'field_name'  => \$parent,
    'entity_type' => 'node',
    'type'        => 'entity_reference',
    'cardinality' => 1,
    'settings'    => ['target_type' => 'node'],
  ])->save();
  echo \"Created storage: \$parent\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'formula', \$parent)) {
  FieldConfig::create([
    'field_name'  => \$parent,
    'entity_type' => 'node',
    'bundle'      => 'formula',
    'label'       => 'Parent Formula',
    'description' => 'Base formula this is derived from',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default',
      'handler_settings' => [
        'target_bundles' => ['formula' => 'formula'],
      ],
    ],
  ])->save();
  echo \"Attached to formula: \$parent\" . PHP_EOL;
}

echo '16 missing formula fields checked/created.' . PHP_EOL;
"

echo "🧹 Clearing caches..."
"$DRUSH" cr

echo ""
echo "✅ Formula setup complete."
echo ""
echo "Next steps:"
echo "  • Create or verify herb and condition content as needed."
echo "  • Curated cross-links: edit formulas and fill “Related formulas (curated)” when the recipe/config includes field_related_formulas (config import if upgrading)."
echo "  • Add formulas at /node/add/formula"
echo "  • JSON:API (published content): /jsonapi/node/formula"
echo "  • Include ingredients: /jsonapi/node/formula?include=field_herb_ingredients"
echo ""
