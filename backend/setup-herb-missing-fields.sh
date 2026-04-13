#!/usr/bin/env bash
# Verscienta Health — Supplementary herb fields
# Adds fields expected by the frontend TypeScript HerbEntity interface
# that are NOT created by the base setup-herb-content-type.sh or other
# supplementary scripts (pairings, processing, drug interactions, safety, tongue/pulse).
#
# Idempotent — safe to re-run.
# Run: ddev exec bash setup-herb-missing-fields.sh (from backend/)
set -euo pipefail

cd "$(dirname "$0")"
DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up missing herb fields ==="

"$DRUSH" en -y paragraphs entity_reference_revisions

"$DRUSH" php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;
use Drupal\paragraphs\Entity\ParagraphsType;

// ─── Helper ──────────────────────────────────────────────────────────────────
function ensure_storage(string \$name, string \$type, int \$card = 1, array \$settings = []): void {
  if (!FieldStorageConfig::loadByName('node', \$name)) {
    FieldStorageConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'type'        => \$type,
      'cardinality' => \$card,
      'settings'    => \$settings,
    ])->save();
    echo \"  Created storage: \$name\\n\";
  }
}

function ensure_field(string \$name, string \$bundle, string \$label, bool \$required = FALSE, array \$settings = []): void {
  if (!FieldConfig::loadByName('node', \$bundle, \$name)) {
    FieldConfig::create(array_merge([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'bundle'      => \$bundle,
      'label'       => \$label,
      'required'    => \$required,
    ], \$settings ? ['settings' => \$settings] : []))->save();
    echo \"  Attached to herb: \$name\\n\";
  }
}

function ensure_para_storage(string \$name, string \$type, int \$card = 1, array \$settings = []): void {
  if (!FieldStorageConfig::loadByName('paragraph', \$name)) {
    FieldStorageConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'paragraph',
      'type'        => \$type,
      'cardinality' => \$card,
      'settings'    => \$settings,
    ])->save();
    echo \"  Created paragraph storage: \$name\\n\";
  }
}

function ensure_para_field(string \$name, string \$bundle, string \$label, bool \$required = FALSE): void {
  if (!FieldConfig::loadByName('paragraph', \$bundle, \$name)) {
    FieldConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'paragraph',
      'bundle'      => \$bundle,
      'label'       => \$label,
      'required'    => \$required,
    ])->save();
    echo \"  Attached to \$bundle: \$name\\n\";
  }
}

function ensure_para_type(string \$id, string \$label): void {
  if (!ParagraphsType::load(\$id)) {
    ParagraphsType::create(['id' => \$id, 'label' => \$label])->save();
    echo \"  Created paragraph type: \$id\\n\";
  }
}

// ─── 1. Identity / Database Integration Fields ──────────────────────────────
echo \"\\n--- Identity & Database Integration ---\\n\";

ensure_storage('field_herb_latin_name', 'string', 1, ['max_length' => 255]);
ensure_field('field_herb_latin_name', 'herb', 'Latin Name');

ensure_storage('field_herb_pinyin_name', 'string', 1, ['max_length' => 255]);
ensure_field('field_herb_pinyin_name', 'herb', 'Pinyin Name');

ensure_storage('field_herb_chinese_name', 'string', 1, ['max_length' => 255]);
ensure_field('field_herb_chinese_name', 'herb', 'Chinese Name');

ensure_storage('field_herb2_id', 'integer', 1);
ensure_field('field_herb2_id', 'herb', 'HERB 2.0 Database ID');

ensure_storage('field_pubchem_cid', 'integer', 1);
ensure_field('field_pubchem_cid', 'herb', 'PubChem Compound ID');

ensure_storage('field_smiles', 'string', 1, ['max_length' => 1024]);
ensure_field('field_smiles', 'herb', 'SMILES Notation');

ensure_storage('field_molecular_weight', 'decimal', 1, ['precision' => 12, 'scale' => 4]);
ensure_field('field_molecular_weight', 'herb', 'Molecular Weight');

ensure_storage('field_herb_source_dbs', 'string', -1, ['max_length' => 255]);
ensure_field('field_herb_source_dbs', 'herb', 'Source Databases');

// ─── 2. Decision-Making Fields ──────────────────────────────────────────────
echo \"\\n--- Decision-Making Fields ---\\n\";

