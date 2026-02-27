#!/bin/bash

# ============================================================================
# Verscienta Health - Entity Reference Fields Setup
# ============================================================================
# This script creates entity reference fields for cross-linking content types.
# Run this AFTER setup-all-content-types.sh and setup-taxonomies.sh
#
# Usage: ddev exec bash /var/www/html/scripts/setup-entity-references.sh
# ============================================================================

# Note: Not using 'set -e' so script continues even if some fields already exist

echo "=============================================="
echo "Setting up Entity Reference Fields"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

    # Check if field already exists
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

# Helper function to create taxonomy reference field
create_taxonomy_reference() {
    local field_name=$1
    local content_type=$2
    local vocabulary=$3
    local label=$4
    local description=$5
    local cardinality=${6:--1}

    echo -e "${BLUE}Creating taxonomy field: ${field_name} on ${content_type}${NC}"

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
            --target-type=taxonomy_term \
            --target-bundle="$vocabulary" \
            --cardinality="$cardinality" \
            -y 2>/dev/null || echo "  Warning: Could not create field"
    fi

    echo -e "${GREEN}  Done${NC}"
}

echo ""
echo "=============================================="
echo "1. HERB Entity Reference Fields"
echo "=============================================="

# Herb -> Conditions
create_entity_reference \
    "field_related_conditions" \
    "herb" \
    "node" \
    "condition" \
    "Related Conditions" \
    "Conditions that this herb may help treat or support" \
    -1

# Herb -> Modalities
create_entity_reference \
    "field_healing_traditions" \
    "herb" \
    "node" \
    "modality" \
    "Healing Traditions" \
    "Traditional medicine systems that use this herb" \
    -1

# Herb -> Formulas (reverse reference)
create_entity_reference \
    "field_used_in_formulas" \
    "herb" \
    "node" \
    "formula" \
    "Used in Formulas" \
    "Classical formulas containing this herb" \
    -1

# Herb -> Related Herbs
create_entity_reference \
    "field_related_herbs" \
    "herb" \
    "node" \
    "herb" \
    "Related Herbs" \
    "Similar or complementary herbs" \
    -1

# Herb -> Herb Family (taxonomy)
create_taxonomy_reference \
    "field_herb_family" \
    "herb" \
    "herb_family" \
    "Botanical Family" \
    "The botanical family this herb belongs to" \
    1

# Herb -> Herb Tags (taxonomy)
create_taxonomy_reference \
    "field_herb_tags" \
    "herb" \
    "herb_tags" \
    "Herb Tags" \
    "Tags describing herb properties and uses" \
    -1

# Herb -> TCM Categories (taxonomy)
create_taxonomy_reference \
    "field_tcm_categories" \
    "herb" \
    "tcm_categories" \
    "TCM Categories" \
    "Traditional Chinese Medicine categories for this herb" \
    -1

# Herb -> Body Systems (taxonomy)
create_taxonomy_reference \
    "field_body_systems" \
    "herb" \
    "body_systems" \
    "Body Systems" \
    "Body systems this herb primarily affects" \
    -1

# Herb -> Therapeutic Actions (taxonomy)
create_taxonomy_reference \
    "field_therapeutic_actions" \
    "herb" \
    "therapeutic_actions" \
    "Therapeutic Actions" \
    "Primary therapeutic actions of this herb" \
    -1

echo ""
echo "=============================================="
echo "2. CONDITION Entity Reference Fields"
echo "=============================================="

# Condition -> Herbs
create_entity_reference \
    "field_helpful_herbs" \
    "condition" \
    "node" \
    "herb" \
    "Helpful Herbs" \
    "Herbs that may help with this condition" \
    -1

# Condition -> Modalities
create_entity_reference \
    "field_treatment_approaches" \
    "condition" \
    "node" \
    "modality" \
    "Treatment Approaches" \
    "Healing modalities that address this condition" \
    -1

# Condition -> Practitioners who specialize
create_entity_reference \
    "field_specialists" \
    "condition" \
    "node" \
    "practitioner" \
    "Specialists" \
    "Practitioners who specialize in treating this condition" \
    -1

# Condition -> Related Conditions
create_entity_reference \
    "field_related_conditions_ref" \
    "condition" \
    "node" \
    "condition" \
    "Related Conditions" \
    "Conditions that commonly occur together or are related" \
    -1

# Condition -> Body Systems (taxonomy)
create_taxonomy_reference \
    "field_affected_systems" \
    "condition" \
    "body_systems" \
    "Affected Body Systems" \
    "Body systems affected by this condition" \
    -1

echo ""
echo "=============================================="
echo "3. MODALITY Entity Reference Fields"
echo "=============================================="

# Modality -> Conditions it treats
create_entity_reference \
    "field_treats_conditions" \
    "modality" \
    "node" \
    "condition" \
    "Treats Conditions" \
    "Conditions this modality can help address" \
    -1

# Modality -> Herbs commonly used
create_entity_reference \
    "field_common_herbs" \
    "modality" \
    "node" \
    "herb" \
    "Common Herbs" \
    "Herbs commonly used in this modality" \
    -1

# Modality -> Practitioners
create_entity_reference \
    "field_modality_practitioners" \
    "modality" \
    "node" \
    "practitioner" \
    "Practitioners" \
    "Practitioners who practice this modality" \
    -1

# Modality -> Related Modalities
create_entity_reference \
    "field_related_modalities" \
    "modality" \
    "node" \
    "modality" \
    "Related Modalities" \
    "Related or complementary healing modalities" \
    -1

