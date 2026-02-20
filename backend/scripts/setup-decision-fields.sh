#!/bin/bash

# ============================================================================
# Verscienta Health - Decision-Making Fields Setup
# ============================================================================
# This script adds decision-oriented fields to content types to help users
# make practical choices (popularity, cost, difficulty, etc.).
# Run this AFTER setup-additional-fields.sh and setup-entity-references.sh
#
# Usage: ddev exec bash /var/www/html/scripts/setup-decision-fields.sh
# ============================================================================

# Note: Not using 'set -e' so script continues even if some fields already exist

echo "=============================================="
echo "Setting up Decision-Making Fields"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to create text field
create_text_field() {
    local field_name=$1
    local content_type=$2
    local label=$3
    local description=$4
    local field_type=${5:-string}  # string, string_long, text, text_long

    echo -e "${BLUE}Creating field: ${field_name} on ${content_type}${NC}"

    FIELD_EXISTS=$(drush php:eval "
        \$field = \Drupal\field\Entity\FieldConfig::loadByName('node', '$content_type', '$field_name');
        echo \$field ? 'yes' : 'no';
    " 2>/dev/null || echo "no")

    if [ "$FIELD_EXISTS" = "yes" ]; then
        echo "  Field ${field_name} already exists on ${content_type}"
    else
        echo "  Creating ${field_name}..."
        drush field:create node "$content_type" \
            --field-name="$field_name" \
            --field-label="$label" \
            --field-description="$description" \
            --field-type="$field_type" \
            --is-required=0 \
            -y 2>/dev/null || echo "  Warning: Could not create field"
    fi
    echo -e "${GREEN}  Done${NC}"
}

# Helper function to create list field
create_list_field() {
    local field_name=$1
    local content_type=$2
    local label=$3
    local description=$4

    echo -e "${BLUE}Creating list field: ${field_name} on ${content_type}${NC}"

    FIELD_EXISTS=$(drush php:eval "
        \$field = \Drupal\field\Entity\FieldConfig::loadByName('node', '$content_type', '$field_name');
        echo \$field ? 'yes' : 'no';
    " 2>/dev/null || echo "no")

    if [ "$FIELD_EXISTS" = "yes" ]; then
        echo "  Field ${field_name} already exists on ${content_type}"
    else
        echo "  Creating ${field_name}..."
        drush field:create node "$content_type" \
            --field-name="$field_name" \
            --field-label="$label" \
            --field-description="$description" \
            --field-type=list_string \
            --is-required=0 \
            -y 2>/dev/null || echo "  Warning: Could not create field"
    fi
    echo -e "${GREEN}  Done${NC}"
}

# Helper function to create boolean field
create_boolean_field() {
    local field_name=$1
    local content_type=$2
    local label=$3
    local description=$4

    echo -e "${BLUE}Creating boolean field: ${field_name} on ${content_type}${NC}"

    FIELD_EXISTS=$(drush php:eval "
        \$field = \Drupal\field\Entity\FieldConfig::loadByName('node', '$content_type', '$field_name');
        echo \$field ? 'yes' : 'no';
    " 2>/dev/null || echo "no")

    if [ "$FIELD_EXISTS" = "yes" ]; then
        echo "  Field ${field_name} already exists on ${content_type}"
    else
        echo "  Creating ${field_name}..."
        drush field:create node "$content_type" \
            --field-name="$field_name" \
            --field-label="$label" \
            --field-description="$description" \
            --field-type=boolean \
            --is-required=0 \
            -y 2>/dev/null || echo "  Warning: Could not create field"
    fi
    echo -e "${GREEN}  Done${NC}"
}

# Helper function to create entity reference field
create_entity_reference() {
    local field_name=$1
    local content_type=$2
    local target_type=$3
    local target_bundle=$4
    local label=$5
    local description=$6
    local cardinality=${7:--1}  # -1 = unlimited

    echo -e "${BLUE}Creating field: ${field_name} on ${content_type}${NC}"

    FIELD_EXISTS=$(drush php:eval "
        \$field = \Drupal\field\Entity\FieldConfig::loadByName('node', '$content_type', '$field_name');
        echo \$field ? 'yes' : 'no';
    " 2>/dev/null || echo "no")

    if [ "$FIELD_EXISTS" = "yes" ]; then
        echo "  Field ${field_name} already exists on ${content_type}"
    else
        echo "  Creating ${field_name}..."
        drush field:create node "$content_type" \
            --field-name="$field_name" \
            --field-label="$label" \
            --field-description="$description" \
            --field-type=entity_reference \
            --target-type="$target_type" \
            --target-bundle="$target_bundle" \
            --cardinality="$cardinality" \
            -y 2>/dev/null || echo "  Warning: Could not create field"
    fi

    echo -e "${GREEN}  Done${NC}"
}

# Helper function to set allowed values for a list_string field
set_allowed_values() {
    local field_name=$1
    local content_type=$2
    shift 2
    local values="$@"

    echo -e "${BLUE}Setting allowed values for ${field_name}${NC}"

    drush php:eval "
        \$storage = \Drupal\field\Entity\FieldStorageConfig::loadByName('node', '$field_name');
        if (\$storage) {
            \$allowed = [];
            foreach (explode(',', '$values') as \$v) {
                \$v = trim(\$v);
                \$label = ucwords(str_replace('_', ' ', \$v));
                \$allowed[\$v] = \$label;
            }
            \$storage->setSetting('allowed_values', \$allowed);
            \$storage->save();
            echo '  Set ' . count(\$allowed) . ' allowed values';
        } else {
            echo '  Warning: Field storage not found';
        }
    " 2>/dev/null || echo "  Warning: Could not set allowed values"

    echo -e "${GREEN}  Done${NC}"
}

echo ""
echo "=============================================="
echo "1. HERB Decision Fields (9 new + 1 cross-cutting)"
echo "=============================================="

# Popularity
create_list_field \
    "field_popularity" \
    "herb" \
    "Popularity" \
    "How commonly used or well-known this herb is"

set_allowed_values "field_popularity" "herb" \
    "staple,common,specialty,rare,obscure"

# Beginner Friendly
create_boolean_field \
    "field_beginner_friendly" \
    "herb" \
    "Beginner Friendly" \
    "Whether this herb is suitable for those new to herbal medicine"

# Onset Speed
create_list_field \
    "field_onset_speed" \
    "herb" \
    "Onset Speed" \
    "How quickly effects are typically noticed"

set_allowed_values "field_onset_speed" "herb" \
    "fast_acting,moderate,cumulative"

# Cost Tier
create_list_field \
    "field_cost_tier" \
    "herb" \
    "Cost Tier" \
    "Typical price range for this herb"

set_allowed_values "field_cost_tier" "herb" \
    "budget,moderate,premium,expensive"

# Palatability
create_list_field \
    "field_palatability" \
    "herb" \
    "Palatability" \
    "How this herb tastes when consumed"

set_allowed_values "field_palatability" "herb" \
    "pleasant,neutral,bitter,very_bitter,pungent"

# Pregnancy Safety
create_list_field \
    "field_pregnancy_safety" \
    "herb" \
    "Pregnancy Safety" \
    "Safety classification during pregnancy"

set_allowed_values "field_pregnancy_safety" "herb" \
    "generally_safe,use_caution,avoid,contraindicated"

# Availability
create_list_field \
    "field_availability" \
    "herb" \
    "Availability" \
    "How easy it is to obtain this herb"

set_allowed_values "field_availability" "herb" \
    "widely_available,specialty_stores,online_only,hard_to_source,practitioner_only"

# Best Season
create_list_field \
    "field_best_season" \
    "herb" \
    "Best Season" \
    "Optimal season for using this herb"

set_allowed_values "field_best_season" "herb" \
    "spring,summer,autumn,winter,year_round"

# Evidence Strength
create_list_field \
    "field_evidence_strength" \
    "herb" \
    "Evidence Strength" \
    "Strength of scientific evidence supporting this herb"

set_allowed_values "field_evidence_strength" "herb" \
    "strong,moderate,preliminary,traditional_only"

# Editor's Pick (cross-cutting - herb)
create_boolean_field \
    "field_editors_pick" \
    "herb" \
    "Editor's Pick" \
    "Featured recommendation by our editorial team"

echo ""
echo "=============================================="
echo "2. FORMULA Decision Fields (7 new + 2 cross-cutting)"
echo "=============================================="

# Formula Popularity
create_list_field \
    "field_formula_popularity" \
    "formula" \
    "Formula Popularity" \
    "How commonly prescribed or used this formula is"

set_allowed_values "field_formula_popularity" "formula" \
    "classic_staple,commonly_prescribed,specialty,historical_rare"

# Preparation Difficulty
create_list_field \
    "field_preparation_difficulty" \
    "formula" \
    "Preparation Difficulty" \
    "How difficult this formula is to prepare"

set_allowed_values "field_preparation_difficulty" "formula" \
    "easy,moderate,advanced,practitioner_only"

# Available Pre-made
create_boolean_field \
    "field_available_premade" \
    "formula" \
    "Available Pre-made" \
    "Whether this formula is available in pre-made commercial forms"

# Commercial Forms
create_text_field \
    "field_commercial_forms" \
    "formula" \
    "Commercial Forms" \
    "Available commercial forms (e.g., Pills, Granules, Tincture)" \
    "string"

# Treatment Duration
create_list_field \
    "field_treatment_duration" \
    "formula" \
    "Treatment Duration" \
    "Typical duration of treatment with this formula"

set_allowed_values "field_treatment_duration" "formula" \
    "acute_short,weeks,months,seasonal,constitutional_long"

# Formula Era
create_text_field \
    "field_formula_era" \
    "formula" \
    "Formula Era" \
    "Historical era when this formula was created (e.g., Han Dynasty, 200 CE)" \
    "string"

# Formula Category
create_list_field \
    "field_formula_category" \
    "formula" \
    "Formula Category" \
    "Primary therapeutic category of this formula"

set_allowed_values "field_formula_category" "formula" \
    "tonifying,clearing_heat,releasing_exterior,regulating_qi,blood_invigorating,phlegm_resolving,digestive,calming,warming_interior,other"

# Editor's Pick (cross-cutting - formula)
create_boolean_field \
    "field_editors_pick" \
    "formula" \
    "Editor's Pick" \
    "Featured recommendation by our editorial team"

# Evidence Strength (cross-cutting - formula)
create_list_field \
    "field_evidence_strength" \
    "formula" \
    "Evidence Strength" \
    "Strength of scientific evidence supporting this formula"

set_allowed_values "field_evidence_strength" "formula" \
    "strong,moderate,preliminary,traditional_only"

echo ""
echo "=============================================="
echo "3. CONDITION Decision Fields (4 new + 1 cross-cutting)"
echo "=============================================="

# Self-Treatable
create_list_field \
    "field_self_treatable" \
    "condition" \
    "Self-Treatable" \
    "Whether this condition can be safely self-managed"

set_allowed_values "field_self_treatable" "condition" \
    "yes,with_guidance,professional_recommended,professional_required"

# Holistic Response Time
create_list_field \
    "field_holistic_response_time" \
    "condition" \
    "Holistic Response Time" \
    "How long holistic treatments typically take to show results"

set_allowed_values "field_holistic_response_time" "condition" \
    "days,weeks,months,varies_widely"

# Complementary Approaches
create_text_field \
    "field_complementary_approaches" \
    "condition" \
    "Complementary Approaches" \
    "Additional holistic approaches that complement treatment" \
    "text_long"

# Quick Summary
create_text_field \
    "field_quick_summary" \
    "condition" \
    "Quick Summary" \
    "Short summary for cards and SEO (max 160 characters)" \
    "string"

# Editor's Pick (cross-cutting - condition)
create_boolean_field \
    "field_editors_pick" \
    "condition" \
    "Editor's Pick" \
    "Featured recommendation by our editorial team"

echo ""
echo "=============================================="
echo "4. MODALITY Decision Fields (4 new + 1 cross-cutting)"
echo "=============================================="

# Session Cost Range
create_text_field \
    "field_session_cost_range" \
    "modality" \
    "Session Cost Range" \
    "Typical cost per session (e.g., \$80-150/session)" \
    "string"

# Self-Practice
create_boolean_field \
    "field_self_practice" \
    "modality" \
    "Can Self-Practice" \
    "Whether aspects of this modality can be practiced at home"

# Sessions Needed
create_text_field \
    "field_sessions_needed" \
    "modality" \
    "Sessions Needed" \
    "Typical number of sessions needed (e.g., 3-6 for acute, 12+ for chronic)" \
    "string"

# Pairs Well With
create_entity_reference \
    "field_pairs_well_with" \
    "modality" \
    "node" \
    "modality" \
    "Pairs Well With" \
    "Other modalities that complement this one well" \
    -1

# Editor's Pick (cross-cutting - modality)
create_boolean_field \
    "field_editors_pick" \
    "modality" \
    "Editor's Pick" \
    "Featured recommendation by our editorial team"

echo ""
echo "=============================================="
echo "Clearing Drupal Caches"
echo "=============================================="
drush cr

echo ""
echo -e "${GREEN}=============================================="
echo "Decision-Making Fields Setup Complete!"
echo "==============================================${NC}"
echo ""
echo "Created decision fields for:"
echo "  - Herb: 9 decision fields + Editor's Pick"
echo "  - Formula: 7 decision fields + Editor's Pick + Evidence Strength"
echo "  - Condition: 4 decision fields + Editor's Pick"
echo "  - Modality: 4 decision fields + Editor's Pick"
echo ""
echo "Total: ~26 decision-making fields"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Run sample content script to populate with values"
echo "  2. Frontend types and display maps are already configured"
echo "  3. Verify fields in Drupal admin: Structure > Content types"
echo ""
