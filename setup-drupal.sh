#!/bin/bash

################################################################################
# Verscienta Health - Complete Platform Setup Script (Run from HOST)
#
# This script runs ALL setup from outside DDEV using `ddev drush` commands.
# Run this from your PROJECT ROOT (not inside ddev ssh).
#
# Usage:
#   cd /home/pf1/verscienta-drupal
#   chmod +x setup-drupal.sh
#   ./setup-drupal.sh
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
echo "  Verscienta Health - Complete Platform Setup"
echo "============================================================"
echo ""
echo "This script will set up your entire Drupal backend."
echo ""

# Check if DDEV is available
if ! command -v ddev &> /dev/null; then
    echo -e "${RED}Error: DDEV is not installed or not in PATH${NC}"
    exit 1
fi

# Check if we're in project root
if [ ! -f ".ddev/config.yaml" ]; then
    echo -e "${RED}Error: Not in DDEV project root${NC}"
    echo "Please run this from /home/pf1/verscienta-drupal"
    exit 1
fi

# Check if DDEV is running
echo -e "${BLUE}Checking DDEV status...${NC}"
if ! ddev status | grep -q "running"; then
    echo -e "${YELLOW}DDEV is not running. Starting DDEV...${NC}"
    ddev start
fi

# Confirm before proceeding
read -p "Continue with setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo "============================================================"
echo "PHASE 1: Installing Required Modules"
echo "============================================================"
echo ""

echo -e "${BLUE}Installing core modules...${NC}"
ddev drush en -y \
    field \
    field_ui \
    text \
    options \
    datetime \
    link \
    image \
    file \
    taxonomy \
    telephone \
    node \
    user

echo -e "${BLUE}Checking for contrib modules...${NC}"

# Check if paragraphs is available, if not install via composer
if ! ddev drush pm:list --type=module --status=enabled,disabled | grep -q paragraphs; then
    echo -e "${YELLOW}Installing contrib modules via Composer...${NC}"
    ddev composer require drupal/paragraphs drupal/field_group drupal/jsonapi_extras
fi

echo -e "${BLUE}Enabling contrib modules...${NC}"
ddev drush en -y \
    paragraphs \
    field_group \
    jsonapi \
    jsonapi_extras \
    serialization \
    rest

echo -e "${GREEN}✓ All modules installed${NC}"
echo ""

echo "============================================================"
echo "PHASE 2: Configuring CORS"
echo "============================================================"
echo ""

echo -e "${BLUE}Setting up CORS for frontend access...${NC}"

# Make directory writable and use bash -c to write file
ddev exec bash -c "chmod u+w /var/www/html/web/sites/default && cat > /var/www/html/web/sites/default/services.yml << 'EOFINNER'
parameters:
  cors.config:
    enabled: true
    allowedHeaders:
      - '*'
    allowedMethods:
      - GET
      - POST
      - PATCH
      - DELETE
      - OPTIONS
    allowedOrigins:
      - 'http://localhost:3000'
      - 'http://localhost:3001'
      - 'https://backend.ddev.site'
    exposedHeaders: false
    maxAge: 1000
    supportsCredentials: true
EOFINNER
chmod 444 /var/www/html/web/sites/default/services.yml
chmod 555 /var/www/html/web/sites/default"

echo -e "${GREEN}✓ CORS configured${NC}"
echo ""

echo "============================================================"
echo "PHASE 3: Creating Content Types"
echo "============================================================"
echo ""

################################################################################
# HERB CONTENT TYPE
################################################################################

echo -e "${BLUE}Creating Herb content type...${NC}"

ddev drush php:eval "
  \$type = \Drupal::entityTypeManager()->getStorage('node_type')->create([
    'type' => 'herb',
    'name' => 'Herb',
    'description' => 'Comprehensive medicinal herb database entry',
    'title_label' => 'Herb Name',
    'preview_mode' => DRUPAL_OPTIONAL,
    'display_submitted' => FALSE,
  ]);
  \$type->save();
  echo 'Herb content type created\n';
"

# Create basic fields
echo -e "${BLUE}Creating herb fields...${NC}"

