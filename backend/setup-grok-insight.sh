#!/usr/bin/env bash
# Verscienta Health — Grok Insight content type setup. Idempotent.
# Run: ddev exec bash setup-grok-insight.sh (from backend/)
set -euo pipefail

cd "$(dirname "$0")"
DRUSH="${DRUSH:-vendor/bin/drush}"

echo "=== Setting up Grok Insight content type ==="

"$DRUSH" php:eval "
use Drupal\node\Entity\NodeType;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// --- Content type ---
if (!NodeType::load('grok_insight')) {
  NodeType::create([
    'type'        => 'grok_insight',
    'name'        => 'Grok Insight',
    'description' => 'AI-generated insight from Grok analysis.',
  ])->save();
  echo 'Created content type: grok_insight' . PHP_EOL;
} else {
  echo 'Content type grok_insight already exists.' . PHP_EOL;
}

// --- field_analysis (text_long) ---
\$name = 'field_analysis';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'text_long',
    'cardinality' => 1,
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'grok_insight', \$name)) {
  FieldConfig::create([
    'field_name'   => \$name,
    'entity_type'  => 'node',
    'bundle'       => 'grok_insight',
    'label'        => 'Analysis',
    'description'  => 'JSON-encoded analysis with symptoms, recommendations, etc.',
    'required'     => FALSE,
  ])->save();
  echo \"Attached to grok_insight: \$name\" . PHP_EOL;
}

// --- field_follow_up_questions (string, multi-value) ---
\$name = 'field_follow_up_questions';
if (!FieldStorageConfig::loadByName('node', \$name)) {
  FieldStorageConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'type'        => 'string',
    'cardinality' => -1,
    'settings'    => ['max_length' => 512],
  ])->save();
  echo \"Created storage: \$name\" . PHP_EOL;
}
if (!FieldConfig::loadByName('node', 'grok_insight', \$name)) {
  FieldConfig::create([
    'field_name'  => \$name,
    'entity_type' => 'node',
    'bundle'      => 'grok_insight',
    'label'       => 'Follow-up Questions',
    'required'    => FALSE,
  ])->save();
  echo \"Attached to grok_insight: \$name\" . PHP_EOL;
}

echo 'Grok Insight fields checked/created.' . PHP_EOL;
"

"$DRUSH" cache:rebuild
echo "=== Grok Insight content type setup complete ==="