\$list_fields = [
  'field_popularity' => [
    'label'  => 'Popularity',
    'values' => [
      'staple'    => 'Staple',
      'common'    => 'Common',
      'specialty' => 'Specialty',
      'rare'      => 'Rare',
      'obscure'   => 'Obscure',
    ],
  ],
  'field_onset_speed' => [
    'label'  => 'Onset Speed',
    'values' => [
      'fast_acting' => 'Fast Acting',
      'moderate'    => 'Moderate',
      'cumulative'  => 'Cumulative',
    ],
  ],
  'field_cost_tier' => [
    'label'  => 'Cost Tier',
    'values' => [
      'budget'    => 'Budget',
      'moderate'  => 'Moderate',
      'premium'   => 'Premium',
      'expensive' => 'Expensive',
    ],
  ],
  'field_palatability' => [
    'label'  => 'Palatability',
    'values' => [
      'pleasant'    => 'Pleasant',
      'neutral'     => 'Neutral',
      'bitter'      => 'Bitter',
      'very_bitter' => 'Very Bitter',
      'pungent'     => 'Pungent',
    ],
  ],
  'field_availability' => [
    'label'  => 'Availability',
    'values' => [
      'widely_available'  => 'Widely Available',
      'specialty_stores'  => 'Specialty Stores',
      'online_only'       => 'Online Only',
      'hard_to_source'    => 'Hard to Source',
      'practitioner_only' => 'Practitioner Only',
    ],
  ],
  'field_best_season' => [
    'label'  => 'Best Season',
    'values' => [
      'spring'     => 'Spring',
      'summer'     => 'Summer',
      'autumn'     => 'Autumn',
      'winter'     => 'Winter',
      'year_round' => 'Year Round',
    ],
  ],
  'field_evidence_strength' => [
    'label'  => 'Evidence Strength',
    'values' => [
      'strong'           => 'Strong',
      'moderate'         => 'Moderate',
      'preliminary'      => 'Preliminary',
      'traditional_only' => 'Traditional Only',
    ],
  ],
];

foreach (\$list_fields as \$name => \$info) {
  if (!FieldStorageConfig::loadByName('node', \$name)) {
    FieldStorageConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'type'        => 'list_string',
      'cardinality' => 1,
      'settings'    => ['allowed_values' => \$info['values']],
    ])->save();
    echo \"  Created storage: \$name\\n\";
  }
  ensure_field(\$name, 'herb', \$info['label']);
}

// Boolean decision fields
\$booleans = [
  'field_beginner_friendly' => 'Beginner Friendly',
  'field_editors_pick'      => \"Editor's Pick\",
];
foreach (\$booleans as \$name => \$label) {
  if (!FieldStorageConfig::loadByName('node', \$name)) {
    FieldStorageConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'type'        => 'boolean',
      'cardinality' => 1,
    ])->save();
    echo \"  Created storage: \$name\\n\";
  }
  ensure_field(\$name, 'herb', \$label);
}

// pregnancy_safety — may already be created by base herb script
if (!FieldStorageConfig::loadByName('node', 'field_pregnancy_safety')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_pregnancy_safety',
    'entity_type' => 'node',
    'type'        => 'list_string',
    'cardinality' => 1,
    'settings'    => ['allowed_values' => [
      'generally_safe'  => 'Generally Safe',
      'use_caution'     => 'Use Caution',
      'avoid'           => 'Avoid',
      'contraindicated' => 'Contraindicated',
    ]],
  ])->save();
  echo \"  Created storage: field_pregnancy_safety\\n\";
}
ensure_field('field_pregnancy_safety', 'herb', 'Pregnancy Safety');

// ─── 3. Entity Reference Fields ─────────────────────────────────────────────
echo \"\\n--- Entity Reference Fields ---\\n\";

\$entity_refs = [
  'field_related_species'   => 'Related Species',
  'field_substitute_herbs'  => 'Substitute Herbs',
  'field_conditions_treated' => 'Conditions Treated',
];
foreach (\$entity_refs as \$name => \$label) {
  if (!FieldStorageConfig::loadByName('node', \$name)) {
    FieldStorageConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'type'        => 'entity_reference',
      'cardinality' => -1,
      'settings'    => ['target_type' => 'node'],
    ])->save();
    echo \"  Created storage: \$name\\n\";
  }
  \$target = (\$name === 'field_conditions_treated') ? 'condition' : 'herb';
  if (!FieldConfig::loadByName('node', 'herb', \$name)) {
    FieldConfig::create([
      'field_name'  => \$name,
      'entity_type' => 'node',
      'bundle'      => 'herb',
      'label'       => \$label,
      'required'    => FALSE,
      'settings'    => [
        'handler'          => 'default',
        'handler_settings' => [
          'target_bundles' => [\$target => \$target],
        ],
      ],
    ])->save();
    echo \"  Attached to herb: \$name\\n\";
  }
}