ddev drush field:create node herb field_herb_id --field-label="Herb ID" --field-type=string --cardinality=1 --required
ddev drush field:create node herb field_scientific_name --field-label="Scientific Name" --field-type=string --cardinality=1 --required
ddev drush field:create node herb field_family --field-label="Botanical Family" --field-type=string --cardinality=1
ddev drush field:create node herb field_genus --field-label="Genus" --field-type=string --cardinality=1
ddev drush field:create node herb field_species --field-label="Species" --field-type=string --cardinality=1
ddev drush field:create node herb field_plant_type --field-label="Plant Type" --field-type=list_string --cardinality=1
ddev drush field:create node herb field_habitat --field-label="Habitat" --field-type=string_long --cardinality=1
ddev drush field:create node herb field_botanical_description --field-label="Botanical Description" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_conservation_status --field-label="Conservation Status" --field-type=list_string --cardinality=1
ddev drush field:create node herb field_conservation_notes --field-label="Conservation Notes" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_synonyms --field-label="Synonyms" --field-type=string --cardinality=-1
ddev drush field:create node herb field_native_region --field-label="Native Regions" --field-type=string --cardinality=-1
ddev drush field:create node herb field_parts_used --field-label="Parts Used" --field-type=list_string --cardinality=-1
ddev drush field:create node herb field_western_properties --field-label="Western Herbalism Properties" --field-type=string --cardinality=-1
ddev drush field:create node herb field_dosage_forms --field-label="Dosage Forms" --field-type=list_string --cardinality=-1
ddev drush field:create node herb field_commercial_availability --field-label="Commercial Availability" --field-type=string --cardinality=-1

# TCM fields
ddev drush field:create node herb field_tcm_taste --field-label="TCM Taste" --field-type=list_string --cardinality=-1
ddev drush field:create node herb field_tcm_temperature --field-label="TCM Temperature" --field-type=list_string --cardinality=1
ddev drush field:create node herb field_tcm_meridians --field-label="TCM Meridians" --field-type=list_string --cardinality=-1
ddev drush field:create node herb field_tcm_functions --field-label="TCM Functions" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_tcm_category --field-label="TCM Category" --field-type=list_string --cardinality=1

# Medicinal fields
ddev drush field:create node herb field_therapeutic_uses --field-label="Therapeutic Uses" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_pharmacological_effects --field-label="Pharmacological Effects" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_contraindications --field-label="Contraindications" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_side_effects --field-label="Side Effects" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_allergenic_potential --field-label="Allergenic Potential" --field-type=text_long --cardinality=1

# Cultural fields
ddev drush field:create node herb field_traditional_american_uses --field-label="Traditional American Uses" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_traditional_chinese_uses --field-label="Traditional Chinese Uses" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_native_american_uses --field-label="Native American Uses" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_cultural_significance --field-label="Cultural Significance" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_ethnobotanical_notes --field-label="Ethnobotanical Notes" --field-type=text_long --cardinality=1
ddev drush field:create node herb field_folklore --field-label="Folklore & Mythology" --field-type=text_long --cardinality=1

# Metadata fields
ddev drush field:create node herb field_peer_review_status --field-label="Peer Review Status" --field-type=list_string --cardinality=1
ddev drush field:create node herb field_average_rating --field-label="Average Rating" --field-type=decimal --cardinality=1
ddev drush field:create node herb field_review_count --field-label="Review Count" --field-type=integer --cardinality=1

# Image field
ddev drush field:create node herb field_herb_images --field-label="Herb Images" --field-type=image --cardinality=-1

echo -e "${GREEN}✓ Herb content type created${NC}"
echo ""

################################################################################
# OTHER CONTENT TYPES
################################################################################

echo -e "${BLUE}Creating other content types...${NC}"

# Modality
ddev drush php:eval "
  \$type = \Drupal::entityTypeManager()->getStorage('node_type')->create([
    'type' => 'modality',
    'name' => 'Modality',
    'description' => 'Holistic health modality or healing practice',
  ]);
  \$type->save();
"

ddev drush field:create node modality field_excels_at --field-label="Excels At" --field-type=string --cardinality=-1
ddev drush field:create node modality field_benefits --field-label="Benefits" --field-type=text_long --cardinality=1
ddev drush field:create node modality field_description --field-label="Description" --field-type=text_long --cardinality=1

