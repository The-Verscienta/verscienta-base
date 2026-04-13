#!/usr/bin/env bash
# setup-acupuncture-points.sh
# Creates the Acupuncture Point content type, Meridian taxonomy, all fields,
# and configures JSON:API for the frontend.
#
# Usage (from project root):
#   docker compose exec drupal bash /var/www/html/setup-acupuncture-points.sh
#
# Prerequisites: Drupal is running with Drush available.

set -euo pipefail
cd "$(dirname "$0")"

DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Verscienta: Acupuncture Points Setup ==="
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 1. Meridian taxonomy vocabulary
# ─────────────────────────────────────────────────────────────────────────────
echo "[1/6] Creating 'meridian' taxonomy vocabulary..."

"$DRUSH" php:eval "
  use Drupal\taxonomy\Entity\Vocabulary;
  if (!Vocabulary::load('meridian')) {
    Vocabulary::create([
      'vid'         => 'meridian',
      'name'        => 'Meridian',
      'description' => 'TCM meridian channels (Lung, Heart, etc.)',
    ])->save();
    echo 'Created meridian vocabulary.' . PHP_EOL;
  } else {
    echo 'Meridian vocabulary already exists.' . PHP_EOL;
  }
"

# Seed the 15 standard meridians
"$DRUSH" php:eval "
  use Drupal\taxonomy\Entity\Term;
  \$meridians = [
    'Lung', 'Large Intestine', 'Stomach', 'Spleen',
    'Heart', 'Small Intestine', 'Bladder', 'Kidney',
    'Pericardium', 'Triple Burner', 'Gallbladder', 'Liver',
    'Governing Vessel', 'Conception Vessel', 'Extra Points',
  ];
  foreach (\$meridians as \$name) {
    \$existing = \Drupal::entityTypeManager()
      ->getStorage('taxonomy_term')
      ->loadByProperties(['name' => \$name, 'vid' => 'meridian']);
    if (empty(\$existing)) {
      Term::create(['vid' => 'meridian', 'name' => \$name])->save();
      echo 'Created term: ' . \$name . PHP_EOL;
    } else {
      echo 'Term already exists: ' . \$name . PHP_EOL;
    }
  }
"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Acupuncture Point content type
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[2/6] Creating 'acupuncture_point' content type..."

"$DRUSH" php:eval "
  use Drupal\node\Entity\NodeType;
  if (!NodeType::load('acupuncture_point')) {
    NodeType::create([
      'type'        => 'acupuncture_point',
      'name'        => 'Acupuncture Point',
      'description' => 'A classical acupuncture point with location, needling, and clinical data.',
      'help'        => '',
      'new_revision'       => TRUE,
      'preview_mode'       => 1,
      'display_submitted'  => FALSE,
    ])->save();
    echo 'Created acupuncture_point content type.' . PHP_EOL;
  } else {
    echo 'acupuncture_point content type already exists.' . PHP_EOL;
  }
"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Fields — Identity & Classification
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[3/6] Adding identity and classification fields..."

"$DRUSH" php:eval "
  use Drupal\field\Entity\FieldStorageConfig;
  use Drupal\field\Entity\FieldConfig;

  \$text_fields = [
    'field_point_code'         => ['label' => 'Point Code',         'description' => 'e.g. LU-7, ST-36'],
    'field_point_chinese_name' => ['label' => 'Chinese Name',        'description' => 'Chinese characters'],
    'field_point_pinyin_name'  => ['label' => 'Pinyin Name',         'description' => 'Romanized pronunciation'],
  ];

  foreach (\$text_fields as \$field_name => \$config) {
    if (!FieldStorageConfig::loadByName('node', \$field_name)) {
      FieldStorageConfig::create([
        'field_name'  => \$field_name,
        'entity_type' => 'node',
        'type'        => 'string',
        'settings'    => ['max_length' => 255],
      ])->save();
    }
    if (!FieldConfig::loadByName('node', 'acupuncture_point', \$field_name)) {
      FieldConfig::create([
        'field_name'  => \$field_name,
        'entity_type' => 'node',
        'bundle'      => 'acupuncture_point',
        'label'       => \$config['label'],
        'description' => \$config['description'],
        'required'    => FALSE,
      ])->save();
      echo 'Created field: ' . \$field_name . PHP_EOL;
    }
  }
"

