#!/bin/bash

################################################################################
# Verscienta Health - TCM Content Types Setup
#
# Creates new content types and fields for TCM database ingestion:
#   - Extends herb with HERB 2.0 fields
#   - tcm_ingredient — chemical compounds from HERB 2.0
#   - tcm_target_interaction — herb/ingredient → protein target links
#   - tcm_clinical_evidence — clinical trial/study references
#   - import_log — ingestion run tracking
#
# Prerequisites: setup-drupal-simple.sh must have been run first.
#
# Usage:
#   cd /home/pf1/verscienta-drupal
#   chmod +x setup-tcm-content-types.sh
#   ./setup-tcm-content-types.sh
#
################################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "============================================================"
echo "  Verscienta Health - TCM Content Types Setup"
echo "============================================================"
echo ""

# Check if DDEV is running
if ! ddev describe &> /dev/null; then
    echo -e "${YELLOW}DDEV is not running. Starting...${NC}"
    ddev start
fi

################################################################################
# Helper: Create a field (storage + instance) with one ddev drush call
#
# Usage: create_field <entity_type> <bundle> <field_name> <field_type> <label> [cardinality] [settings]
################################################################################
create_field() {
  local entity_type="$1"
  local bundle="$2"
  local field_name="$3"
  local field_type="$4"
  local label="$5"
  local cardinality="${6:-1}"
  local settings="${7:-[]}"

  ddev drush php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

\$entity_type = '$entity_type';
\$field_name = '$field_name';
\$bundle = '$bundle';

if (!FieldStorageConfig::loadByName(\$entity_type, \$field_name)) {
  \$storage_settings = json_decode('$settings', TRUE) ?: [];
  FieldStorageConfig::create([
    'field_name' => \$field_name,
    'entity_type' => \$entity_type,
    'type' => '$field_type',
    'cardinality' => $cardinality,
    'settings' => \$storage_settings,
  ])->save();
}

if (!FieldConfig::loadByName(\$entity_type, \$bundle, \$field_name)) {
  FieldConfig::create([
    'field_name' => \$field_name,
    'entity_type' => \$entity_type,
    'bundle' => \$bundle,
    'label' => '$label',
  ])->save();
  echo 'Created $field_name on $bundle\n';
} else {
  echo '$field_name already exists on $bundle\n';
}
"
}

################################################################################
# Helper: Create an entity_reference field
#
# Usage: create_entity_ref <entity_type> <bundle> <field_name> <label> <target_type> <target_bundles_json> [cardinality]
################################################################################
create_entity_ref() {
  local entity_type="$1"
  local bundle="$2"
  local field_name="$3"
  local label="$4"
  local target_type="$5"
  local target_bundles="$6"
  local cardinality="${7:-1}"

  ddev drush php:eval "
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

\$entity_type = '$entity_type';
\$field_name = '$field_name';
\$bundle = '$bundle';

if (!FieldStorageConfig::loadByName(\$entity_type, \$field_name)) {
  FieldStorageConfig::create([
    'field_name' => \$field_name,
    'entity_type' => \$entity_type,
    'type' => 'entity_reference',
    'cardinality' => $cardinality,
    'settings' => ['target_type' => '$target_type'],
  ])->save();
}

if (!FieldConfig::loadByName(\$entity_type, \$bundle, \$field_name)) {
  \$target_bundles = json_decode('$target_bundles', TRUE);
  FieldConfig::create([
    'field_name' => \$field_name,
    'entity_type' => \$entity_type,
    'bundle' => \$bundle,
    'label' => '$label',
    'settings' => [
      'handler' => 'default',
      'handler_settings' => [
        'target_bundles' => \$target_bundles,
      ],
    ],
  ])->save();
  echo 'Created $field_name on $bundle\n';
} else {
  echo '$field_name already exists on $bundle\n';
}
"
}

################################################################################
# Helper: Create a content type
################################################################################
create_content_type() {
  local machine_name="$1"
  local human_name="$2"
  local description="$3"

  ddev drush php:eval "
\$storage = \Drupal::entityTypeManager()->getStorage('node_type');
if (!\$storage->load('$machine_name')) {
  \$type = \$storage->create([
    'type' => '$machine_name',
    'name' => '$human_name',
    'description' => '$description',
  ]);
  \$type->save();
  echo 'Created $human_name content type\n';
} else {
  echo '$human_name content type already exists\n';
}
"
}

################################################################################
# Step 1: Extend herb content type with TCM fields
################################################################################
echo -e "${BLUE}Step 1: Adding TCM fields to herb content type...${NC}"

create_field node herb field_herb2_id integer "HERB 2.0 ID"
create_field node herb field_pubchem_cid integer "PubChem CID"
create_field node herb field_smiles string_long "SMILES"
create_field node herb field_molecular_weight float "Molecular Weight"
create_field node herb field_herb_source_dbs string "Source Databases" -1
create_field node herb field_herb_latin_name string "Latin Name"
create_field node herb field_herb_pinyin_name string "Pinyin Name"

