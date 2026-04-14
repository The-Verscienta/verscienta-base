# Comprehensive Herb Database - Drupal Content Type Setup

This guide provides the complete structure for a comprehensive herb database incorporating American herbalism and Traditional Chinese Medicine (TCM).

## Content Type: Herb (node--herb)

### Basic Information

**Title** (default field)
- Machine name: `title`
- The common primary name of the herb

**Body** (default field, formatted text)
- Machine name: `body`
- General overview and description of the herb

---

## 1. BOTANICAL INFORMATION

### Scientific Name
- **Field name:** `field_scientific_name`
- **Type:** Text (plain)
- **Required:** Yes
- **Example:** "Panax ginseng"

### Common Names (Repeatable Group)
- **Field name:** `field_common_names`
- **Type:** Paragraph type: "herb_common_name"
- **Multiple:** Unlimited

**Paragraph: herb_common_name**
- `field_name_text` - Text (plain)
- `field_language` - List (text): English, Chinese (Pinyin), Chinese (Characters), Native American, Spanish, Other
- `field_region` - Text (plain, optional)

### Family
- **Field name:** `field_family`
- **Type:** Text (plain)
- **Example:** "Araliaceae"

### Genus
- **Field name:** `field_genus`
- **Type:** Text (plain)

### Species
- **Field name:** `field_species`
- **Type:** Text (plain)

### Synonyms
- **Field name:** `field_synonyms`
- **Type:** Text (plain)
- **Multiple:** Unlimited
- **Description:** Historical or alternative scientific names

### Plant Type
- **Field name:** `field_plant_type`
- **Type:** List (text)
- **Options:** Herb, Shrub, Tree, Vine, Grass, Fern, Moss, Fungus, Lichen

### Native Region
- **Field name:** `field_native_region`
- **Type:** Text (plain)
- **Multiple:** Unlimited
- **Example:** "East Asia", "North America"

### Habitat
- **Field name:** `field_habitat`
- **Type:** Text (plain, long)
- **Description:** Preferred growing conditions

### Parts Used
- **Field name:** `field_parts_used`
- **Type:** List (text)
- **Multiple:** Yes
- **Options:** Root, Leaf, Stem, Flower, Seed, Bark, Fruit, Whole Plant, Rhizome, Bulb, Resin

### Botanical Description
- **Field name:** `field_botanical_description`
- **Type:** Text (formatted, long)
- **Description:** Detailed physical characteristics

### Cultivation Details
- **Field name:** `field_cultivation_details`
- **Type:** Paragraph type: "cultivation_info"

**Paragraph: cultivation_info**
- `field_soil_type` - Text (plain)
- `field_climate_zone` - Text (plain)
- `field_sunlight_needs` - List: Full Sun, Partial Shade, Full Shade
- `field_water_needs` - List: Low, Moderate, High
- `field_hardiness_zone` - Text (plain)
- `field_propagation_method` - Text (plain, long)
- `field_growing_season` - Text (plain)

### Conservation Status
- **Field name:** `field_conservation_status`
- **Type:** List (text)
- **Options:**
  - Least Concern
  - Near Threatened
  - Vulnerable
  - Endangered
  - Critically Endangered
  - Extinct in Wild
  - Not Evaluated
  - Data Deficient

### Conservation Notes
- **Field name:** `field_conservation_notes`
- **Type:** Text (formatted, long)
- **Description:** IUCN details, overharvesting concerns, etc.

---

## 2. MEDICINAL INFORMATION

### Therapeutic Uses
- **Field name:** `field_therapeutic_uses`
- **Type:** Text (formatted, long)
- **Description:** Primary medicinal applications

### TCM Properties (Paragraph)
- **Field name:** `field_tcm_properties`
- **Type:** Paragraph type: "tcm_properties"

