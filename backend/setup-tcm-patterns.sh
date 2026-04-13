#!/usr/bin/env bash
# setup-tcm-patterns.sh
# Creates the TCM Pattern content type, Organ System taxonomy, all fields,
# and configures JSON:API for the frontend.
#
# Usage (from project root):
#   docker compose exec drupal bash /var/www/html/setup-tcm-patterns.sh
#
# Prerequisites: Drupal is running with Drush available.

set -euo pipefail
cd "$(dirname "$0")"

DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Verscienta: TCM Patterns Setup ==="
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 1. Organ System taxonomy vocabulary
# ─────────────────────────────────────────────────────────────────────────────
echo "[1/6] Creating 'organ_system' taxonomy vocabulary..."

"$DRUSH" php:eval "
  use Drupal\taxonomy\Entity\Vocabulary;
  if (!Vocabulary::load('organ_system')) {
    Vocabulary::create([
      'vid'         => 'organ_system',
      'name'        => 'Organ System',
      'description' => 'TCM organ systems (Spleen, Liver, Heart, etc.)',
    ])->save();
    echo 'Created organ_system vocabulary.' . PHP_EOL;
  } else {
    echo 'Organ System vocabulary already exists.' . PHP_EOL;
  }
"

# Seed the 14 organ systems
"$DRUSH" php:eval "
  use Drupal\taxonomy\Entity\Term;
  \$organs = [
    'Spleen', 'Liver', 'Heart', 'Kidney', 'Lung', 'Pericardium',
    'Triple Burner', 'Gallbladder', 'Large Intestine', 'Small Intestine',
    'Bladder', 'Stomach', 'Governing Vessel', 'Conception Vessel',
  ];
  foreach (\$organs as \$name) {
    \$existing = \Drupal::entityTypeManager()
      ->getStorage('taxonomy_term')
      ->loadByProperties(['name' => \$name, 'vid' => 'organ_system']);
    if (empty(\$existing)) {
      Term::create(['vid' => 'organ_system', 'name' => \$name])->save();
      echo 'Created term: ' . \$name . PHP_EOL;
    } else {
      echo 'Term already exists: ' . \$name . PHP_EOL;
    }
  }
"

# ─────────────────────────────────────────────────────────────────────────────
# 2. TCM Pattern content type
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[2/6] Creating 'tcm_pattern' content type..."

"$DRUSH" php:eval "
  use Drupal\node\Entity\NodeType;
  if (!NodeType::load('tcm_pattern')) {
    NodeType::create([
      'type'               => 'tcm_pattern',
      'name'               => 'TCM Pattern',
      'description'        => 'A TCM syndrome / pattern differentiation with etiology, signs, and treatment principle.',
      'help'               => '',
      'new_revision'       => TRUE,
      'preview_mode'       => 1,
      'display_submitted'  => FALSE,
    ])->save();
    echo 'Created tcm_pattern content type.' . PHP_EOL;
  } else {
    echo 'tcm_pattern content type already exists.' . PHP_EOL;
  }
"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Fields — Identity (string)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[3/6] Adding identity and classification fields..."

"$DRUSH" php:eval "
  use Drupal\field\Entity\FieldStorageConfig;
  use Drupal\field\Entity\FieldConfig;

  \$text_fields = [
    'field_pattern_name_chinese' => 'Chinese Name',
    'field_pattern_name_pinyin'  => 'Pinyin Name',
  ];
  foreach (\$text_fields as \$field_name => \$label) {
    if (!FieldStorageConfig::loadByName('node', \$field_name)) {
      FieldStorageConfig::create([
        'field_name'  => \$field_name,
        'entity_type' => 'node',
        'type'        => 'string',
        'settings'    => ['max_length' => 255],
      ])->save();
    }
    if (!FieldConfig::loadByName('node', 'tcm_pattern', \$field_name)) {
      FieldConfig::create([
        'field_name'  => \$field_name,
        'entity_type' => 'node',
        'bundle'      => 'tcm_pattern',
        'label'       => \$label,
        'required'    => FALSE,
      ])->save();
      echo 'Created field: ' . \$field_name . PHP_EOL;
    }
  }