# Meridian entity reference
"$DRUSH" php:eval "
  use Drupal\field\Entity\FieldStorageConfig;
  use Drupal\field\Entity\FieldConfig;

  if (!FieldStorageConfig::loadByName('node', 'field_meridian')) {
    FieldStorageConfig::create([
      'field_name'  => 'field_meridian',
      'entity_type' => 'node',
      'type'        => 'entity_reference',
      'settings'    => ['target_type' => 'taxonomy_term'],
    ])->save();
  }
  if (!FieldConfig::loadByName('node', 'acupuncture_point', 'field_meridian')) {
    FieldConfig::create([
      'field_name'  => 'field_meridian',
      'entity_type' => 'node',
      'bundle'      => 'acupuncture_point',
      'label'       => 'Meridian',
      'settings'    => [
        'handler' => 'default:taxonomy_term',
        'handler_settings' => [
          'target_bundles' => ['meridian' => 'meridian'],
          'auto_create'    => FALSE,
        ],
      ],
    ])->save();
    echo 'Created field: field_meridian' . PHP_EOL;
  }
"

# Meridian number (integer)
"$DRUSH" php:eval "
  use Drupal\field\Entity\FieldStorageConfig;
  use Drupal\field\Entity\FieldConfig;

  if (!FieldStorageConfig::loadByName('node', 'field_meridian_number')) {
    FieldStorageConfig::create([
      'field_name'  => 'field_meridian_number',
      'entity_type' => 'node',
      'type'        => 'integer',
      'settings'    => ['unsigned' => TRUE, 'size' => 'normal'],
    ])->save();
  }
  if (!FieldConfig::loadByName('node', 'acupuncture_point', 'field_meridian_number')) {
    FieldConfig::create([
      'field_name'  => 'field_meridian_number',
      'entity_type' => 'node',
      'bundle'      => 'acupuncture_point',
      'label'       => 'Meridian Number',
      'description' => 'Sequential point number within its meridian',
    ])->save();
    echo 'Created field: field_meridian_number' . PHP_EOL;
  }
"

# ─────────────────────────────────────────────────────────────────────────────
# 4. Fields — Location & Needling
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[4/6] Adding location and needling fields..."

"$DRUSH" php:eval "
  use Drupal\field\Entity\FieldStorageConfig;
  use Drupal\field\Entity\FieldConfig;

  // Location text fields
  \$location_fields = [
    'field_location_description' => 'Location Description',
    'field_location_anatomical'  => 'Anatomical Location',
    'field_needling_depth'       => 'Needling Depth',
    'field_needling_method'      => 'Needling Method',
  ];
  foreach (\$location_fields as \$fname => \$label) {
    if (!FieldStorageConfig::loadByName('node', \$fname)) {
      FieldStorageConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'type'        => 'string',
        'settings'    => ['max_length' => 512],
      ])->save();
    }
    if (!FieldConfig::loadByName('node', 'acupuncture_point', \$fname)) {
      FieldConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'bundle'      => 'acupuncture_point',
        'label'       => \$label,
      ])->save();
      echo 'Created field: ' . \$fname . PHP_EOL;
    }
  }

  // Needling angle (list_string)
  if (!FieldStorageConfig::loadByName('node', 'field_needling_angle')) {
    FieldStorageConfig::create([
      'field_name'  => 'field_needling_angle',
      'entity_type' => 'node',
      'type'        => 'list_string',
      'settings'    => [
        'allowed_values' => [
          ['value' => 'perpendicular', 'label' => 'Perpendicular (90°)'],
          ['value' => 'oblique',       'label' => 'Oblique (45°)'],
          ['value' => 'transverse',    'label' => 'Transverse / Subcutaneous (15°)'],
        ],
      ],
    ])->save();
  }
  if (!FieldConfig::loadByName('node', 'acupuncture_point', 'field_needling_angle')) {
    FieldConfig::create([
      'field_name'  => 'field_needling_angle',
      'entity_type' => 'node',
      'bundle'      => 'acupuncture_point',
      'label'       => 'Needling Angle',
    ])->save();
    echo 'Created field: field_needling_angle' . PHP_EOL;
  }

  // Boolean fields: moxa_suitable, press_needle_suitable
  foreach (['field_moxa_suitable' => 'Moxibustion Suitable', 'field_press_needle_suitable' => 'Press Needle Suitable'] as \$fname => \$label) {
    if (!FieldStorageConfig::loadByName('node', \$fname)) {
      FieldStorageConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'type'        => 'boolean',
        'settings'    => ['on_label' => 'Yes', 'off_label' => 'No'],
      ])->save();
    }
    if (!FieldConfig::loadByName('node', 'acupuncture_point', \$fname)) {
      FieldConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'bundle'      => 'acupuncture_point',
        'label'       => \$label,
      ])->save();
      echo 'Created field: ' . \$fname . PHP_EOL;
    }
  }

  // Moxa cones (integer)
  if (!FieldStorageConfig::loadByName('node', 'field_moxa_cones')) {
    FieldStorageConfig::create([
      'field_name'  => 'field_moxa_cones',
      'entity_type' => 'node',
      'type'        => 'integer',
      'settings'    => ['unsigned' => TRUE, 'size' => 'normal'],
    ])->save();
  }
  if (!FieldConfig::loadByName('node', 'acupuncture_point', 'field_moxa_cones')) {
    FieldConfig::create([
      'field_name'  => 'field_moxa_cones',
      'entity_type' => 'node',
      'bundle'      => 'acupuncture_point',
      'label'       => 'Moxa Cones',
      'description' => 'Number of moxa cones recommended',
    ])->save();
    echo 'Created field: field_moxa_cones' . PHP_EOL;
  }