**Paragraph: tcm_properties**
- `field_tcm_taste` - List (text, multiple): Sweet, Bitter, Sour, Pungent, Salty, Bland
- `field_tcm_temperature` - List (text): Hot, Warm, Neutral, Cool, Cold
- `field_tcm_meridians` - List (text, multiple): Lung, Large Intestine, Stomach, Spleen, Heart, Small Intestine, Bladder, Kidney, Pericardium, Triple Burner, Gallbladder, Liver
- `field_tcm_functions` - Text (formatted, long)
- `field_tcm_category` - Text (plain) - e.g., "Tonifying Herbs - Qi Tonics"

### Western Herbalism Properties
- **Field name:** `field_western_properties`
- **Type:** List (text)
- **Multiple:** Yes
- **Options:**
  - Adaptogen
  - Alterative
  - Analgesic
  - Anti-inflammatory
  - Antimicrobial
  - Antioxidant
  - Antispasmodic
  - Astringent
  - Bitter
  - Carminative
  - Demulcent
  - Diaphoretic
  - Diuretic
  - Expectorant
  - Hepatic
  - Nervine
  - Sedative
  - Stimulant
  - Tonic
  - Vulnerary

### Active Constituents (Repeatable)
- **Field name:** `field_active_constituents`
- **Type:** Paragraph type: "active_constituent"
- **Multiple:** Unlimited

**Paragraph: active_constituent**
- `field_compound_name` - Text (plain)
- `field_compound_class` - Text (plain) - e.g., "Ginsenosides", "Alkaloids"
- `field_compound_percentage` - Number (decimal, optional)
- `field_compound_effects` - Text (plain, long)

### Pharmacological Effects
- **Field name:** `field_pharmacological_effects`
- **Type:** Text (formatted, long)

### Clinical Studies (Repeatable)
- **Field name:** `field_clinical_studies`
- **Type:** Paragraph type: "clinical_study"
- **Multiple:** Unlimited

**Paragraph: clinical_study**
- `field_study_title` - Text (plain)
- `field_study_year` - Number (integer)
- `field_study_summary` - Text (formatted, long)
- `field_study_url` - Link
- `field_study_doi` - Text (plain)
- `field_study_conclusion` - Text (plain, long)

### Dosage Forms
- **Field name:** `field_dosage_forms`
- **Type:** List (text)
- **Multiple:** Yes
- **Options:** Tincture, Tea/Infusion, Decoction, Capsule, Tablet, Powder, Extract, Essential Oil, Poultice, Salve, Syrup, Compress

### Recommended Dosage (Repeatable)
- **Field name:** `field_recommended_dosage`
- **Type:** Paragraph type: "dosage_info"
- **Multiple:** Unlimited

**Paragraph: dosage_info**
- `field_dosage_form` - List (text) - matches dosage forms above
- `field_dosage_amount` - Text (plain)
- `field_dosage_frequency` - Text (plain)
- `field_dosage_duration` - Text (plain)
- `field_dosage_population` - Text (plain) - e.g., "Adults", "Children 6-12"
- `field_dosage_notes` - Text (plain, long)

### Contraindications
- **Field name:** `field_contraindications`
- **Type:** Text (formatted, long)

### Drug Interactions
- **Field name:** `field_drug_interactions`
- **Type:** Paragraph type: "drug_interaction"
- **Multiple:** Unlimited

**Paragraph: drug_interaction**
- `field_drug_name` - Text (plain)
- `field_interaction_type` - List: Major, Moderate, Minor
- `field_interaction_description` - Text (plain, long)
- `field_interaction_mechanism` - Text (plain, long)

### Side Effects
- **Field name:** `field_side_effects`
- **Type:** Text (formatted, long)

### Toxicity Information
- **Field name:** `field_toxicity_info`
- **Type:** Paragraph type: "toxicity_info"

**Paragraph: toxicity_info**
- `field_toxicity_level` - List: None Known, Low, Moderate, High, Severe
- `field_toxic_compounds` - Text (plain)
- `field_toxic_dose` - Text (plain)
- `field_toxic_symptoms` - Text (formatted, long)
- `field_toxic_treatment` - Text (formatted, long)

---