"

# Organ system entity reference (single)
"$DRUSH" php:eval "
  use Drupal\field\Entity\FieldStorageConfig;
  use Drupal\field\Entity\FieldConfig;

  if (!FieldStorageConfig::loadByName('node', 'field_organ_system')) {
    FieldStorageConfig::create([
      'field_name'  => 'field_organ_system',
      'entity_type' => 'node',
      'type'        => 'entity_reference',
      'settings'    => ['target_type' => 'taxonomy_term'],
    ])->save();
  }
  if (!FieldConfig::loadByName('node', 'tcm_pattern', 'field_organ_system')) {
    FieldConfig::create([
      'field_name'  => 'field_organ_system',
      'entity_type' => 'node',
      'bundle'      => 'tcm_pattern',
      'label'       => 'Organ System',
      'settings'    => [
        'handler' => 'default:taxonomy_term',
        'handler_settings' => [
          'target_bundles' => ['organ_system' => 'organ_system'],
          'auto_create'    => FALSE,
        ],
      ],
    ])->save();
    echo 'Created field: field_organ_system' . PHP_EOL;
  }
"

# List fields: category, temperature, popularity
"$DRUSH" php:eval "
  use Drupal\field\Entity\FieldStorageConfig;
  use Drupal\field\Entity\FieldConfig;

  \$list_fields = [
    'field_pattern_category' => [
      'label' => 'Pattern Category',
      'allowed_values' => [
        ['value' => 'deficiency', 'label' => 'Deficiency'],
        ['value' => 'excess',     'label' => 'Excess'],
        ['value' => 'mixed',      'label' => 'Mixed'],
      ],
    ],
    'field_temperature' => [
      'label' => 'Temperature Quality',
      'allowed_values' => [
        ['value' => 'cold',    'label' => 'Cold'],
        ['value' => 'heat',    'label' => 'Heat'],
        ['value' => 'neutral', 'label' => 'Neutral'],
      ],
    ],
    'field_popularity' => [
      'label' => 'Popularity',
      'allowed_values' => [
        ['value' => 'staple',    'label' => 'Staple'],
        ['value' => 'common',    'label' => 'Common'],
        ['value' => 'specialty', 'label' => 'Specialty'],
        ['value' => 'rare',      'label' => 'Rare'],
      ],
    ],
  ];

  foreach (\$list_fields as \$fname => \$cfg) {
    if (!FieldStorageConfig::loadByName('node', \$fname)) {
      FieldStorageConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'type'        => 'list_string',
        'settings'    => ['allowed_values' => \$cfg['allowed_values']],
      ])->save();
    }
    if (!FieldConfig::loadByName('node', 'tcm_pattern', \$fname)) {
      FieldConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'bundle'      => 'tcm_pattern',
        'label'       => \$cfg['label'],
      ])->save();
      echo 'Created field: ' . \$fname . PHP_EOL;
    }
  }

  // Boolean: editors_pick
  if (!FieldStorageConfig::loadByName('node', 'field_editors_pick')) {
    FieldStorageConfig::create([
      'field_name'  => 'field_editors_pick',
      'entity_type' => 'node',
      'type'        => 'boolean',
    ])->save();
  }
  if (!FieldConfig::loadByName('node', 'tcm_pattern', 'field_editors_pick')) {
    FieldConfig::create([
      'field_name'  => 'field_editors_pick',
      'entity_type' => 'node',
      'bundle'      => 'tcm_pattern',
      'label'       => \"Editor's Pick\",
    ])->save();
    echo 'Created field: field_editors_pick' . PHP_EOL;
  }
"

# ─────────────────────────────────────────────────────────────────────────────
# 4. Fields — Clinical (rich text long)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[4/6] Adding clinical text fields..."

