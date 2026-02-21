#!/bin/bash

# ============================================================================
# Verscienta Health - Paragraph Types Setup
# ============================================================================
# Creates paragraph types for structured content within nodes.
# Run this AFTER the main content types and fields are set up.
#
# Usage: ddev exec bash /var/www/html/scripts/setup-paragraph-types.sh
# ============================================================================

echo "=============================================="
echo "Setting up Paragraph Types"
echo "=============================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper: create a paragraph type if it doesn't exist
create_paragraph_type() {
    local machine_name=$1
    local label=$2
    local description=$3

    echo -e "${BLUE}Creating paragraph type: ${machine_name}${NC}"

    TYPE_EXISTS=$(drush php:eval "
        \$type = \Drupal\paragraphs\Entity\ParagraphsType::load('$machine_name');
        echo \$type ? 'yes' : 'no';
    " 2>/dev/null || echo "no")

    if [ "$TYPE_EXISTS" = "yes" ]; then
        echo "  Paragraph type ${machine_name} already exists"
    else
        drush php:eval "
            \$type = \Drupal\paragraphs\Entity\ParagraphsType::create([
                'id' => '$machine_name',
                'label' => '$label',
                'description' => '$description',
            ]);
            \$type->save();
        " 2>/dev/null || echo "  Warning: Could not create paragraph type ${machine_name}"
    fi
    echo -e "${GREEN}  Done${NC}"
}

# Helper: add a text field to a paragraph type
add_paragraph_text_field() {
    local para_type=$1
    local field_name=$2
    local label=$3
    local field_type=${4:-string}

    FIELD_EXISTS=$(drush php:eval "
        \$field = \Drupal\field\Entity\FieldConfig::loadByName('paragraph', '$para_type', '$field_name');
        echo \$field ? 'yes' : 'no';
    " 2>/dev/null || echo "no")

    if [ "$FIELD_EXISTS" = "yes" ]; then
        echo "  Field ${field_name} already exists on ${para_type}"
        return
    fi

    drush php:eval "
        // Create field storage if it doesn't exist
        \$storage = \Drupal\field\Entity\FieldStorageConfig::loadByName('paragraph', '$field_name');
        if (!\$storage) {
            \$storage = \Drupal\field\Entity\FieldStorageConfig::create([
                'field_name' => '$field_name',
                'entity_type' => 'paragraph',
                'type' => '$field_type',
                'cardinality' => 1,
            ]);
            \$storage->save();
        }
        // Create field instance
        \$field = \Drupal\field\Entity\FieldConfig::create([
            'field_storage' => \$storage,
            'bundle' => '$para_type',
            'label' => '$label',
        ]);
        \$field->save();
    " 2>/dev/null || echo "  Warning: Could not create field ${field_name}"
    echo "  Added ${field_name} to ${para_type}"
}

# Helper: add a boolean field to a paragraph type
add_paragraph_boolean_field() {
    local para_type=$1
    local field_name=$2
    local label=$3

    FIELD_EXISTS=$(drush php:eval "
        \$field = \Drupal\field\Entity\FieldConfig::loadByName('paragraph', '$para_type', '$field_name');
        echo \$field ? 'yes' : 'no';
    " 2>/dev/null || echo "no")

    if [ "$FIELD_EXISTS" = "yes" ]; then
        echo "  Field ${field_name} already exists on ${para_type}"
        return
    fi

    drush php:eval "
        \$storage = \Drupal\field\Entity\FieldStorageConfig::loadByName('paragraph', '$field_name');
        if (!\$storage) {
            \$storage = \Drupal\field\Entity\FieldStorageConfig::create([
                'field_name' => '$field_name',
                'entity_type' => 'paragraph',
                'type' => 'boolean',
                'cardinality' => 1,
            ]);
            \$storage->save();
        }
        \$field = \Drupal\field\Entity\FieldConfig::create([
            'field_storage' => \$storage,
            'bundle' => '$para_type',
            'label' => '$label',
        ]);
        \$field->save();
    " 2>/dev/null || echo "  Warning: Could not create field ${field_name}"
    echo "  Added ${field_name} to ${para_type}"
}

# Helper: add an entity reference field to a paragraph type
add_paragraph_entity_ref() {
    local para_type=$1
    local field_name=$2
    local label=$3
    local target_type=${4:-node}
    local target_bundles=$5
    local cardinality=${6:-1}

    FIELD_EXISTS=$(drush php:eval "
        \$field = \Drupal\field\Entity\FieldConfig::loadByName('paragraph', '$para_type', '$field_name');
        echo \$field ? 'yes' : 'no';
    " 2>/dev/null || echo "no")

    if [ "$FIELD_EXISTS" = "yes" ]; then
        echo "  Field ${field_name} already exists on ${para_type}"
        return
    fi

    drush php:eval "
        \$storage = \Drupal\field\Entity\FieldStorageConfig::loadByName('paragraph', '$field_name');
        if (!\$storage) {
            \$storage = \Drupal\field\Entity\FieldStorageConfig::create([
                'field_name' => '$field_name',
                'entity_type' => 'paragraph',
                'type' => 'entity_reference',
                'cardinality' => $cardinality,
                'settings' => ['target_type' => '$target_type'],
            ]);
            \$storage->save();
        }
        \$field = \Drupal\field\Entity\FieldConfig::create([
            'field_storage' => \$storage,
            'bundle' => '$para_type',
            'label' => '$label',
        ]);
        \$field->save();
    " 2>/dev/null || echo "  Warning: Could not create field ${field_name}"
    echo "  Added ${field_name} to ${para_type}"
}

echo ""
echo "=== Creating Paragraph Types ==="
echo ""

# 1. Herb Common Name
create_paragraph_type "herb_common_name" "Herb Common Name" "Common names in different languages/regions"
add_paragraph_text_field "herb_common_name" "field_common_name" "Common Name" "string"
add_paragraph_text_field "herb_common_name" "field_language_region" "Language/Region" "string"

# 2. TCM Properties
create_paragraph_type "tcm_properties" "TCM Properties" "Traditional Chinese Medicine property set"
add_paragraph_text_field "tcm_properties" "field_tcm_temperature" "Temperature" "string"
add_paragraph_text_field "tcm_properties" "field_tcm_flavor" "Flavor" "string"
add_paragraph_text_field "tcm_properties" "field_tcm_channel" "Channel Entry" "string"
add_paragraph_text_field "tcm_properties" "field_tcm_actions" "Actions" "text_long"

# 3. Active Constituent
create_paragraph_type "active_constituent" "Active Constituent" "Chemical constituent of an herb"
add_paragraph_text_field "active_constituent" "field_constituent_name" "Constituent Name" "string"
add_paragraph_text_field "active_constituent" "field_constituent_class" "Chemical Class" "string"
add_paragraph_text_field "active_constituent" "field_constituent_effects" "Known Effects" "text_long"
add_paragraph_text_field "active_constituent" "field_concentration_range" "Concentration Range" "string"

# 4. Clinical Study
create_paragraph_type "clinical_study" "Clinical Study" "Reference to a clinical research study"
add_paragraph_text_field "clinical_study" "field_study_title" "Study Title" "string"
add_paragraph_text_field "clinical_study" "field_study_authors" "Authors" "string"
add_paragraph_text_field "clinical_study" "field_study_year" "Year" "string"
add_paragraph_text_field "clinical_study" "field_study_journal" "Journal" "string"
add_paragraph_text_field "clinical_study" "field_study_doi" "DOI" "string"
add_paragraph_text_field "clinical_study" "field_study_summary" "Summary" "text_long"
add_paragraph_text_field "clinical_study" "field_study_type" "Study Type" "string"
add_paragraph_text_field "clinical_study" "field_sample_size" "Sample Size" "string"

# 5. Dosage Info
create_paragraph_type "dosage_info" "Dosage Information" "Dosage and administration details"
add_paragraph_text_field "dosage_info" "field_dosage_form" "Form" "string"
add_paragraph_text_field "dosage_info" "field_dosage_amount" "Dosage Amount" "string"
add_paragraph_text_field "dosage_info" "field_dosage_frequency" "Frequency" "string"
add_paragraph_text_field "dosage_info" "field_dosage_duration" "Duration" "string"
add_paragraph_text_field "dosage_info" "field_dosage_notes" "Notes" "text_long"

# 6. Drug Interaction
create_paragraph_type "drug_interaction" "Drug Interaction" "Known drug-herb interactions"
add_paragraph_text_field "drug_interaction" "field_drug_name" "Drug Name" "string"
add_paragraph_text_field "drug_interaction" "field_interaction_type" "Interaction Type" "string"
add_paragraph_text_field "drug_interaction" "field_severity_level" "Severity" "string"
add_paragraph_text_field "drug_interaction" "field_interaction_mechanism" "Mechanism" "text_long"
add_paragraph_text_field "drug_interaction" "field_interaction_evidence" "Evidence Level" "string"

# 7. Toxicity Info
create_paragraph_type "toxicity_info" "Toxicity Information" "Toxicity and safety data"
add_paragraph_text_field "toxicity_info" "field_toxic_part" "Toxic Part" "string"
add_paragraph_text_field "toxicity_info" "field_toxic_compound" "Toxic Compound" "string"
add_paragraph_text_field "toxicity_info" "field_toxic_dose" "Toxic Dose" "string"
add_paragraph_text_field "toxicity_info" "field_symptoms_of_toxicity" "Symptoms" "text_long"
add_paragraph_text_field "toxicity_info" "field_treatment_for_toxicity" "Treatment" "text_long"

# 8. Preparation Method
create_paragraph_type "preparation_method" "Preparation Method" "How to prepare herbal remedies"
add_paragraph_text_field "preparation_method" "field_preparation_type" "Type" "string"
add_paragraph_text_field "preparation_method" "field_preparation_instructions" "Instructions" "text_long"
add_paragraph_text_field "preparation_method" "field_preparation_equipment" "Equipment Needed" "string"
add_paragraph_text_field "preparation_method" "field_preparation_time" "Preparation Time" "string"
add_paragraph_text_field "preparation_method" "field_shelf_life" "Shelf Life" "string"

# 9. Storage Info
create_paragraph_type "storage_info" "Storage Information" "Proper storage conditions"
add_paragraph_text_field "storage_info" "field_storage_temperature" "Temperature" "string"
add_paragraph_text_field "storage_info" "field_storage_humidity" "Humidity" "string"
add_paragraph_text_field "storage_info" "field_storage_container" "Container Type" "string"
add_paragraph_text_field "storage_info" "field_storage_duration" "Max Storage Duration" "string"
add_paragraph_text_field "storage_info" "field_storage_notes" "Notes" "text_long"

# 10. Sourcing Info
create_paragraph_type "sourcing_info" "Sourcing Information" "Where and how herbs are sourced"
add_paragraph_text_field "sourcing_info" "field_source_region" "Region" "string"
add_paragraph_text_field "sourcing_info" "field_source_method" "Collection Method" "string"
add_paragraph_boolean_field "sourcing_info" "field_wildcrafted" "Wildcrafted"
add_paragraph_boolean_field "sourcing_info" "field_organic_certified" "Organic Certified"
add_paragraph_text_field "sourcing_info" "field_sustainability_notes" "Sustainability Notes" "text_long"

# 11. Quality Standard
create_paragraph_type "quality_standard" "Quality Standard" "Quality testing standards and benchmarks"
add_paragraph_text_field "quality_standard" "field_standard_name" "Standard Name" "string"
add_paragraph_text_field "quality_standard" "field_standard_org" "Organization" "string"
add_paragraph_text_field "quality_standard" "field_standard_criteria" "Criteria" "text_long"
add_paragraph_text_field "quality_standard" "field_standard_url" "Reference URL" "string"

# 12. Adulteration Info
create_paragraph_type "adulteration_info" "Adulteration Information" "Known adulterants and identification methods"
add_paragraph_text_field "adulteration_info" "field_adulterant_name" "Adulterant" "string"
add_paragraph_text_field "adulteration_info" "field_detection_method" "Detection Method" "string"
add_paragraph_text_field "adulteration_info" "field_adulterant_risk" "Health Risk" "text_long"

# 13. Safety Warning
create_paragraph_type "safety_warning" "Safety Warning" "Important safety alerts and contraindications"
add_paragraph_text_field "safety_warning" "field_warning_level" "Warning Level" "string"
add_paragraph_text_field "safety_warning" "field_warning_text" "Warning Text" "text_long"
add_paragraph_text_field "safety_warning" "field_affected_populations" "Affected Populations" "string"

# 14. Historical Text
create_paragraph_type "historical_text" "Historical Text" "Historical references and classical texts"
add_paragraph_text_field "historical_text" "field_source_text" "Source Text" "string"
add_paragraph_text_field "historical_text" "field_text_author" "Author" "string"
add_paragraph_text_field "historical_text" "field_text_era" "Era/Period" "string"
add_paragraph_text_field "historical_text" "field_text_excerpt" "Excerpt" "text_long"
add_paragraph_text_field "historical_text" "field_text_translation" "Translation" "text_long"

# 15. Practitioner Note
create_paragraph_type "practitioner_note" "Practitioner Note" "Clinical notes from practitioners"
add_paragraph_text_field "practitioner_note" "field_note_author_name" "Author Name" "string"
add_paragraph_text_field "practitioner_note" "field_note_credentials" "Credentials" "string"
add_paragraph_text_field "practitioner_note" "field_note_text" "Note" "text_long"
add_paragraph_text_field "practitioner_note" "field_note_date" "Date" "string"

# 16. Case Study
create_paragraph_type "case_study" "Case Study" "Clinical case studies"
add_paragraph_text_field "case_study" "field_case_title" "Title" "string"
add_paragraph_text_field "case_study" "field_patient_profile" "Patient Profile" "text_long"
add_paragraph_text_field "case_study" "field_presenting_complaint" "Presenting Complaint" "text_long"
add_paragraph_text_field "case_study" "field_treatment_given" "Treatment" "text_long"
add_paragraph_text_field "case_study" "field_outcome" "Outcome" "text_long"

# 17. Regulatory Info
create_paragraph_type "regulatory_info" "Regulatory Information" "Regulatory status by country/region"
add_paragraph_text_field "regulatory_info" "field_reg_country" "Country/Region" "string"
add_paragraph_text_field "regulatory_info" "field_reg_status" "Status" "string"
add_paragraph_text_field "regulatory_info" "field_reg_classification" "Classification" "string"
add_paragraph_text_field "regulatory_info" "field_reg_notes" "Notes" "text_long"

# 18. External ID
create_paragraph_type "external_id" "External ID" "External database identifiers"
add_paragraph_text_field "external_id" "field_ext_database" "Database" "string"
add_paragraph_text_field "external_id" "field_ext_identifier" "Identifier" "string"
add_paragraph_text_field "external_id" "field_ext_url" "URL" "string"

# 19. Contributor
create_paragraph_type "contributor" "Contributor" "Content contributor attribution"
add_paragraph_text_field "contributor" "field_contributor_name" "Name" "string"
add_paragraph_text_field "contributor" "field_contributor_role" "Role" "string"
add_paragraph_text_field "contributor" "field_contributor_affiliation" "Affiliation" "string"
add_paragraph_text_field "contributor" "field_contributor_date" "Contribution Date" "string"

# 20. Reference
create_paragraph_type "reference" "Reference" "Bibliographic references"
add_paragraph_text_field "reference" "field_ref_title" "Title" "string"
add_paragraph_text_field "reference" "field_ref_authors" "Authors" "string"
add_paragraph_text_field "reference" "field_ref_publication" "Publication" "string"
add_paragraph_text_field "reference" "field_ref_year" "Year" "string"
add_paragraph_text_field "reference" "field_ref_doi" "DOI" "string"
add_paragraph_text_field "reference" "field_ref_url" "URL" "string"

# 21. Image Info
create_paragraph_type "image_info" "Image Information" "Botanical images with metadata"
add_paragraph_text_field "image_info" "field_image_caption" "Caption" "string"
add_paragraph_text_field "image_info" "field_image_credit" "Credit" "string"
add_paragraph_text_field "image_info" "field_image_license" "License" "string"
add_paragraph_text_field "image_info" "field_image_alt_text" "Alt Text" "string"

echo ""
echo "=============================================="
echo -e "${GREEN}Paragraph types setup complete!${NC}"
echo "Created 21 paragraph types with associated fields"
echo "=============================================="