## 3. CULTURAL AND HISTORICAL INFORMATION

### Traditional American Uses
- **Field name:** `field_traditional_american_uses`
- **Type:** Text (formatted, long)

### Traditional Chinese Uses
- **Field name:** `field_traditional_chinese_uses`
- **Type:** Text (formatted, long)

### Native American Uses
- **Field name:** `field_native_american_uses`
- **Type:** Text (formatted, long)

### Cultural Significance
- **Field name:** `field_cultural_significance`
- **Type:** Text (formatted, long)

### Historical Texts (Repeatable)
- **Field name:** `field_historical_texts`
- **Type:** Paragraph type: "historical_text"
- **Multiple:** Unlimited

**Paragraph: historical_text**
- `field_text_name` - Text (plain) - e.g., "Shennong Bencao Jing"
- `field_text_author` - Text (plain)
- `field_text_year` - Number (integer)
- `field_text_tradition` - List: TCM, Western, Ayurvedic, Native American, Other
- `field_text_reference` - Text (formatted, long)
- `field_text_url` - Link (optional)

### Ethnobotanical Notes
- **Field name:** `field_ethnobotanical_notes`
- **Type:** Text (formatted, long)

### Folklore and Mythology
- **Field name:** `field_folklore`
- **Type:** Text (formatted, long)

---

## 4. PRACTICAL INFORMATION

### Preparation Methods (Repeatable)
- **Field name:** `field_preparation_methods`
- **Type:** Paragraph type: "preparation_method"
- **Multiple:** Unlimited

**Paragraph: preparation_method**
- `field_method_type` - List: Decoction, Infusion, Tincture, Powder, Poultice, Extract, Oil Infusion, Fermentation
- `field_method_parts` - List (multiple) - matches parts used
- `field_method_instructions` - Text (formatted, long)
- `field_method_time` - Text (plain)
- `field_method_yield` - Text (plain)
- `field_method_storage` - Text (plain, long)

### Storage Requirements
- **Field name:** `field_storage_requirements`
- **Type:** Paragraph type: "storage_info"

**Paragraph: storage_info**
- `field_storage_conditions` - Text (plain, long)
- `field_storage_temperature` - Text (plain)
- `field_storage_light` - List: Dark, Low Light, Ambient
- `field_storage_humidity` - List: Dry, Moderate, Humid
- `field_shelf_life` - Text (plain)
- `field_degradation_signs` - Text (plain, long)

### Sourcing Information
- **Field name:** `field_sourcing_info`
- **Type:** Paragraph type: "sourcing_info"

**Paragraph: sourcing_info**
- `field_sourcing_type` - List: Wildcrafted, Cultivated, Both
- `field_organic_available` - Boolean
- `field_fair_trade_available` - Boolean
- `field_sustainable_harvest` - Text (plain, long)
- `field_recommended_suppliers` - Text (plain, long)
- `field_harvest_season` - Text (plain)

### Commercial Availability
- **Field name:** `field_commercial_availability`
- **Type:** List (text)
- **Multiple:** Yes
- **Options:** Dried Herb, Powder, Tincture, Extract, Capsules, Tablets, Essential Oil, Fresh, Seeds, Live Plant

### Regulatory Status (Repeatable)
- **Field name:** `field_regulatory_status`
- **Type:** Paragraph type: "regulatory_info"
- **Multiple:** Unlimited

**Paragraph: regulatory_info**
- `field_reg_country` - Text (plain)
- `field_reg_status` - List: Approved, Restricted, Banned, GRAS, Dietary Supplement, Prescription Only
- `field_reg_classification` - Text (plain)
- `field_reg_notes` - Text (plain, long)
- `field_cites_status` - Boolean
- `field_cites_appendix` - List: Appendix I, Appendix II, Appendix III, N/A

---

## 5. VISUAL AND MULTIMEDIA DATA

### Images
- **Field name:** `field_images`
- **Type:** Image (media reference)
- **Multiple:** Unlimited
- **Description:** High-quality photos