// ─── 4. Paragraph Type: Common Names ────────────────────────────────────────
echo \"\\n--- Paragraph: Common Names ---\\n\";

ensure_para_type('common_name', 'Common Name');
ensure_para_storage('field_name_text', 'string', 1, ['max_length' => 255]);
ensure_para_field('field_name_text', 'common_name', 'Name', TRUE);
ensure_para_storage('field_language', 'string', 1, ['max_length' => 64]);
ensure_para_field('field_language', 'common_name', 'Language', TRUE);
ensure_para_storage('field_region', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_region', 'common_name', 'Region');

if (!FieldStorageConfig::loadByName('node', 'field_common_names')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_common_names',
    'entity_type' => 'node',
    'type'        => 'entity_reference_revisions',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'paragraph'],
  ])->save();
  echo \"  Created storage: field_common_names\\n\";
}
if (!FieldConfig::loadByName('node', 'herb', 'field_common_names')) {
  FieldConfig::create([
    'field_name'  => 'field_common_names',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Common Names',
    'required'    => FALSE,
    'settings'    => [
      'handler'          => 'default:paragraph',
      'handler_settings' => ['target_bundles' => ['common_name' => 'common_name']],
    ],
  ])->save();
  echo \"  Attached to herb: field_common_names\\n\";
}

// ─── 5. Paragraph Type: Active Constituents ─────────────────────────────────
echo \"\\n--- Paragraph: Active Constituents ---\\n\";

ensure_para_type('active_constituent', 'Active Constituent');
ensure_para_storage('field_compound_name', 'string', 1, ['max_length' => 255]);
ensure_para_field('field_compound_name', 'active_constituent', 'Compound Name', TRUE);
ensure_para_storage('field_compound_class', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_compound_class', 'active_constituent', 'Compound Class');
ensure_para_storage('field_compound_percentage', 'decimal', 1, ['precision' => 6, 'scale' => 2]);
ensure_para_field('field_compound_percentage', 'active_constituent', 'Percentage');
ensure_para_storage('field_compound_effects', 'text_long', 1);
ensure_para_field('field_compound_effects', 'active_constituent', 'Effects');

if (!FieldStorageConfig::loadByName('node', 'field_active_constituents')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_active_constituents',
    'entity_type' => 'node',
    'type'        => 'entity_reference_revisions',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'paragraph'],
  ])->save();
  echo \"  Created storage: field_active_constituents\\n\";
}
if (!FieldConfig::loadByName('node', 'herb', 'field_active_constituents')) {
  FieldConfig::create([
    'field_name'  => 'field_active_constituents',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Active Constituents',
    'settings'    => [
      'handler'          => 'default:paragraph',
      'handler_settings' => ['target_bundles' => ['active_constituent' => 'active_constituent']],
    ],
  ])->save();
  echo \"  Attached to herb: field_active_constituents\\n\";
}

// ─── 6. Paragraph Type: Recommended Dosage ──────────────────────────────────
echo \"\\n--- Paragraph: Recommended Dosage ---\\n\";