echo -e "${GREEN}Done: herb TCM fields${NC}"

################################################################################
# Step 2: Create tcm_ingredient content type
################################################################################
echo -e "${BLUE}Step 2: Creating tcm_ingredient content type...${NC}"

create_content_type tcm_ingredient "TCM Ingredient" "Chemical ingredient/compound from TCM databases"

create_field node tcm_ingredient field_ingredient_id integer "Ingredient ID"
create_field node tcm_ingredient field_pubchem_cid integer "PubChem CID"
create_field node tcm_ingredient field_cas_number string "CAS Number"
create_field node tcm_ingredient field_smiles string_long "SMILES"
create_field node tcm_ingredient field_molecular_weight float "Molecular Weight"
create_entity_ref node tcm_ingredient field_herb_sources "Herb Sources" node '{"herb":"herb"}' -1
create_field node tcm_ingredient field_source_db string "Source Database"

echo -e "${GREEN}Done: tcm_ingredient${NC}"

################################################################################
# Step 3: Create tcm_target_interaction content type
################################################################################
echo -e "${BLUE}Step 3: Creating tcm_target_interaction content type...${NC}"

create_content_type tcm_target_interaction "TCM Target Interaction" "Herb/ingredient to protein target interaction"

create_entity_ref node tcm_target_interaction field_ingredient_ref "Ingredient" node '{"tcm_ingredient":"tcm_ingredient"}'
create_entity_ref node tcm_target_interaction field_herb_ref "Herb" node '{"herb":"herb"}'
create_field node tcm_target_interaction field_target_name string "Target Name"
create_field node tcm_target_interaction field_uniprot_id string "UniProt ID"
create_field node tcm_target_interaction field_gene_name string "Gene Name"
create_field node tcm_target_interaction field_score float "Confidence Score"
create_field node tcm_target_interaction field_evidence_type string "Evidence Type" -1
create_field node tcm_target_interaction field_source_db string "Source Database"

echo -e "${GREEN}Done: tcm_target_interaction${NC}"

################################################################################
# Step 4: Create tcm_clinical_evidence content type
################################################################################
echo -e "${BLUE}Step 4: Creating tcm_clinical_evidence content type...${NC}"

create_content_type tcm_clinical_evidence "TCM Clinical Evidence" "Clinical trial or study evidence for TCM herbs/formulas"

create_field node tcm_clinical_evidence field_evidence_id string "Evidence ID"
create_entity_ref node tcm_clinical_evidence field_herb_refs "Related Herbs" node '{"herb":"herb"}' -1
create_entity_ref node tcm_clinical_evidence field_formula_ref "Related Formula" node '{"formula":"formula"}'
create_field node tcm_clinical_evidence field_study_type string "Study Type" -1
create_field node tcm_clinical_evidence field_summary text_long "Summary"
create_field node tcm_clinical_evidence field_outcome text_long "Key Outcome"
create_field node tcm_clinical_evidence field_source_url link "Source URL"
create_field node tcm_clinical_evidence field_source_db string "Source Database"

echo -e "${GREEN}Done: tcm_clinical_evidence${NC}"

################################################################################
# Step 5: Create import_log content type
################################################################################
echo -e "${BLUE}Step 5: Creating import_log content type...${NC}"

create_content_type import_log "Import Log" "Data ingestion run log"

create_field node import_log field_source_db string "Source Database"
create_field node import_log field_records_processed integer "Records Processed"
create_field node import_log field_records_created integer "Records Created"
create_field node import_log field_records_updated integer "Records Updated"
create_field node import_log field_records_skipped integer "Records Skipped"
create_field node import_log field_errors text_long "Errors"
create_field node import_log field_duration_seconds float "Duration (seconds)"

echo -e "${GREEN}Done: import_log${NC}"

################################################################################
# Step 6: Set permissions
################################################################################
echo -e "${BLUE}Step 6: Setting permissions...${NC}"

ddev drush role:perm:add anonymous 'access content' || true
ddev drush role:perm:add authenticated 'access content' || true

################################################################################
# Step 7: Clear cache
################################################################################
echo -e "${BLUE}Step 7: Clearing cache...${NC}"
ddev drush cr

echo ""
echo "============================================================"
echo -e "${GREEN}TCM CONTENT TYPES SETUP COMPLETE${NC}"
echo "============================================================"
echo ""
echo "Created/updated content types:"
echo "  - herb (added: herb2_id, pubchem_cid, smiles, molecular_weight,"
echo "          source_dbs, latin_name, pinyin_name)"
echo "  - tcm_ingredient (new)"
echo "  - tcm_target_interaction (new)"
echo "  - tcm_clinical_evidence (new)"
echo "  - import_log (new)"
echo ""
echo "JSON:API endpoints:"
echo "  - /jsonapi/node/tcm_ingredient"
echo "  - /jsonapi/node/tcm_target_interaction"
echo "  - /jsonapi/node/tcm_clinical_evidence"
echo "  - /jsonapi/node/import_log"
echo ""
echo "============================================================"
echo ""