### Image Descriptions (linked to images)
- **Field name:** `field_image_descriptions`
- **Type:** Paragraph type: "image_info"
- **Multiple:** Unlimited

**Paragraph: image_info**
- `field_image_reference` - Entity reference (to media)
- `field_image_type` - List: Whole Plant, Flower, Leaf, Root, Bark, Seed, Dried Form, Habitat, Preparation
- `field_image_credit` - Text (plain)
- `field_image_license` - Text (plain)

### Videos
- **Field name:** `field_videos`
- **Type:** Media reference (video)
- **Multiple:** Unlimited

### Video Links
- **Field name:** `field_video_links`
- **Type:** Link
- **Multiple:** Unlimited

### Botanical Illustrations
- **Field name:** `field_botanical_illustrations`
- **Type:** Image (media reference)
- **Multiple:** Unlimited

### Distribution Maps
- **Field name:** `field_distribution_maps`
- **Type:** Image (media reference)
- **Multiple:** Unlimited

### Geographic Coordinates
- **Field name:** `field_distribution_coordinates`
- **Type:** Geofield (requires Geofield module)
- **Multiple:** Yes
- **Description:** Native range points

---

## 6. SAFETY AND QUALITY CONTROL

### Quality Standards
- **Field name:** `field_quality_standards`
- **Type:** Paragraph type: "quality_standard"
- **Multiple:** Unlimited

**Paragraph: quality_standard**
- `field_standard_org` - Text (plain) - e.g., "USP", "Chinese Pharmacopoeia"
- `field_standard_code` - Text (plain)
- `field_standard_specs` - Text (formatted, long)
- `field_testing_methods` - Text (plain, long)

### Contaminant Testing
- **Field name:** `field_contaminant_testing`
- **Type:** Text (formatted, long)
- **Description:** Heavy metals, pesticides, microbial testing

### Adulteration Risks
- **Field name:** `field_adulteration_risks`
- **Type:** Paragraph type: "adulteration_info"
- **Multiple:** Unlimited

**Paragraph: adulteration_info**
- `field_adulterant_name` - Text (plain)
- `field_adulterant_reason` - Text (plain, long)
- `field_identification_method` - Text (plain, long)
- `field_risks` - Text (plain, long)

### Safety Warnings
- **Field name:** `field_safety_warnings`
- **Type:** Paragraph type: "safety_warning"
- **Multiple:** Unlimited

**Paragraph: safety_warning**
- `field_warning_type` - List: Toxicity, Allergenic, Overdose, Interaction, Contamination
- `field_warning_severity` - List: Low, Moderate, High, Critical
- `field_warning_description` - Text (formatted, long)
- `field_affected_population` - Text (plain)

### Allergenic Potential
- **Field name:** `field_allergenic_potential`
- **Type:** List (text)
- **Options:** None Known, Low, Moderate, High

### Allergenic Notes
- **Field name:** `field_allergenic_notes`
- **Type:** Text (plain, long)

---

## 7. CROSS-REFERENCING AND TAXONOMY

### Related Species
- **Field name:** `field_related_species`
- **Type:** Entity reference (to other herb nodes)
- **Multiple:** Unlimited

### Substitute Herbs
- **Field name:** `field_substitute_herbs`
- **Type:** Entity reference (to other herb nodes)
- **Multiple:** Unlimited

### Comparison Notes
- **Field name:** `field_comparison_notes`
- **Type:** Text (formatted, long)

### Similar TCM Herbs
- **Field name:** `field_similar_tcm_herbs`
- **Type:** Entity reference (to other herb nodes)
- **Multiple:** Unlimited

### Similar Western Herbs
- **Field name:** `field_similar_western_herbs`
- **Type:** Entity reference (to other herb nodes)
- **Multiple:** Unlimited

### Conditions Treated
- **Field name:** `field_conditions_treated`
- **Type:** Entity reference (to condition nodes)
- **Multiple:** Unlimited