ensure_para_type('recommended_dosage', 'Recommended Dosage');
ensure_para_storage('field_dosage_form', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_dosage_form', 'recommended_dosage', 'Dosage Form', TRUE);
ensure_para_storage('field_dosage_amount', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_dosage_amount', 'recommended_dosage', 'Amount', TRUE);
ensure_para_storage('field_dosage_frequency', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_dosage_frequency', 'recommended_dosage', 'Frequency');
ensure_para_storage('field_dosage_population', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_dosage_population', 'recommended_dosage', 'Population');
ensure_para_storage('field_dosage_notes', 'text_long', 1);
ensure_para_field('field_dosage_notes', 'recommended_dosage', 'Notes');

if (!FieldStorageConfig::loadByName('node', 'field_recommended_dosage')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_recommended_dosage',
    'entity_type' => 'node',
    'type'        => 'entity_reference_revisions',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'paragraph'],
  ])->save();
  echo \"  Created storage: field_recommended_dosage\\n\";
}
if (!FieldConfig::loadByName('node', 'herb', 'field_recommended_dosage')) {
  FieldConfig::create([
    'field_name'  => 'field_recommended_dosage',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Recommended Dosage',
    'settings'    => [
      'handler'          => 'default:paragraph',
      'handler_settings' => ['target_bundles' => ['recommended_dosage' => 'recommended_dosage']],
    ],
  ])->save();
  echo \"  Attached to herb: field_recommended_dosage\\n\";
}

// ─── 7. Paragraph Type: Preparation Methods ─────────────────────────────────
echo \"\\n--- Paragraph: Preparation Methods ---\\n\";

ensure_para_type('preparation_method', 'Preparation Method');
ensure_para_storage('field_method_type', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_method_type', 'preparation_method', 'Method Type', TRUE);
ensure_para_storage('field_method_instructions', 'text_long', 1);
ensure_para_field('field_method_instructions', 'preparation_method', 'Instructions', TRUE);
ensure_para_storage('field_method_time', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_method_time', 'preparation_method', 'Time');

if (!FieldStorageConfig::loadByName('node', 'field_preparation_methods')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_preparation_methods',
    'entity_type' => 'node',
    'type'        => 'entity_reference_revisions',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'paragraph'],
  ])->save();
  echo \"  Created storage: field_preparation_methods\\n\";
}
if (!FieldConfig::loadByName('node', 'herb', 'field_preparation_methods')) {
  FieldConfig::create([
    'field_name'  => 'field_preparation_methods',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Preparation Methods',
    'settings'    => [
      'handler'          => 'default:paragraph',
      'handler_settings' => ['target_bundles' => ['preparation_method' => 'preparation_method']],
    ],
  ])->save();
  echo \"  Attached to herb: field_preparation_methods\\n\";
}

// ─── 8. Toxicity Info (simple fields, not paragraph) ────────────────────────
echo \"\\n--- Toxicity Info ---\\n\";

ensure_storage('field_toxicity_level', 'string', 1, ['max_length' => 64]);
ensure_field('field_toxicity_level', 'herb', 'Toxicity Level');

ensure_storage('field_toxic_compounds', 'text_long', 1);
ensure_field('field_toxic_compounds', 'herb', 'Toxic Compounds');

ensure_storage('field_toxic_symptoms', 'text_long', 1);
ensure_field('field_toxic_symptoms', 'herb', 'Toxicity Symptoms');

// ─── 9. Storage & Sourcing (simple fields) ──────────────────────────────────
echo \"\\n--- Storage & Sourcing ---\\n\";

ensure_storage('field_storage_conditions', 'string', 1, ['max_length' => 255]);
ensure_field('field_storage_conditions', 'herb', 'Storage Conditions');

ensure_storage('field_shelf_life', 'string', 1, ['max_length' => 128]);
ensure_field('field_shelf_life', 'herb', 'Shelf Life');

ensure_storage('field_storage_temperature', 'string', 1, ['max_length' => 64]);
ensure_field('field_storage_temperature', 'herb', 'Storage Temperature');

ensure_storage('field_sourcing_type', 'string', 1, ['max_length' => 128]);
ensure_field('field_sourcing_type', 'herb', 'Sourcing Type');

ensure_storage('field_organic_available', 'boolean', 1);
ensure_field('field_organic_available', 'herb', 'Organic Available');

ensure_storage('field_sustainable_harvest', 'string', 1, ['max_length' => 255]);
ensure_field('field_sustainable_harvest', 'herb', 'Sustainable Harvest');

// ─── 10. Paragraph Type: Regulatory Status ──────────────────────────────────
echo \"\\n--- Paragraph: Regulatory Status ---\\n\";

ensure_para_type('regulatory_status', 'Regulatory Status');
ensure_para_storage('field_reg_country', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_reg_country', 'regulatory_status', 'Country', TRUE);
ensure_para_storage('field_reg_status', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_reg_status', 'regulatory_status', 'Status', TRUE);
ensure_para_storage('field_reg_notes', 'text_long', 1);
ensure_para_field('field_reg_notes', 'regulatory_status', 'Notes');

if (!FieldStorageConfig::loadByName('node', 'field_regulatory_status')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_regulatory_status',
    'entity_type' => 'node',
    'type'        => 'entity_reference_revisions',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'paragraph'],
  ])->save();
  echo \"  Created storage: field_regulatory_status\\n\";
}
if (!FieldConfig::loadByName('node', 'herb', 'field_regulatory_status')) {
  FieldConfig::create([
    'field_name'  => 'field_regulatory_status',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Regulatory Status',
    'settings'    => [
      'handler'          => 'default:paragraph',
      'handler_settings' => ['target_bundles' => ['regulatory_status' => 'regulatory_status']],
    ],
  ])->save();
  echo \"  Attached to herb: field_regulatory_status\\n\";
}