# Condition
ddev drush php:eval "
  \$type = \Drupal::entityTypeManager()->getStorage('node_type')->create([
    'type' => 'condition',
    'name' => 'Condition',
    'description' => 'Health condition or ailment',
  ]);
  \$type->save();
"

ddev drush field:create node condition field_symptoms --field-label="Symptoms" --field-type=string --cardinality=-1
ddev drush field:create node condition field_severity --field-label="Severity" --field-type=list_string --cardinality=1
ddev drush field:create node condition field_condition_description --field-label="Description" --field-type=text_long --cardinality=1

# Practitioner
ddev drush php:eval "
  \$type = \Drupal::entityTypeManager()->getStorage('node_type')->create([
    'type' => 'practitioner',
    'name' => 'Practitioner',
    'description' => 'Holistic health practitioner',
  ]);
  \$type->save();
"

ddev drush field:create node practitioner field_practice_type --field-label="Practice Type" --field-type=list_string --cardinality=1
ddev drush field:create node practitioner field_bio --field-label="Biography" --field-type=text_long --cardinality=1
ddev drush field:create node practitioner field_address --field-label="Address" --field-type=string_long --cardinality=1
ddev drush field:create node practitioner field_latitude --field-label="Latitude" --field-type=decimal --cardinality=1
ddev drush field:create node practitioner field_longitude --field-label="Longitude" --field-type=decimal --cardinality=1

# Formula
ddev drush php:eval "
  \$type = \Drupal::entityTypeManager()->getStorage('node_type')->create([
    'type' => 'formula',
    'name' => 'Formula',
    'description' => 'Herbal formula or combination',
  ]);
  \$type->save();
"

ddev drush field:create node formula field_formula_description --field-label="Description" --field-type=text_long --cardinality=1
ddev drush field:create node formula field_preparation_instructions --field-label="Preparation Instructions" --field-type=text_long --cardinality=1

echo -e "${GREEN}✓ All content types created${NC}"
echo ""

echo "============================================================"
echo "PHASE 4: Creating Entity References"
echo "============================================================"
echo ""

ddev drush field:create node herb field_conditions_treated --field-label="Conditions Treated" --field-type=entity_reference --target-type=node --target-bundle=condition --cardinality=-1 || true
ddev drush field:create node modality field_conditions --field-label="Conditions" --field-type=entity_reference --target-type=node --target-bundle=condition --cardinality=-1 || true
ddev drush field:create node practitioner field_modalities --field-label="Modalities Practiced" --field-type=entity_reference --target-type=node --target-bundle=modality --cardinality=-1 || true

echo -e "${GREEN}✓ Entity references created${NC}"
echo ""

echo "============================================================"
echo "PHASE 5: Configuring Permissions"
echo "============================================================"
echo ""

ddev drush role:perm:add anonymous 'access content'
ddev drush role:perm:add authenticated 'access content,create herb content,edit own herb content'

echo -e "${GREEN}✓ Permissions configured${NC}"
echo ""

echo "============================================================"
echo "PHASE 6: Clearing Cache"
echo "============================================================"
echo ""

ddev drush cr

echo -e "${GREEN}✓ Cache cleared${NC}"
echo ""

echo "============================================================"
echo "PHASE 7: Sample Content (Optional)"
echo "============================================================"
echo ""
read -p "Create sample herbs, modalities, conditions, and more? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Creating sample content...${NC}"
    ddev exec "cd /var/www/html && drush php:script scripts/create-sample-content.php"
    echo -e "${GREEN}✓ Sample content created${NC}"
else
    echo -e "${YELLOW}Skipping sample content. Run later with:${NC}"
    echo "  ddev exec \"cd /var/www/html/backend && drush php:script scripts/create-sample-content.php\""
fi
echo ""

echo "============================================================"
echo -e "${GREEN}✓ SETUP COMPLETE!${NC}"
echo "============================================================"
echo ""
echo "Your Verscienta Health backend is now ready!"
echo ""
echo "Next steps:"
echo ""
echo "1. (If skipped) Create sample content:"
    echo "   ddev exec \"cd /var/www/html && drush php:script scripts/create-sample-content.php\""
echo ""
echo "2. Test JSON:API endpoints:"
echo "   curl -k https://backend.ddev.site/jsonapi/node/herb"
echo ""
echo "3. Start frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "============================================================"
echo ""