### Formulas Using This Herb
- **Field name:** `field_formulas`
- **Type:** Entity reference (to formula nodes)
- **Multiple:** Unlimited
- **Note:** Reverse relationship from formula ingredients

---

## 8. USER AND PRACTITIONER DATA

### Practitioner Notes (Repeatable)
- **Field name:** `field_practitioner_notes`
- **Type:** Paragraph type: "practitioner_note"
- **Multiple:** Unlimited

**Paragraph: practitioner_note**
- `field_practitioner_name` - Text (plain)
- `field_practitioner_credentials` - Text (plain)
- `field_practitioner_tradition` - List: TCM, Western Herbalism, Naturopathy, Ayurveda, Other
- `field_practitioner_note_text` - Text (formatted, long)
- `field_note_date` - Date

### Case Studies (Repeatable)
- **Field name:** `field_case_studies`
- **Type:** Paragraph type: "case_study"
- **Multiple:** Unlimited

**Paragraph: case_study**
- `field_case_title` - Text (plain)
- `field_case_condition` - Entity reference (to condition)
- `field_case_protocol` - Text (formatted, long)
- `field_case_duration` - Text (plain)
- `field_case_outcome` - Text (formatted, long)
- `field_case_practitioner` - Text (plain)
- `field_case_date` - Date

### User Reviews
- **Field name:** `field_user_reviews`
- **Type:** Entity reference (to review nodes)
- **Multiple:** Unlimited

### Average Rating
- **Field name:** `field_average_rating`
- **Type:** Number (decimal)
- **Calculated:** Auto-calculated from reviews

### Review Count
- **Field name:** `field_review_count`
- **Type:** Number (integer)
- **Calculated:** Auto-calculated

---

## 9. SEARCH AND ACCESSIBILITY FEATURES

### Primary Search Tags
- **Field name:** `field_search_tags`
- **Type:** Entity reference (to taxonomy: herb_tags)
- **Multiple:** Unlimited

**Taxonomy: herb_tags**
- Hierarchical structure:
  - By Action (Adaptogen, Anti-inflammatory, etc.)
  - By Condition (Anxiety, Digestive Issues, etc.)
  - By Tradition (TCM, Western, Native American)
  - By Part Used (Root, Leaf, etc.)
  - By Form (Tea, Tincture, etc.)

### TCM Category Tags
- **Field name:** `field_tcm_category_tags`
- **Type:** Entity reference (to taxonomy: tcm_categories)
- **Multiple:** Unlimited

**Taxonomy: tcm_categories**
- Releasing the Exterior
- Clearing Heat
- Draining Downward
- Wind-Damp Dispelling
- Transforming Dampness
- Transforming Phlegm
- Relieving Food Stagnation
- Regulating Qi
- Regulating Blood
- Warming Interior
- Tonifying
- Astringent
- Calming Spirit
- Extinguishing Wind
- Opening Orifices
- External Applications

### Keywords
- **Field name:** `field_keywords`
- **Type:** Text (plain)
- **Multiple:** Unlimited

### Language Versions
- **Field name:** Translation-enabled content type
- **Drupal Module:** Content Translation
- **Languages:** English, Simplified Chinese, Traditional Chinese

### Accessibility Notes
- **Field name:** `field_accessibility_notes`
- **Type:** Text (plain, long)
- **Description:** Special notes for screen readers

---

## 10. METADATA AND DATABASE MANAGEMENT

### Unique Identifier
- **Field name:** `field_herb_id`
- **Type:** Text (plain)
- **Unique:** Yes
- **Format:** H-[4 digit number] (e.g., H-0001)
- **Auto-generated:** Via custom module

### Alternative IDs (Repeatable)
- **Field name:** `field_alternative_ids`
- **Type:** Paragraph type: "external_id"
- **Multiple:** Unlimited

**Paragraph: external_id**
- `field_id_system` - List: USDA PLANTS, Chinese Pharmacopoeia, ITIS, GRIN, COL, Other
- `field_id_value` - Text (plain)
- `field_id_url` - Link (optional)

