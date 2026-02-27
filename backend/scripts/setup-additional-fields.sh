#!/bin/bash

# ============================================================================
# Verscienta Health - Additional Content Type Fields Setup
# ============================================================================
# This script adds missing fields to existing content types.
# Run this AFTER setup-all-content-types.sh
#
# Usage: ddev exec bash /var/www/html/scripts/setup-additional-fields.sh
# ============================================================================

# Note: Not using 'set -e' so script continues even if some fields already exist

echo "=============================================="
echo "Setting up Additional Content Type Fields"
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

    # Check if field exists using drush
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

# Helper function to create integer field
create_integer_field() {
    local field_name=$1
    local content_type=$2
    local label=$3
    local description=$4

    echo -e "${BLUE}Creating integer field: ${field_name} on ${content_type}${NC}"

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
            --field-type=integer \
            --is-required=0 \
            -y 2>/dev/null || echo "  Warning: Could not create field"
    fi
    echo -e "${GREEN}  Done${NC}"
}

# Helper function to create decimal field
create_decimal_field() {
    local field_name=$1
    local content_type=$2
    local label=$3
    local description=$4

    echo -e "${BLUE}Creating decimal field: ${field_name} on ${content_type}${NC}"

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
            --field-type=decimal \
            --is-required=0 \
            -y 2>/dev/null || echo "  Warning: Could not create field"
    fi
    echo -e "${GREEN}  Done${NC}"
}

echo ""
echo "=============================================="
echo "1. HERB Additional Fields"
echo "=============================================="

# Common Names (text list for multiple common names)
create_text_field \
    "field_common_names" \
    "herb" \
    "Common Names" \
    "Other common names for this herb (one per line)" \
    "string_long"

# Origin/Native Region
create_text_field \
    "field_native_region" \
    "herb" \
    "Native Region" \
    "Geographic regions where this herb is native" \
    "string"

# Growing Conditions
create_text_field \
    "field_growing_conditions" \
    "herb" \
    "Growing Conditions" \
    "Climate and soil requirements for cultivation" \
    "text_long"

# Parts Used (e.g., root, leaf, flower)
create_text_field \
    "field_parts_used" \
    "herb" \
    "Parts Used" \
    "Plant parts used medicinally (root, leaf, flower, etc.)" \
    "string"

# Harvest Season
create_text_field \
    "field_harvest_season" \
    "herb" \
    "Harvest Season" \
    "Optimal time to harvest this herb" \
    "string"

# Pinyin Name (TCM pronunciation used by practitioners)
create_text_field \
    "field_herb_pinyin_name" \
    "herb" \
    "Pinyin Name" \
    "Chinese pinyin pronunciation for TCM practitioners (e.g., Ren Shen)" \
    "string"

# Flavor Profile (TCM taste)
create_list_field \
    "field_flavor_profile" \
    "herb" \
    "Flavor Profile" \
    "Traditional taste characteristics"

# Temperature (TCM property)
create_list_field \
    "field_temperature" \
    "herb" \
    "Temperature" \
    "Traditional temperature classification"

# Channel Entry (TCM meridians)
create_text_field \
    "field_channel_entry" \
    "herb" \
    "Channel Entry" \
    "TCM meridians/channels this herb affects" \
    "string"

# Quality Indicators
create_text_field \
    "field_quality_indicators" \
    "herb" \
    "Quality Indicators" \
    "How to identify high-quality specimens" \
    "text_long"

# Storage Instructions
create_text_field \
    "field_storage_instructions" \
    "herb" \
    "Storage Instructions" \
    "How to properly store this herb" \
    "text_long"

# Research Summary
create_text_field \
    "field_research_summary" \
    "herb" \
    "Research Summary" \
    "Summary of modern scientific research" \
    "text_long"

# Historical Use
create_text_field \
    "field_historical_use" \
    "herb" \
    "Historical Use" \
    "Traditional and historical uses" \
    "text_long"

echo ""
echo "=============================================="
echo "2. MODALITY Additional Fields"
echo "=============================================="

# Excels At
create_text_field \
    "field_excels_at" \
    "modality" \
    "Excels At" \
    "What this modality is particularly effective for" \
    "text_long"

# Key Benefits
create_text_field \
    "field_key_benefits" \
    "modality" \
    "Key Benefits" \
    "Primary benefits of this healing modality" \
    "text_long"

# Origin Country/Region
create_text_field \
    "field_origin_region" \
    "modality" \
    "Origin" \
    "Where this modality originated" \
    "string"

# Typical Session Duration
create_text_field \
    "field_session_duration" \
    "modality" \
    "Typical Session Duration" \
    "How long a typical session lasts (e.g., 60-90 minutes)" \
    "string"

# Training Requirements
create_text_field \
    "field_training_requirements" \
    "modality" \
    "Training Requirements" \
    "Required training and certification for practitioners" \
    "text_long"

# What to Expect
create_text_field \
    "field_what_to_expect" \
    "modality" \
    "What to Expect" \
    "Description of what happens during a session" \
    "text_long"