"

# ─────────────────────────────────────────────────────────────────────────────
# 5. Fields — Clinical Data (formatted text + special properties)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[5/6] Adding clinical data fields..."

"$DRUSH" php:eval "
  use Drupal\field\Entity\FieldStorageConfig;
  use Drupal\field\Entity\FieldConfig;

  // Rich-text long fields
  \$rich_fields = [
    'field_actions'          => 'TCM Actions',
    'field_indications'      => 'Indications',
    'field_contraindications'=> 'Contraindications',
    'field_classical_notes'  => 'Classical References',
    'field_clinical_notes'   => 'Clinical Notes',
    'field_combinations'     => 'Common Combinations',
  ];
  foreach (\$rich_fields as \$fname => \$label) {
    if (!FieldStorageConfig::loadByName('node', \$fname)) {
      FieldStorageConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'type'        => 'text_long',
      ])->save();
    }
    if (!FieldConfig::loadByName('node', 'acupuncture_point', \$fname)) {
      FieldConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'bundle'      => 'acupuncture_point',
        'label'       => \$label,
      ])->save();
      echo 'Created field: ' . \$fname . PHP_EOL;
    }
  }

  // Special properties (multi-value list_string)
  if (!FieldStorageConfig::loadByName('node', 'field_special_properties')) {
    FieldStorageConfig::create([
      'field_name'   => 'field_special_properties',
      'entity_type'  => 'node',
      'type'         => 'list_string',
      'cardinality'  => -1,
      'settings'     => [
        'allowed_values' => [
          ['value' => 'yuan_source',       'label' => 'Yuan-Source Point'],
          ['value' => 'luo_connecting',    'label' => 'Luo-Connecting Point'],
          ['value' => 'xi_cleft',          'label' => 'Xi-Cleft Point'],
          ['value' => 'command_point',     'label' => 'Command Point'],
          ['value' => 'influential_point', 'label' => 'Influential Point'],
          ['value' => 'five_element_wood', 'label' => 'Five Element: Wood'],
          ['value' => 'five_element_fire', 'label' => 'Five Element: Fire'],
          ['value' => 'five_element_earth','label' => 'Five Element: Earth'],
          ['value' => 'five_element_metal','label' => 'Five Element: Metal'],
          ['value' => 'five_element_water','label' => 'Five Element: Water'],
          ['value' => 'confluent_point',   'label' => 'Confluent Point (Eight Extraordinary)'],
          ['value' => 'alarm_mu',          'label' => 'Front-Mu / Alarm Point'],
          ['value' => 'back_shu',          'label' => 'Back-Shu / Transport Point'],
          ['value' => 'window_of_sky',     'label' => 'Window of the Sky'],
          ['value' => 'sea_of_blood',      'label' => 'Sea of Blood'],
          ['value' => 'lower_sea',         'label' => 'Lower Sea Point'],
        ],
      ],
    ])->save();
  }
  if (!FieldConfig::loadByName('node', 'acupuncture_point', 'field_special_properties')) {
    FieldConfig::create([
      'field_name'  => 'field_special_properties',
      'entity_type' => 'node',
      'bundle'      => 'acupuncture_point',
      'label'       => 'Special Properties / Point Categories',
    ])->save();
    echo 'Created field: field_special_properties' . PHP_EOL;
  }

  // Popularity (list_string)
  if (!FieldStorageConfig::loadByName('node', 'field_popularity')) {
    FieldStorageConfig::create([
      'field_name'  => 'field_popularity',
      'entity_type' => 'node',
      'type'        => 'list_string',
      'settings'    => [
        'allowed_values' => [
          ['value' => 'staple',    'label' => 'Staple Point'],
          ['value' => 'common',    'label' => 'Common'],
          ['value' => 'specialty', 'label' => 'Specialty'],
          ['value' => 'rare',      'label' => 'Rare'],
        ],
      ],
    ])->save();
  }
  if (!FieldConfig::loadByName('node', 'acupuncture_point', 'field_popularity')) {
    FieldConfig::create([
      'field_name'  => 'field_popularity',
      'entity_type' => 'node',
      'bundle'      => 'acupuncture_point',
      'label'       => 'Popularity',
    ])->save();
    echo 'Created field: field_popularity' . PHP_EOL;
  }

  // Boolean flags
  foreach ([
    'field_editors_pick'     => 'Essential / Editor\'s Pick',
    'field_beginner_friendly'=> 'Beginner Friendly',
  ] as \$fname => \$label) {
    if (!FieldStorageConfig::loadByName('node', \$fname)) {
      FieldStorageConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'type'        => 'boolean',
      ])->save();
    }
    if (!FieldConfig::loadByName('node', 'acupuncture_point', \$fname)) {
      FieldConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'bundle'      => 'acupuncture_point',
        'label'       => \$label,
      ])->save();
      echo 'Created field: ' . \$fname . PHP_EOL;
    }
  }

  // Five Element classification
  if (!FieldStorageConfig::loadByName('node', 'field_five_element')) {
    FieldStorageConfig::create([
      'field_name'  => 'field_five_element',
      'entity_type' => 'node',
      'type'        => 'list_string',
      'cardinality' => 1,
      'settings'    => [
        'allowed_values' => [
          'wood'  => 'Wood',
          'fire'  => 'Fire',
          'earth' => 'Earth',
          'metal' => 'Metal',
          'water' => 'Water',
        ],
      ],
    ])->save();
  }
  if (!FieldConfig::loadByName('node', 'acupuncture_point', 'field_five_element')) {
    FieldConfig::create([
      'field_name'  => 'field_five_element',
      'entity_type' => 'node',
      'bundle'      => 'acupuncture_point',
      'label'       => 'Five Element',
    ])->save();
    echo 'Created field: field_five_element' . PHP_EOL;
  }

  // Cross-reference entity references (multi-value)
  \$refs = [
    'field_related_conditions' => ['target_type' => 'node', 'target_bundles' => ['condition' => 'condition'], 'label' => 'Related Conditions'],
    'field_related_herbs'      => ['target_type' => 'node', 'target_bundles' => ['herb' => 'herb'],           'label' => 'Related Herbs'],
    'field_related_formulas'   => ['target_type' => 'node', 'target_bundles' => ['formula' => 'formula'],     'label' => 'Related Formulas'],
  ];
  foreach (\$refs as \$fname => \$cfg) {
    if (!FieldStorageConfig::loadByName('node', \$fname)) {
      FieldStorageConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'type'        => 'entity_reference',
        'cardinality' => -1,
        'settings'    => ['target_type' => \$cfg['target_type']],
      ])->save();
    }
    if (!FieldConfig::loadByName('node', 'acupuncture_point', \$fname)) {
      FieldConfig::create([
        'field_name'  => \$fname,
        'entity_type' => 'node',
        'bundle'      => 'acupuncture_point',
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
# 6. JSON:API configuration
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "[6/6] Enabling JSON:API for acupuncture_point and meridian..."

"$DRUSH" php:eval "
  // Ensure json_api_extras or core json:api is exposing the new type.
  // Core JSON:API auto-exposes all entity types by default.
  // If using jsonapi_extras, we need to enable the resource type.
  if (\Drupal::moduleHandler()->moduleExists('jsonapi_extras')) {
    \$config_factory = \Drupal::configFactory();
    \$resource_config_id = 'jsonapi_extras.jsonapi_resource_config.node--acupuncture_point';
    \$config = \$config_factory->getEditable(\$resource_config_id);
    if (\$config->isNew()) {
      \$config
        ->set('id', 'node--acupuncture_point')
        ->set('resourceType', 'node--acupuncture_point')
        ->set('resourceFields', [])
        ->set('disabled', FALSE)
        ->save();
      echo 'Enabled JSON:API for node--acupuncture_point (jsonapi_extras).' . PHP_EOL;
    } else {
      // Make sure it is not disabled
      if (\$config->get('disabled') === TRUE) {
        \$config->set('disabled', FALSE)->save();
        echo 'Re-enabled JSON:API for node--acupuncture_point.' . PHP_EOL;
      } else {
        echo 'JSON:API for node--acupuncture_point already configured.' . PHP_EOL;
      }
    }

    // Meridian taxonomy term
    \$tax_config_id = 'jsonapi_extras.jsonapi_resource_config.taxonomy_term--meridian';
    \$tax_config = \$config_factory->getEditable(\$tax_config_id);
    if (\$tax_config->isNew()) {
      \$tax_config
        ->set('id', 'taxonomy_term--meridian')
        ->set('resourceType', 'taxonomy_term--meridian')
        ->set('resourceFields', [])
        ->set('disabled', FALSE)
        ->save();
      echo 'Enabled JSON:API for taxonomy_term--meridian.' . PHP_EOL;
    }
  } else {
    echo 'Core JSON:API is active — no extra configuration needed.' . PHP_EOL;
  }
"

# Rebuild caches so new content type and fields are recognised
"$DRUSH" cache:rebuild

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Visit /admin/content to create your first acupuncture point"
echo "  2. Test the JSON:API endpoint: /jsonapi/node/acupuncture_point"
echo "  3. Test the frontend at: http://localhost:3000/points"
echo ""