// ─── 11. Paragraph Type: Quality Standards ──────────────────────────────────
echo \"\\n--- Paragraph: Quality Standards ---\\n\";

ensure_para_type('quality_standard', 'Quality Standard');
ensure_para_storage('field_standard_org', 'string', 1, ['max_length' => 255]);
ensure_para_field('field_standard_org', 'quality_standard', 'Organization', TRUE);
ensure_para_storage('field_standard_specs', 'text_long', 1);
ensure_para_field('field_standard_specs', 'quality_standard', 'Specifications', TRUE);

if (!FieldStorageConfig::loadByName('node', 'field_quality_standards')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_quality_standards',
    'entity_type' => 'node',
    'type'        => 'entity_reference_revisions',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'paragraph'],
  ])->save();
  echo \"  Created storage: field_quality_standards\\n\";
}
if (!FieldConfig::loadByName('node', 'herb', 'field_quality_standards')) {
  FieldConfig::create([
    'field_name'  => 'field_quality_standards',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Quality Standards',
    'settings'    => [
      'handler'          => 'default:paragraph',
      'handler_settings' => ['target_bundles' => ['quality_standard' => 'quality_standard']],
    ],
  ])->save();
  echo \"  Attached to herb: field_quality_standards\\n\";
}

// ─── 12. Paragraph Type: Adulteration Risks ─────────────────────────────────
echo \"\\n--- Paragraph: Adulteration Risks ---\\n\";

ensure_para_type('adulteration_risk', 'Adulteration Risk');
ensure_para_storage('field_adulterant_name', 'string', 1, ['max_length' => 255]);
ensure_para_field('field_adulterant_name', 'adulteration_risk', 'Adulterant Name', TRUE);
ensure_para_storage('field_risks', 'text_long', 1);
ensure_para_field('field_risks', 'adulteration_risk', 'Risks', TRUE);

if (!FieldStorageConfig::loadByName('node', 'field_adulteration_risks')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_adulteration_risks',
    'entity_type' => 'node',
    'type'        => 'entity_reference_revisions',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'paragraph'],
  ])->save();
  echo \"  Created storage: field_adulteration_risks\\n\";
}
if (!FieldConfig::loadByName('node', 'herb', 'field_adulteration_risks')) {
  FieldConfig::create([
    'field_name'  => 'field_adulteration_risks',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Adulteration Risks',
    'settings'    => [
      'handler'          => 'default:paragraph',
      'handler_settings' => ['target_bundles' => ['adulteration_risk' => 'adulteration_risk']],
    ],
  ])->save();
  echo \"  Attached to herb: field_adulteration_risks\\n\";
}

// ─── 13. Paragraph Type: Safety Warnings ────────────────────────────────────
echo \"\\n--- Paragraph: Safety Warnings ---\\n\";

ensure_para_type('safety_warning', 'Safety Warning');
ensure_para_storage('field_warning_type', 'string', 1, ['max_length' => 128]);
ensure_para_field('field_warning_type', 'safety_warning', 'Warning Type', TRUE);
ensure_para_storage('field_warning_severity', 'string', 1, ['max_length' => 64]);
ensure_para_field('field_warning_severity', 'safety_warning', 'Severity', TRUE);
ensure_para_storage('field_warning_description', 'text_long', 1);
ensure_para_field('field_warning_description', 'safety_warning', 'Description', TRUE);

if (!FieldStorageConfig::loadByName('node', 'field_safety_warnings')) {
  FieldStorageConfig::create([
    'field_name'  => 'field_safety_warnings',
    'entity_type' => 'node',
    'type'        => 'entity_reference_revisions',
    'cardinality' => -1,
    'settings'    => ['target_type' => 'paragraph'],
  ])->save();
  echo \"  Created storage: field_safety_warnings\\n\";
}
if (!FieldConfig::loadByName('node', 'herb', 'field_safety_warnings')) {
  FieldConfig::create([
    'field_name'  => 'field_safety_warnings',
    'entity_type' => 'node',
    'bundle'      => 'herb',
    'label'       => 'Safety Warnings',
    'settings'    => [
      'handler'          => 'default:paragraph',
      'handler_settings' => ['target_bundles' => ['safety_warning' => 'safety_warning']],
    ],
  ])->save();
  echo \"  Attached to herb: field_safety_warnings\\n\";
}

echo \"\\nAll missing herb fields checked/created.\\n\";
"

"$DRUSH" cache:rebuild
echo "=== Missing herb fields setup complete ==="