# Contraindications
create_text_field \
    "field_modality_contraindications" \
    "modality" \
    "Contraindications" \
    "When this modality should be avoided" \
    "text_long"

# Evidence Level
create_list_field \
    "field_evidence_level" \
    "modality" \
    "Evidence Level" \
    "Level of scientific evidence supporting this modality"

echo ""
echo "=============================================="
echo "3. CONDITION Additional Fields"
echo "=============================================="

# Symptoms List
create_text_field \
    "field_symptoms_list" \
    "condition" \
    "Common Symptoms" \
    "List of common symptoms (one per line)" \
    "text_long"

# Severity Level
create_list_field \
    "field_severity_level" \
    "condition" \
    "Typical Severity" \
    "Typical severity level of this condition"

# Duration
create_list_field \
    "field_condition_duration" \
    "condition" \
    "Duration" \
    "Typical duration of this condition"

# Prevalence
create_text_field \
    "field_prevalence" \
    "condition" \
    "Prevalence" \
    "How common this condition is" \
    "string"

# Risk Factors
create_text_field \
    "field_risk_factors" \
    "condition" \
    "Risk Factors" \
    "Factors that increase risk of this condition" \
    "text_long"

# Conventional Treatment
create_text_field \
    "field_conventional_treatment" \
    "condition" \
    "Conventional Treatment" \
    "Standard medical treatments for this condition" \
    "text_long"

# Holistic Approach
create_text_field \
    "field_holistic_approach" \
    "condition" \
    "Holistic Approach" \
    "Holistic and integrative treatment approaches" \
    "text_long"

# Lifestyle Recommendations
create_text_field \
    "field_lifestyle_recommendations" \
    "condition" \
    "Lifestyle Recommendations" \
    "Diet, exercise, and lifestyle changes that may help" \
    "text_long"

# When to See a Doctor
create_text_field \
    "field_see_doctor_when" \
    "condition" \
    "When to See a Doctor" \
    "Warning signs that require professional medical attention" \
    "text_long"

echo ""
echo "=============================================="
echo "4. PRACTITIONER Additional Fields"
echo "=============================================="

# Practice Type
create_list_field \
    "field_practice_type" \
    "practitioner" \
    "Practice Type" \
    "Type of practice setting"

# Credentials/Certifications
create_text_field \
    "field_credentials" \
    "practitioner" \
    "Credentials" \
    "Professional credentials and certifications (e.g., LAc, ND, DOM)" \
    "string"

# License Number
create_text_field \
    "field_license_number" \
    "practitioner" \
    "License Number" \
    "Professional license number (if applicable)" \
    "string"

# Years in Practice
create_integer_field \
    "field_years_practice" \
    "practitioner" \
    "Years in Practice" \
    "Number of years practicing"

# Accepting New Patients
create_boolean_field \
    "field_accepting_patients" \
    "practitioner" \
    "Accepting New Patients" \
    "Whether currently accepting new patients"

# Offers Telehealth
create_boolean_field \
    "field_offers_telehealth" \
    "practitioner" \
    "Offers Telehealth" \
    "Whether virtual consultations are available"

# Insurance Accepted
create_text_field \
    "field_insurance_accepted" \
    "practitioner" \
    "Insurance Accepted" \
    "List of accepted insurance providers" \
    "text_long"

# Street Address
create_text_field \
    "field_street_address" \
    "practitioner" \
    "Street Address" \
    "Practice street address" \
    "string"

# City
create_text_field \
    "field_city" \
    "practitioner" \
    "City" \
    "City where practice is located" \
    "string"

# State/Province
create_text_field \
    "field_state" \
    "practitioner" \
    "State/Province" \
    "State or province" \
    "string"

# Postal Code
create_text_field \
    "field_postal_code" \
    "practitioner" \
    "Postal Code" \
    "ZIP or postal code" \
    "string"

# Country
create_text_field \
    "field_country" \
    "practitioner" \
    "Country" \
    "Country" \
    "string"

# Phone Number
create_text_field \
    "field_phone" \
    "practitioner" \
    "Phone Number" \
    "Contact phone number" \
    "string"

# Email
create_text_field \
    "field_email" \
    "practitioner" \
    "Email" \
    "Contact email address" \
    "string"

# Website
create_text_field \
    "field_website" \
    "practitioner" \
    "Website" \
    "Practice website URL" \
    "string"

# Latitude (for geocoding)
create_decimal_field \
    "field_latitude" \
    "practitioner" \
    "Latitude" \
    "Geographic latitude coordinate"

# Longitude (for geocoding)
create_decimal_field \
    "field_longitude" \
    "practitioner" \
    "Longitude" \
    "Geographic longitude coordinate"

# Languages Spoken
create_text_field \
    "field_languages" \
    "practitioner" \
    "Languages Spoken" \
    "Languages the practitioner speaks" \
    "string"

# Bio/About
create_text_field \
    "field_bio" \
    "practitioner" \
    "Biography" \
    "About the practitioner" \
    "text_long"

# Education
create_text_field \
    "field_education" \
    "practitioner" \
    "Education" \
    "Educational background and training" \
    "text_long"