# Modality -> Category (taxonomy)
create_taxonomy_reference \
    "field_modality_category" \
    "modality" \
    "modality_category" \
    "Modality Category" \
    "The category or tradition this modality belongs to" \
    1

echo ""
echo "=============================================="
echo "4. PRACTITIONER Entity Reference Fields"
echo "=============================================="

# Practitioner -> Modalities practiced
create_entity_reference \
    "field_practices_modalities" \
    "practitioner" \
    "node" \
    "modality" \
    "Modalities Practiced" \
    "Healing modalities this practitioner is trained in" \
    -1

# Practitioner -> Conditions specialized in
create_entity_reference \
    "field_specializes_conditions" \
    "practitioner" \
    "node" \
    "condition" \
    "Specialization Areas" \
    "Conditions this practitioner specializes in treating" \
    -1

# Practitioner -> Herbs expertise
create_entity_reference \
    "field_herb_expertise" \
    "practitioner" \
    "node" \
    "herb" \
    "Herb Expertise" \
    "Herbs this practitioner has particular expertise with" \
    -1

echo ""
echo "=============================================="
echo "5. FORMULA Entity Reference Fields"
echo "=============================================="

# Formula -> Contains Herbs (primary ingredients)
create_entity_reference \
    "field_formula_herbs" \
    "formula" \
    "node" \
    "herb" \
    "Herbs in Formula" \
    "Herbs contained in this formula" \
    -1

# Formula -> Treats Conditions
create_entity_reference \
    "field_formula_conditions" \
    "formula" \
    "node" \
    "condition" \
    "Treats Conditions" \
    "Conditions this formula is traditionally used for" \
    -1

# Formula -> Related Formulas
create_entity_reference \
    "field_related_formulas" \
    "formula" \
    "node" \
    "formula" \
    "Related Formulas" \
    "Similar or derivative formulas" \
    -1

# Formula -> Parent Formula (for formula families/lineages)
create_entity_reference \
    "field_parent_formula" \
    "formula" \
    "node" \
    "formula" \
    "Parent Formula" \
    "The classical or base formula this formula is derived from (leave blank for root formulas)" \
    1

# Formula -> Source Modality (which tradition)
create_entity_reference \
    "field_source_tradition" \
    "formula" \
    "node" \
    "modality" \
    "Source Tradition" \
    "The healing tradition this formula comes from" \
    1

# Formula -> TCM Categories (taxonomy)
create_taxonomy_reference \
    "field_formula_tcm_category" \
    "formula" \
    "tcm_categories" \
    "TCM Category" \
    "TCM category for this formula" \
    -1

echo ""
echo "=============================================="
echo "6. REVIEW Entity Reference Fields"
echo "=============================================="

# Review -> Herb being reviewed
create_entity_reference \
    "field_reviewed_herb" \
    "review" \
    "node" \
    "herb" \
    "Reviewed Herb" \
    "The herb being reviewed" \
    1

# Review -> Practitioner being reviewed
create_entity_reference \
    "field_reviewed_practitioner" \
    "review" \
    "node" \
    "practitioner" \
    "Reviewed Practitioner" \
    "The practitioner being reviewed" \
    1

# Review -> Modality being reviewed
create_entity_reference \
    "field_reviewed_modality" \
    "review" \
    "node" \
    "modality" \
    "Reviewed Modality" \
    "The modality being reviewed" \
    1

# Review -> Formula being reviewed
create_entity_reference \
    "field_reviewed_formula" \
    "review" \
    "node" \
    "formula" \
    "Reviewed Formula" \
    "The formula being reviewed" \
    1

echo ""
echo "=============================================="
echo "7. GROK INSIGHT Entity Reference Fields"
echo "=============================================="

# Grok Insight -> Referenced Herbs
create_entity_reference \
    "field_insight_herbs" \
    "grok_insight" \
    "node" \
    "herb" \
    "Referenced Herbs" \
    "Herbs mentioned in this AI insight" \
    -1

# Grok Insight -> Referenced Conditions
create_entity_reference \
    "field_insight_conditions" \
    "grok_insight" \
    "node" \
    "condition" \
    "Referenced Conditions" \
    "Conditions discussed in this AI insight" \
    -1

# Grok Insight -> Referenced Modalities
create_entity_reference \
    "field_insight_modalities" \
    "grok_insight" \
    "node" \
    "modality" \
    "Referenced Modalities" \
    "Modalities mentioned in this AI insight" \
    -1

echo ""
echo "=============================================="
echo "Clearing Drupal Caches"
echo "=============================================="
drush cr

echo ""
echo -e "${GREEN}=============================================="
echo "Entity Reference Fields Setup Complete!"
echo "==============================================${NC}"
echo ""
echo "Created entity reference fields for:"
echo "  - Herb: 9 reference fields (conditions, modalities, formulas, herbs, 5 taxonomies)"
echo "  - Condition: 5 reference fields (herbs, modalities, practitioners, conditions, body systems)"
echo "  - Modality: 5 reference fields (conditions, herbs, practitioners, modalities, category)"
echo "  - Practitioner: 3 reference fields (modalities, conditions, herbs)"
echo "  - Formula: 5 reference fields (herbs, conditions, formulas, tradition, TCM category)"
echo "  - Review: 4 reference fields (herb, practitioner, modality, formula)"
echo "  - Grok Insight: 3 reference fields (herbs, conditions, modalities)"
echo ""
echo "Total: 34 entity reference fields"
echo ""
echo -e "${YELLOW}Note: You may want to configure the field display settings in Drupal admin${NC}"
echo "  - Go to: Structure > Content types > [type] > Manage form display"
echo "  - Configure autocomplete or select widgets for each field"
echo ""