"$DRUSH" php:eval "
  use Drupal\field\Entity\FieldStorageConfig;
  use Drupal\field\Entity\FieldConfig;

  \$rich_fields = [
    'field_etiology'               => 'Etiology',
    'field_pathomechanism'         => 'Pathomechanism',
    'field_signs_symptoms'         => 'Signs & Symptoms',
    'field_tongue_criteria'        => 'Tongue Criteria',
    'field_pulse_criteria'         => 'Pulse Criteria',
    'field_treatment_principle'    => 'Treatment Principle',
    'field_differential_diagnosis' => 'Differential Diagnosis',
  ];

  foreach (\$rich_fields as \$fname => \$label) {
    if (!FieldStorageConfig::loadByName('node', \$fname)) {
      FieldStorageConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'type'        => 'text_long',
      ])->save();
    }
    if (!FieldConfig::loadByName('node', 'tcm_pattern', \$fname)) {
      FieldConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'bundle'      => 'tcm_pattern',
        'label'       => \$label,
      ])->save();
      echo 'Created field: ' . \$fname . PHP_EOL;
    }
  }
"

# ─────────────────────────────────────────────────────────────────────────────
# 5. Fields — Cross-references (multi-value entity refs)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[5/6] Adding cross-reference fields..."

"$DRUSH" php:eval "
  use Drupal\field\Entity\FieldStorageConfig;
  use Drupal\field\Entity\FieldConfig;

  \$refs = [
    'field_related_conditions' => ['target_bundles' => ['condition'       => 'condition'],        'label' => 'Related Conditions'],
    'field_related_herbs'      => ['target_bundles' => ['herb'            => 'herb'],             'label' => 'Related Herbs'],
    'field_related_formulas'   => ['target_bundles' => ['formula'         => 'formula'],          'label' => 'Related Formulas'],
    'field_related_points'     => ['target_bundles' => ['acupuncture_point' => 'acupuncture_point'], 'label' => 'Related Points'],
  ];

  foreach (\$refs as \$fname => \$cfg) {
    if (!FieldStorageConfig::loadByName('node', \$fname)) {
      FieldStorageConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'type'        => 'entity_reference',
        'cardinality' => -1,
        'settings'    => ['target_type' => 'node'],
      ])->save();
    }
    if (!FieldConfig::loadByName('node', 'tcm_pattern', \$fname)) {
      FieldConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'bundle'      => 'tcm_pattern',
        'label'       => \$cfg['label'],
        'settings'    => [
          'handler' => 'default:node',
          'handler_settings' => [
            'target_bundles' => \$cfg['target_bundles'],
            'auto_create'    => FALSE,
          ],
        ],
      ])->save();
      echo 'Created field: ' . \$fname . PHP_EOL;
    }
  }
"

# ─────────────────────────────────────────────────────────────────────────────
# 6. JSON:API configuration + cache rebuild
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[6/6] Enabling JSON:API for tcm_pattern and organ_system..."

"$DRUSH" php:eval "
  if (\Drupal::moduleHandler()->moduleExists('jsonapi_extras')) {
    \$config_factory = \Drupal::configFactory();

    foreach ([
      'node--tcm_pattern'           => 'node--tcm_pattern',
      'taxonomy_term--organ_system' => 'taxonomy_term--organ_system',
    ] as \$id => \$resourceType) {
      \$config = \$config_factory->getEditable('jsonapi_extras.jsonapi_resource_config.' . \$id);
      if (\$config->isNew()) {
        \$config
          ->set('id', \$id)
          ->set('resourceType', \$resourceType)
          ->set('resourceFields', [])
          ->set('disabled', FALSE)
          ->save();
        echo 'Enabled JSON:API for ' . \$id . ' (jsonapi_extras).' . PHP_EOL;
      } else {
        if (\$config->get('disabled') === TRUE) {
          \$config->set('disabled', FALSE)->save();
          echo 'Re-enabled JSON:API for ' . \$id . '.' . PHP_EOL;
        } else {
          echo 'JSON:API for ' . \$id . ' already configured.' . PHP_EOL;
        }
      }
    }
  } else {
    echo 'Core JSON:API is active — no extra configuration needed.' . PHP_EOL;
  }
"

"$DRUSH" cache:rebuild

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Visit /admin/content to create your first TCM pattern"
echo "  2. Test the JSON:API endpoint: /jsonapi/node/tcm_pattern"
echo "  3. Test the frontend at: http://localhost:3000/patterns"
echo ""