# Average Rating (computed from reviews)
create_decimal_field \
    "field_average_rating" \
    "practitioner" \
    "Average Rating" \
    "Average rating from patient reviews (1-5)"

# Review Count
create_integer_field \
    "field_review_count" \
    "practitioner" \
    "Review Count" \
    "Number of reviews received"

echo ""
echo "=============================================="
echo "5. FORMULA Additional Fields"
echo "=============================================="

# Chinese Name (Pinyin)
create_text_field \
    "field_pinyin_name" \
    "formula" \
    "Pinyin Name" \
    "Chinese name in Pinyin transliteration" \
    "string"

# Modification Notes (explains how this formula was derived from its parent)
create_text_field \
    "field_modification_notes" \
    "formula" \
    "Modification Notes" \
    "Describes how this formula was modified from its parent formula (e.g., 'Gui Zhi Tang with Long Gu and Mu Li added for palpitations')" \
    "text_long"

# Chinese Characters
create_text_field \
    "field_chinese_name" \
    "formula" \
    "Chinese Name" \
    "Name in Chinese characters" \
    "string"

# Classic Source
create_text_field \
    "field_classic_source" \
    "formula" \
    "Classic Source" \
    "Original text where this formula appears" \
    "string"

# Actions
create_text_field \
    "field_formula_actions" \
    "formula" \
    "Actions" \
    "Primary therapeutic actions of this formula" \
    "text_long"

# Indications
create_text_field \
    "field_formula_indications" \
    "formula" \
    "Indications" \
    "Conditions and symptoms this formula addresses" \
    "text_long"

# Contraindications
create_text_field \
    "field_formula_contraindications" \
    "formula" \
    "Contraindications" \
    "When this formula should not be used" \
    "text_long"

# Preparation Method
create_text_field \
    "field_preparation_method" \
    "formula" \
    "Preparation Method" \
    "How to prepare this formula (decoction, pills, etc.)" \
    "text_long"

# Dosage
create_text_field \
    "field_formula_dosage" \
    "formula" \
    "Dosage" \
    "Recommended dosage and administration" \
    "text_long"

# Modifications
create_text_field \
    "field_modifications" \
    "formula" \
    "Common Modifications" \
    "Variations and modifications of this formula" \
    "text_long"

# Pattern/Syndrome
create_text_field \
    "field_tcm_pattern" \
    "formula" \
    "TCM Pattern" \
    "TCM pattern/syndrome this formula treats" \
    "string"

echo ""
echo "=============================================="
echo "6. REVIEW Additional Fields"
echo "=============================================="

# Rating (1-5)
create_integer_field \
    "field_rating" \
    "review" \
    "Rating" \
    "Rating from 1 to 5 stars"

# Review Title
create_text_field \
    "field_review_title" \
    "review" \
    "Review Title" \
    "Brief title for this review" \
    "string"

# Verified Purchase/Visit
create_boolean_field \
    "field_verified" \
    "review" \
    "Verified" \
    "Whether this review is from a verified visit/purchase"

# Helpful Votes
create_integer_field \
    "field_helpful_votes" \
    "review" \
    "Helpful Votes" \
    "Number of users who found this review helpful"

echo ""
echo "=============================================="
echo "7. GROK INSIGHT Additional Fields"
echo "=============================================="

# Insight Type
create_list_field \
    "field_insight_type" \
    "grok_insight" \
    "Insight Type" \
    "Type of AI-generated insight"

# Confidence Score
create_decimal_field \
    "field_confidence_score" \
    "grok_insight" \
    "Confidence Score" \
    "AI confidence in this insight (0-1)"

# Source Query
create_text_field \
    "field_source_query" \
    "grok_insight" \
    "Source Query" \
    "The original user query that generated this insight" \
    "text_long"

# Model Version
create_text_field \
    "field_model_version" \
    "grok_insight" \
    "Model Version" \
    "Version of the AI model used" \
    "string"

echo ""
echo "=============================================="
echo "Clearing Drupal Caches"
echo "=============================================="
drush cr

echo ""
echo -e "${GREEN}=============================================="
echo "Additional Fields Setup Complete!"
echo "==============================================${NC}"
echo ""
echo "Created additional fields for:"
echo "  - Herb: 12 new fields (common names, origin, TCM properties, etc.)"
echo "  - Modality: 8 new fields (excels at, benefits, evidence level, etc.)"
echo "  - Condition: 9 new fields (symptoms, severity, treatments, etc.)"
echo "  - Practitioner: 18 new fields (credentials, address, contact, etc.)"
echo "  - Formula: 10 new fields (Chinese name, actions, preparation, etc.)"
echo "  - Review: 4 new fields (rating, title, verified, helpful votes)"
echo "  - Grok Insight: 4 new fields (type, confidence, query, model)"
echo ""
echo "Total: ~65 additional fields"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Configure field widgets in Drupal admin UI"
echo "  2. Set up form display order"
echo "  3. Configure view display settings"
echo "  4. Run sample content script to populate data"
echo ""