### Data Source
- **Field name:** `field_data_source`
- **Type:** Text (plain, long)

### Contributors (Repeatable)
- **Field name:** `field_contributors`
- **Type:** Paragraph type: "contributor"
- **Multiple:** Unlimited

**Paragraph: contributor**
- `field_contributor_name` - Text (plain)
- `field_contributor_role` - List: Author, Researcher, Herbalist, Translator, Reviewer, Editor
- `field_contributor_credentials` - Text (plain)
- `field_contributor_affiliation` - Text (plain)
- `field_contribution_date` - Date

### References (Repeatable)
- **Field name:** `field_references`
- **Type:** Paragraph type: "reference"
- **Multiple:** Unlimited

**Paragraph: reference**
- `field_ref_type` - List: Book, Journal Article, Website, Traditional Text, Database, Expert Consultation
- `field_ref_title` - Text (plain)
- `field_ref_author` - Text (plain)
- `field_ref_year` - Number (integer)
- `field_ref_publisher` - Text (plain)
- `field_ref_isbn` - Text (plain)
- `field_ref_doi` - Text (plain)
- `field_ref_url` - Link
- `field_ref_pages` - Text (plain)
- `field_ref_notes` - Text (plain, long)

### Last Updated
- **Field name:** `changed` (default Drupal field)
- **Type:** Timestamp
- **Auto-updated:** Yes

### Version Number
- **Field name:** `field_version`
- **Type:** Text (plain)
- **Format:** Semantic versioning (e.g., 1.0.0)

### Version History
- **Field name:** Use Drupal Revisions
- **Enable:** Node revision tracking
- **Log:** Revision log messages required

### Peer Review Status
- **Field name:** `field_peer_review_status`
- **Type:** List (text)
- **Options:**
  - Draft
  - In Review
  - Peer Reviewed
  - Expert Verified
  - Published
  - Needs Update

### Peer Reviewers
- **Field name:** `field_peer_reviewers`
- **Type:** Entity reference (to user accounts)
- **Multiple:** Unlimited

### Review Date
- **Field name:** `field_review_date`
- **Type:** Date

### Next Review Due
- **Field name:** `field_next_review_due`
- **Type:** Date

---

## ADDITIONAL FIELD GROUPS

For better content editing experience, organize fields into collapsible groups:

1. **Botanical Information**
2. **TCM Properties**
3. **Western Medicine Properties**
4. **Safety Information**
5. **Cultural & Historical**
6. **Practical Use**
7. **Quality & Sourcing**
8. **Multimedia**
9. **Cross-References**
10. **Metadata & Administration**

---

## REQUIRED DRUPAL MODULES

```bash
# Core fields
composer require drupal/paragraphs
composer require drupal/field_group
composer require drupal/geofield

# Enhanced functionality
composer require drupal/entity_reference_revisions
composer require drupal/inline_entity_form
composer require drupal/media_library_form_element

# Search and taxonomy
composer require drupal/facets
composer require drupal/search_api
composer require drupal/taxonomy_access_fix

# Multimedia
composer require drupal/media
composer require drupal/focal_point

# Translation
composer require drupal/content_translation

# Enable modules
drush en paragraphs field_group geofield entity_reference_revisions inline_entity_form media_library_form_element facets search_api content_translation -y
```

---

## JSON:API STRUCTURE

Example API endpoint response structure:

```json
{
  "data": {
    "type": "node--herb",
    "id": "uuid-here",
    "attributes": {
      "drupal_internal__nid": 1,
      "title": "Asian Ginseng",
      "field_herb_id": "H-0001",
      "field_scientific_name": "Panax ginseng",
      "field_family": "Araliaceae",
      "field_genus": "Panax",
      "field_species": "ginseng",
      "field_plant_type": "herb",
      "field_native_region": ["East Asia", "Korea", "Northeast China"],
      "field_parts_used": ["root"],
      "field_conservation_status": "endangered",
      "field_therapeutic_uses": "...",
      "field_contraindications": "...",
      "field_peer_review_status": "expert_verified",
      "changed": "2025-01-15T10:30:00Z"
    },
    "relationships": {
      "field_common_names": {
        "data": [
          { "type": "paragraph--herb_common_name", "id": "uuid-1" }
        ]
      },
      "field_tcm_properties": {
        "data": { "type": "paragraph--tcm_properties", "id": "uuid-2" }
      },
      "field_active_constituents": {
        "data": [
          { "type": "paragraph--active_constituent", "id": "uuid-3" }
        ]
      },
      "field_related_species": {
        "data": [
          { "type": "node--herb", "id": "uuid-american-ginseng" }
        ]
      },
      "field_conditions_treated": {
        "data": [
          { "type": "node--condition", "id": "uuid-condition" }
        ]
      },
      "field_images": {
        "data": [
          { "type": "media--image", "id": "uuid-image" }
        ]
      }
    }
  },
  "included": [...]
}
```

---

## ALGOLIA SEARCH INTEGRATION

Create searchable attributes for comprehensive herb search:

```javascript
// Algolia index configuration
{
  searchableAttributes: [
    'title',
    'field_scientific_name',
    'field_common_names',
    'field_family',
    'field_therapeutic_uses',
    'field_tcm_functions',
    'field_keywords',
    'field_western_properties',
    'field_active_constituents'
  ],
  attributesForFaceting: [
    'field_plant_type',
    'field_parts_used',
    'field_tcm_temperature',
    'field_tcm_taste',
    'field_tcm_meridians',
    'field_western_properties',
    'field_native_region',
    'field_conservation_status',
    'field_tcm_category_tags',
    'field_dosage_forms',
    'field_peer_review_status'
  ],
  customRanking: [
    'desc(field_review_count)',
    'desc(field_average_rating)',
    'desc(field_peer_review_status)'
  ]
}
```

---

## PERMISSIONS AND ROLES

### Recommended Roles:

**Anonymous User:**
- View published herbs
- View images and multimedia
- No access to unpublished/draft content

**Authenticated User:**
- View published herbs
- Submit reviews
- Save favorites

**Herbalist:**
- Create herb entries
- Edit own herb entries
- Add practitioner notes
- Submit for peer review

**TCM Practitioner:**
- Create herb entries
- Edit own herb entries
- Add TCM-specific data
- Submit for peer review

**Peer Reviewer:**
- Review submitted herbs
- Add reviewer comments
- Approve/reject submissions
- Cannot publish

**Editor:**
- Edit all herb entries
- Publish approved content
- Manage multimedia
- Manage taxonomy

**Administrator:**
- Full access to all content
- Manage structure and fields
- Manage users and permissions

---

## DATA IMPORT/EXPORT

### CSV Import Template

Create a CSV import template with these headers (simplified for bulk import):

```csv
herb_id,title,scientific_name,family,genus,species,common_names,plant_type,native_region,parts_used,therapeutic_uses,tcm_taste,tcm_temperature,tcm_meridians,western_properties,contraindications,dosage_forms
H-0001,Asian Ginseng,Panax ginseng,Araliaceae,Panax,ginseng,"Korean Ginseng|Rénshēn 人参",herb,"East Asia|Korea",root,"Adaptogenic tonic...",sweet|slightly bitter,warm,"Lung|Spleen|Heart","adaptogen|tonic","Pregnancy|Hypertension","tincture|decoction|capsule"
```

Use **Feeds** or **Migrate** module for import.

---

## CONTENT MODERATION WORKFLOW

Implement a review workflow:

1. **Draft** → Author creates entry
2. **In Review** → Submitted for peer review
3. **Needs Revision** → Reviewer requests changes
4. **Peer Reviewed** → Technical review approved
5. **Expert Verified** → Expert herbalist/TCM practitioner verified
6. **Published** → Live on site

Use **Workflows** module (Drupal core).

---

This comprehensive structure creates a world-class herb database integrating American and Chinese herbal traditions with modern scientific research, safety data, and cultural context.
