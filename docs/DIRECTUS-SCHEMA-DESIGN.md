# Directus Schema Design: Paragraphs Replacement Strategy

> Design date: 2026-04-17
> Purpose: Map all 22 Drupal paragraph types to Directus collections, JSON fields, or flattened fields
> Companion to: [MIGRATION-AUDIT.md](./MIGRATION-AUDIT.md)

---

## Strategy Summary

Drupal Paragraphs are repeatable, typed field groups attached to nodes. Directus has no direct equivalent, but three mechanisms cover all use cases:

| Strategy | When to use | Drupal equivalent |
|----------|-------------|-------------------|
| **Flatten onto parent** | Singleton paragraphs (cardinality 1) | Paragraph with max 1 item |
| **JSON Repeater** | Simple repeatable groups, no entity refs, no cross-entity queries needed | Paragraph with text-only fields |
| **O2M Collection** | Rich data, entity references, or independent querying needed | Paragraph with many fields or entity refs |

### Tally

| Strategy | Paragraph types covered | New collections | New fields on parent |
|----------|------------------------|-----------------|---------------------|
| Flatten | 3 singletons + 1 skip | 0 | ~17 |
| JSON Repeater | 7 simple repeaters | 0 | 7 JSON fields |
| O2M Collection | 12 rich/relational | 12 | 0 (FK on child) |
| **Total** | **23 types** | **12 collections** | **~24 fields** |

---

## Group 1: Flatten Onto `herbs` Collection

These paragraph types have cardinality 1 (one instance per herb). Instead of a separate table, add prefixed fields directly to the `herbs` collection. Use Directus field grouping to keep the admin UI organized.

### toxicity_info (1 per herb)

| Directus Field | Type | Directus Interface | Notes |
|---------------|------|-------------------|-------|
| `toxicity_level` | string | Dropdown | Options: None Known, Low, Moderate, High, Severe |
| `toxicity_compounds` | string | Input | Toxic compound names |
| `toxicity_dose` | string | Input | Toxic dose threshold |
| `toxicity_symptoms` | text | WYSIWYG | Symptoms of toxicity |
| `toxicity_treatment` | text | WYSIWYG | Treatment protocol |

> Admin UI: Group these under a "Toxicity" divider/section.

### storage_info (1 per herb)

| Directus Field | Type | Directus Interface | Notes |
|---------------|------|-------------------|-------|
| `storage_conditions` | text | Textarea | General storage notes |
| `storage_temperature` | string | Input | e.g., "15-25C" |
| `storage_light` | string | Dropdown | Options: Dark, Low Light, Ambient |
| `storage_humidity` | string | Dropdown | Options: Dry, Moderate, Humid |
| `storage_shelf_life` | string | Input | e.g., "2 years" |
| `storage_degradation_signs` | text | Textarea | What to look for |

> Admin UI: Group under "Storage" section.

### sourcing_info (1 per herb)

| Directus Field | Type | Directus Interface | Notes |
|---------------|------|-------------------|-------|
| `sourcing_type` | string | Dropdown | Options: Wildcrafted, Cultivated, Both |
| `sourcing_organic` | boolean | Toggle | Organic certified |
| `sourcing_fair_trade` | boolean | Toggle | Fair trade available |
| `sourcing_sustainability` | text | Textarea | Sustainability notes |
| `sourcing_suppliers` | text | Textarea | Recommended suppliers |
| `sourcing_harvest_season` | string | Input | e.g., "Late autumn" |

> Admin UI: Group under "Sourcing" section.

### tcm_properties &mdash; SKIP

The herb already has `tcm_taste`, `tcm_temperature`, `tcm_meridians`, `tcm_functions`, `tcm_category` as direct fields. The `tcm_properties` paragraph type was a duplicate grouping mechanism. No action needed.

---

## Group 2: JSON Repeater Fields on `herbs`

These paragraph types are multi-value but contain only simple text/list fields, no entity references, and are not independently queryable. Store as JSON arrays using the [Inline Repeater Interface](https://directus.io/extensions/@directus-labs/inline-repeater-interface) extension.

Each field below is a single `json` type field on the `herbs` collection.

### `common_names` (JSON)

Replaces: `herb_common_name` paragraph

```jsonc
// Schema definition for inline repeater
{
  "fields": [
    { "field": "name", "name": "Common Name", "type": "string", "required": true },
    { "field": "language", "name": "Language", "type": "string",
      "meta": { "interface": "select-dropdown",
                "options": { "choices": [
                  {"text": "English", "value": "en"},
                  {"text": "Chinese (Pinyin)", "value": "zh-pinyin"},
                  {"text": "Chinese (Characters)", "value": "zh-hans"},
                  {"text": "Spanish", "value": "es"},
                  {"text": "Native American", "value": "na"},
                  {"text": "Other", "value": "other"}
                ]}
      }
    },
    { "field": "region", "name": "Region", "type": "string" }
  ]
}
```

Example stored value:
```json
[
  { "name": "Asian Ginseng", "language": "en", "region": "Global" },
  { "name": "Ren Shen", "language": "zh-pinyin", "region": "China" }
]
```

### `external_ids` (JSON)

Replaces: `external_id` paragraph

```jsonc
{
  "fields": [
    { "field": "database", "name": "Database", "type": "string", "required": true,
      "meta": { "interface": "select-dropdown",
                "options": { "choices": [
                  {"text": "USDA PLANTS", "value": "usda"},
                  {"text": "Chinese Pharmacopoeia", "value": "cn-pharma"},
                  {"text": "ITIS", "value": "itis"},
                  {"text": "GRIN", "value": "grin"},
                  {"text": "Catalogue of Life", "value": "col"},
                  {"text": "PubChem", "value": "pubchem"},
                  {"text": "Other", "value": "other"}
                ]}
      }
    },
    { "field": "identifier", "name": "ID", "type": "string", "required": true },
    { "field": "url", "name": "URL", "type": "string" }
  ]
}
```

### `contributors` (JSON)

Replaces: `contributor` paragraph

```jsonc
{
  "fields": [
    { "field": "name", "name": "Name", "type": "string", "required": true },
    { "field": "role", "name": "Role", "type": "string",
      "meta": { "interface": "select-dropdown",
                "options": { "choices": [
                  {"text": "Author", "value": "author"},
                  {"text": "Researcher", "value": "researcher"},
                  {"text": "Herbalist", "value": "herbalist"},
                  {"text": "Translator", "value": "translator"},
                  {"text": "Reviewer", "value": "reviewer"},
                  {"text": "Editor", "value": "editor"}
                ]}
      }
    },
    { "field": "credentials", "name": "Credentials", "type": "string" },
    { "field": "affiliation", "name": "Affiliation", "type": "string" },
    { "field": "date", "name": "Date", "type": "string" }
  ]
}
```

### `safety_warnings` (JSON)

Replaces: `safety_warning` paragraph

```jsonc
{
  "fields": [
    { "field": "type", "name": "Warning Type", "type": "string",
      "meta": { "interface": "select-dropdown",
                "options": { "choices": [
                  {"text": "Toxicity", "value": "toxicity"},
                  {"text": "Allergenic", "value": "allergenic"},
                  {"text": "Overdose", "value": "overdose"},
                  {"text": "Interaction", "value": "interaction"},
                  {"text": "Contamination", "value": "contamination"}
                ]}
      }
    },
    { "field": "severity", "name": "Severity", "type": "string",
      "meta": { "interface": "select-dropdown",
                "options": { "choices": [
                  {"text": "Low", "value": "low"},
                  {"text": "Moderate", "value": "moderate"},
                  {"text": "High", "value": "high"},
                  {"text": "Critical", "value": "critical"}
                ]}
      }
    },
    { "field": "description", "name": "Description", "type": "text" },
    { "field": "affected_population", "name": "Affected Population", "type": "string" }
  ]
}
```

### `adulteration_risks` (JSON)

Replaces: `adulteration_info` paragraph

```jsonc
{
  "fields": [
    { "field": "adulterant", "name": "Adulterant", "type": "string", "required": true },
    { "field": "reason", "name": "Reason", "type": "text" },
    { "field": "detection_method", "name": "Detection Method", "type": "text" },
    { "field": "health_risk", "name": "Health Risk", "type": "text" }
  ]
}
```

### `quality_standards` (JSON)

Replaces: `quality_standard` paragraph

```jsonc
{
  "fields": [
    { "field": "organization", "name": "Organization", "type": "string", "required": true },
    { "field": "code", "name": "Standard Code", "type": "string" },
    { "field": "specifications", "name": "Specifications", "type": "text" },
    { "field": "testing_methods", "name": "Testing Methods", "type": "text" }
  ]
}
```

### `regulatory_status` (JSON)

Replaces: `regulatory_info` paragraph

```jsonc
{
  "fields": [
    { "field": "country", "name": "Country/Region", "type": "string", "required": true },
    { "field": "status", "name": "Status", "type": "string",
      "meta": { "interface": "select-dropdown",
                "options": { "choices": [
                  {"text": "Approved", "value": "approved"},
                  {"text": "Restricted", "value": "restricted"},
                  {"text": "Banned", "value": "banned"},
                  {"text": "GRAS", "value": "gras"},
                  {"text": "Dietary Supplement", "value": "dietary_supplement"},
                  {"text": "Prescription Only", "value": "prescription"}
                ]}
      }
    },
    { "field": "classification", "name": "Classification", "type": "string" },
    { "field": "notes", "name": "Notes", "type": "text" },
    { "field": "cites_listed", "name": "CITES Listed", "type": "boolean" },
    { "field": "cites_appendix", "name": "CITES Appendix", "type": "string" }
  ]
}
```

---

## Group 3: O2M Collections (Rich/Queryable Data)

Each paragraph type below becomes its own Directus collection with a foreign key back to the parent. All include standard `id` (auto UUID or integer), `sort` (for drag-and-drop ordering), and `date_created`/`date_updated` system fields.

### Collection: `herb_clinical_studies`

Replaces: `clinical_study` paragraph
Parent FK: `herb_id` &rarr; `herbs.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | FK, hidden in detail view |
| `sort` | integer | &mdash; | No | Drag-and-drop ordering |
| `title` | string | Input | Yes | Study title |
| `authors` | string | Input | No | Author list |
| `year` | integer | Input | No | Publication year |
| `journal` | string | Input | No | Journal name |
| `study_type` | string | Dropdown | No | Options: RCT, Meta-analysis, Cohort, Case-control, In vitro, In vivo, Review, Case report |
| `sample_size` | string | Input | No | e.g., "120 participants" |
| `doi` | string | Input | No | DOI identifier |
| `url` | string | Input | No | External link |
| `summary` | text | WYSIWYG | No | Study summary |
| `conclusion` | text | Textarea | No | Key conclusion |

**Why O2M:** Queryable across herbs ("find all RCTs from 2024"), rich text, 12 fields.

**API query example:**
```
GET /items/herbs/123?fields=*,clinical_studies.*
```

### Collection: `herb_drug_interactions`

Replaces: `drug_interaction` paragraph
Parent FK: `herb_id` &rarr; `herbs.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering |
| `drug_name` | string | Input | Yes | Drug or drug class |
| `interaction_type` | string | Dropdown | No | Options: Major, Moderate, Minor |
| `severity` | string | Dropdown | No | Options: Contraindicated, Serious, Monitor, Minor |
| `mechanism` | text | WYSIWYG | No | How the interaction works |
| `evidence_level` | string | Dropdown | No | Options: Established, Probable, Suspected, Possible, Unlikely |
| `clinical_note` | text | Textarea | No | Practitioner guidance |

**Why O2M:** Critical safety data. Must be queryable: "find all herbs that interact with warfarin."

### Collection: `herb_dosages`

Replaces: `dosage_info` paragraph
Parent FK: `herb_id` &rarr; `herbs.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering |
| `form` | string | Dropdown | Yes | Options: Tincture, Tea/Infusion, Decoction, Capsule, Tablet, Powder, Extract, Essential Oil, Poultice, Salve, Syrup |
| `amount` | string | Input | No | e.g., "2-4 mL" or "500 mg" |
| `frequency` | string | Input | No | e.g., "3x daily" |
| `duration` | string | Input | No | e.g., "4-6 weeks" |
| `population` | string | Input | No | e.g., "Adults", "Children 6-12" |
| `notes` | text | WYSIWYG | No | Special instructions |

**Why O2M:** Linked to the SymPy dosage calculator; different dosage per form.

### Collection: `herb_constituents`

Replaces: `active_constituent` paragraph
Parent FK: `herb_id` &rarr; `herbs.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering |
| `name` | string | Input | Yes | Compound name |
| `chemical_class` | string | Input | No | e.g., "Ginsenosides", "Alkaloids" |
| `concentration` | string | Input | No | e.g., "2-3%" |
| `effects` | text | WYSIWYG | No | Known pharmacological effects |

**Why O2M:** Queryable across herbs ("find all herbs containing alkaloids"). Links to `tcm_ingredients` conceptually.

### Collection: `herb_preparations`

Replaces: `preparation_method` paragraph
Parent FK: `herb_id` &rarr; `herbs.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering |
| `method` | string | Dropdown | Yes | Options: Decoction, Infusion, Tincture, Powder, Poultice, Extract, Oil Infusion, Fermentation |
| `parts_used` | json | Tags | No | Which plant parts for this method |
| `instructions` | text | WYSIWYG | No | Step-by-step preparation |
| `time` | string | Input | No | e.g., "Simmer 30 minutes" |
| `yield` | string | Input | No | e.g., "500 mL" |
| `shelf_life` | string | Input | No | e.g., "6 months refrigerated" |

**Why O2M:** Rich instructions with formatting.

### Collection: `herb_historical_texts`

Replaces: `historical_text` paragraph
Parent FK: `herb_id` &rarr; `herbs.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering |
| `source_name` | string | Input | Yes | e.g., "Shennong Bencao Jing" |
| `author` | string | Input | No | Author or attributed author |
| `era` | string | Input | No | e.g., "Han Dynasty (206 BCE)" |
| `tradition` | string | Dropdown | No | Options: TCM, Western, Ayurvedic, Native American, Other |
| `excerpt` | text | WYSIWYG | No | Original text excerpt |
| `translation` | text | WYSIWYG | No | English translation |
| `url` | string | Input | No | Link to source |

**Why O2M:** Dual rich-text fields (excerpt + translation), culturally important data.

### Collection: `herb_practitioner_notes`

Replaces: `practitioner_note` paragraph
Parent FK: `herb_id` &rarr; `herbs.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering |
| `author_name` | string | Input | Yes | Practitioner name |
| `credentials` | string | Input | No | e.g., "L.Ac., DAOM" |
| `tradition` | string | Dropdown | No | Options: TCM, Western Herbalism, Naturopathy, Ayurveda, Other |
| `note` | text | WYSIWYG | Yes | Clinical observation |
| `date` | date | Datetime | No | Date of note |

**Why O2M:** Rich text notes from practitioners, might be queried by author.

### Collection: `herb_case_studies`

Replaces: `case_study` paragraph
Parent FK: `herb_id` &rarr; `herbs.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering |
| `title` | string | Input | Yes | Case title |
| `condition_id` | m2o &rarr; conditions | &mdash; | No | **Entity reference** to condition |
| `patient_profile` | text | WYSIWYG | No | Age, constitution, history |
| `presenting_complaint` | text | WYSIWYG | No | Chief complaint |
| `treatment_protocol` | text | WYSIWYG | No | What was administered |
| `duration` | string | Input | No | Treatment duration |
| `outcome` | text | WYSIWYG | No | Results |
| `practitioner` | string | Input | No | Treating practitioner |
| `date` | date | Datetime | No | Case date |

**Why O2M:** Has entity reference to `conditions`, multiple rich text fields, independently queryable.

### Collection: `herb_references`

Replaces: `reference` paragraph
Parent FK: `herb_id` &rarr; `herbs.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering |
| `type` | string | Dropdown | No | Options: Book, Journal Article, Website, Traditional Text, Database, Expert Consultation |
| `title` | string | Input | Yes | Reference title |
| `authors` | string | Input | No | Author(s) |
| `year` | integer | Input | No | Publication year |
| `publication` | string | Input | No | Journal or publisher |
| `isbn` | string | Input | No | ISBN |
| `doi` | string | Input | No | DOI |
| `url` | string | Input | No | Link |
| `pages` | string | Input | No | Page range |
| `notes` | text | Textarea | No | Citation notes |

**Why O2M:** 11 fields, bibliography management across herbs, queryable by author/year/DOI.

### Collection: `herb_images`

Replaces: `image_info` paragraph + `field_herb_images`
Parent FK: `herb_id` &rarr; `herbs.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering |
| `file` | uuid (file) | File | Yes | **Directus file reference** |
| `image_type` | string | Dropdown | No | Options: Whole Plant, Flower, Leaf, Root, Bark, Seed, Dried Form, Habitat, Preparation |
| `caption` | string | Input | No | Image caption |
| `credit` | string | Input | No | Photographer/source |
| `license` | string | Input | No | License type |

**Why O2M:** References Directus files (entity ref). Combines the old `field_herb_images` and `image_info` paragraph into one clean collection.

---

## Group 4: O2M Collections (Formula-Specific, Entity References)

### Collection: `formula_ingredients`

Replaces: `herb_ingredient` paragraph
Parent FK: `formula_id` &rarr; `formulas.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `formula_id` | m2o &rarr; formulas | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering (chief first) |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | **Which herb** |
| `quantity` | decimal | Input | Yes | Amount |
| `unit` | string | Dropdown | Yes | Options: g, mg, oz, mL, tsp, tbsp, drops, parts |
| `percentage` | decimal | Input | No | Percentage of formula (0-100) |
| `role` | string | Dropdown | No | Options: chief (jun), deputy (chen), assistant (zuo), envoy (shi) |
| `function` | string | Input | No | Role in the formula |
| `notes` | text | Textarea | No | Special instructions |

**Why O2M:** References `herbs` collection. Core junction between formulas and herbs.

### Collection: `formula_modifications`

Replaces: `formula_modification` paragraph (jia jian)
Parent FK: `formula_id` &rarr; `formulas.id`

| Field | Type | Interface | Required | Notes |
|-------|------|-----------|----------|-------|
| `id` | integer (auto) | &mdash; | Yes | PK |
| `formula_id` | m2o &rarr; formulas | &mdash; | Yes | FK |
| `sort` | integer | &mdash; | No | Ordering |
| `condition` | string | Input | Yes | When to apply (e.g., "severe qi deficiency") |
| `action` | string | Dropdown | Yes | Options: add (jia), remove (jian), increase, decrease, substitute |
| `herb_id` | m2o &rarr; herbs | &mdash; | Yes | **Which herb to modify** |
| `amount` | string | Input | No | e.g., "add 6g" or "reduce by half" |
| `note` | text | Textarea | No | Clinical reasoning |

**Why O2M:** References `herbs`. The jia-jian modification system is core TCM formula methodology.

---

## Complete Collection Map

### Primary Content Collections (from Drupal content types)

| Collection | Drupal Source | Notes |
|-----------|-------------|-------|
| `herbs` | node--herb | Main collection, ~70 fields including flattened paragraphs + JSON repeaters |
| `formulas` | node--formula | Herbal formulas |
| `conditions` | node--condition | Health conditions |
| `modalities` | node--modality | Healing practices |
| `practitioners` | node--practitioner | Practitioners with geocoding |
| `tcm_ingredients` | node--tcm_ingredient | Chemical compounds |
| `tcm_target_interactions` | node--tcm_target_interaction | Protein target links |
| `tcm_clinical_evidence` | node--tcm_clinical_evidence | Clinical trial refs |
| `import_logs` | node--import_log | Sync tracking |

### Paragraph Replacement Collections (O2M children)

| Collection | Parent | Drupal Paragraph | Fields |
|-----------|--------|-----------------|--------|
| `herb_clinical_studies` | herbs | clinical_study | 12 |
| `herb_drug_interactions` | herbs | drug_interaction | 9 |
| `herb_dosages` | herbs | dosage_info | 9 |
| `herb_constituents` | herbs | active_constituent | 7 |
| `herb_preparations` | herbs | preparation_method | 9 |
| `herb_historical_texts` | herbs | historical_text | 10 |
| `herb_practitioner_notes` | herbs | practitioner_note | 9 |
| `herb_case_studies` | herbs | case_study | 12 |
| `herb_references` | herbs | reference | 12 |
| `herb_images` | herbs | image_info + images | 8 |
| `formula_ingredients` | formulas | herb_ingredient | 10 |
| `formula_modifications` | formulas | formula_modification | 9 |

### Taxonomy Collections

| Collection | Drupal Source | Notes |
|-----------|-------------|-------|
| `herb_tags` | taxonomy: herb_tags | Hierarchical, `parent_id` self-ref |
| `tcm_categories` | taxonomy: tcm_categories | Hierarchical, `parent_id` self-ref |

### Junction Tables (M2M)

| Junction | Left | Right | Notes |
|---------|------|-------|-------|
| `herbs_conditions` | herbs | conditions | Conditions treated |
| `herbs_related_species` | herbs | herbs | Self-referencing M2M |
| `herbs_substitutes` | herbs | herbs | Substitute herbs |
| `herbs_similar_tcm` | herbs | herbs | Similar TCM herbs |
| `herbs_similar_western` | herbs | herbs | Similar Western herbs |
| `herbs_formulas` | herbs | formulas | Formulas containing herb |
| `herbs_herb_tags` | herbs | herb_tags | Tag assignments |
| `herbs_tcm_categories` | herbs | tcm_categories | Category assignments |
| `modalities_conditions` | modalities | conditions | Conditions addressed |
| `practitioners_modalities` | practitioners | modalities | Practiced modalities |
| `tcm_ingredients_herbs` | tcm_ingredients | herbs | Herb sources |
| `tcm_evidence_herbs` | tcm_clinical_evidence | herbs | Evidence-herb links |
| `formulas_conditions` | formulas | conditions | Conditions addressed |

---

## `herbs` Collection: Complete Field List

This is the fully merged field list for the main `herbs` collection, combining direct Drupal fields, flattened singleton paragraphs, and JSON repeater fields.

### Identification

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `id` | integer (auto) | &mdash; | Yes |
| `status` | string | Dropdown | Yes |
| `herb_id` | string (unique) | Input | Yes |
| `title` | string | Input | Yes |
| `slug` | string (unique) | Input | Yes |
| `scientific_name` | string | Input | Yes |
| `family` | string | Input | No |
| `genus` | string | Input | No |
| `species` | string | Input | No |
| `common_names` | **json** | Inline Repeater | No |
| `synonyms` | json (string[]) | Tags | No |

### Botanical

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `plant_type` | string | Dropdown | No |
| `native_region` | json (string[]) | Tags | No |
| `habitat` | text | Textarea | No |
| `parts_used` | json (string[]) | Tags | No |
| `botanical_description` | text | WYSIWYG | No |
| `conservation_status` | string | Dropdown | No |
| `conservation_notes` | text | WYSIWYG | No |

### TCM Properties

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `tcm_taste` | json (string[]) | Checkboxes | No |
| `tcm_temperature` | string | Dropdown | No |
| `tcm_meridians` | json (string[]) | Checkboxes | No |
| `tcm_functions` | text | WYSIWYG | No |
| `tcm_category` | string | Dropdown | No |

### Western Properties

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `western_properties` | json (string[]) | Checkboxes | No |
| `dosage_forms` | json (string[]) | Checkboxes | No |

### Medicinal

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `therapeutic_uses` | text | WYSIWYG | No |
| `pharmacological_effects` | text | WYSIWYG | No |
| `contraindications` | text | WYSIWYG | No |
| `side_effects` | text | WYSIWYG | No |
| `allergenic_potential` | text | WYSIWYG | No |

### Cultural & Historical

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `traditional_american_uses` | text | WYSIWYG | No |
| `traditional_chinese_uses` | text | WYSIWYG | No |
| `native_american_uses` | text | WYSIWYG | No |
| `cultural_significance` | text | WYSIWYG | No |
| `ethnobotanical_notes` | text | WYSIWYG | No |
| `folklore` | text | WYSIWYG | No |

### Flattened: Toxicity (from toxicity_info)

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `toxicity_level` | string | Dropdown | No |
| `toxicity_compounds` | string | Input | No |
| `toxicity_dose` | string | Input | No |
| `toxicity_symptoms` | text | WYSIWYG | No |
| `toxicity_treatment` | text | WYSIWYG | No |

### Flattened: Storage (from storage_info)

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `storage_conditions` | text | Textarea | No |
| `storage_temperature` | string | Input | No |
| `storage_light` | string | Dropdown | No |
| `storage_humidity` | string | Dropdown | No |
| `storage_shelf_life` | string | Input | No |
| `storage_degradation_signs` | text | Textarea | No |

### Flattened: Sourcing (from sourcing_info)

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `sourcing_type` | string | Dropdown | No |
| `sourcing_organic` | boolean | Toggle | No |
| `sourcing_fair_trade` | boolean | Toggle | No |
| `sourcing_sustainability` | text | Textarea | No |
| `sourcing_suppliers` | text | Textarea | No |
| `sourcing_harvest_season` | string | Input | No |

### JSON Repeaters

| Field | Type | Interface | Replaces |
|-------|------|-----------|----------|
| `common_names` | json | Inline Repeater | herb_common_name |
| `external_ids` | json | Inline Repeater | external_id |
| `contributors` | json | Inline Repeater | contributor |
| `safety_warnings` | json | Inline Repeater | safety_warning |
| `adulteration_risks` | json | Inline Repeater | adulteration_info |
| `quality_standards` | json | Inline Repeater | quality_standard |
| `regulatory_status` | json | Inline Repeater | regulatory_info |

### Sync Tracking

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `trefle_id` | integer | Input | No |
| `perenual_id` | integer | Input | No |
| `herb2_id` | integer | Input | No |
| `pubchem_cid` | integer | Input | No |
| `smiles` | text | Textarea | No |
| `molecular_weight` | float | Input | No |
| `source_databases` | json (string[]) | Tags | No |
| `latin_name` | string | Input | No |
| `pinyin_name` | string | Input | No |

### Metadata

| Field | Type | Interface | Required |
|-------|------|-----------|----------|
| `peer_review_status` | string | Dropdown | No |
| `average_rating` | decimal | Input | No |
| `review_count` | integer | Input | No |
| `version` | string | Input | No |
| `keywords` | json (string[]) | Tags | No |

### O2M Virtual Fields (aliases)

| Field | Type | Target Collection |
|-------|------|------------------|
| `clinical_studies` | o2m alias | herb_clinical_studies |
| `drug_interactions` | o2m alias | herb_drug_interactions |
| `dosages` | o2m alias | herb_dosages |
| `constituents` | o2m alias | herb_constituents |
| `preparations` | o2m alias | herb_preparations |
| `historical_texts` | o2m alias | herb_historical_texts |
| `practitioner_notes` | o2m alias | herb_practitioner_notes |
| `case_studies` | o2m alias | herb_case_studies |
| `references` | o2m alias | herb_references |
| `images` | o2m alias | herb_images |

### M2M Virtual Fields (aliases)

| Field | Type | Junction | Target |
|-------|------|---------|--------|
| `conditions_treated` | m2m alias | herbs_conditions | conditions |
| `related_species` | m2m alias | herbs_related_species | herbs |
| `substitute_herbs` | m2m alias | herbs_substitutes | herbs |
| `similar_tcm_herbs` | m2m alias | herbs_similar_tcm | herbs |
| `similar_western_herbs` | m2m alias | herbs_similar_western | herbs |
| `formulas` | m2m alias | herbs_formulas | formulas |
| `tags` | m2m alias | herbs_herb_tags | herb_tags |
| `tcm_categories` | m2m alias | herbs_tcm_categories | tcm_categories |

---

## Admin UI Organization

Use Directus field grouping to organize the herbs form into collapsible sections:

1. **Identification** &mdash; title, IDs, scientific name, common names
2. **Botanical** &mdash; family, plant type, habitat, parts used, conservation
3. **TCM Properties** &mdash; taste, temperature, meridians, functions, category
4. **Western Properties** &mdash; properties list, dosage forms
5. **Medicinal** &mdash; therapeutic uses, pharmacological effects, contraindications
6. **Safety** &mdash; toxicity (flattened), drug interactions (O2M), safety warnings (JSON), allergenic
7. **Dosage & Preparation** &mdash; dosages (O2M), preparations (O2M)
8. **Cultural & Historical** &mdash; traditional uses, historical texts (O2M), folklore
9. **Science** &mdash; constituents (O2M), clinical studies (O2M), case studies (O2M)
10. **Quality & Sourcing** &mdash; sourcing (flattened), storage (flattened), quality standards (JSON), adulteration (JSON), regulatory (JSON)
11. **Media** &mdash; images (O2M)
12. **Cross-References** &mdash; related species, substitutes, similar herbs, conditions, formulas
13. **Metadata** &mdash; sync IDs, contributors (JSON), references (O2M), peer review, version

---

## API Response Shape

A single herb request returns all data in one call:

```
GET /items/herbs/{id}?fields=
  *,
  clinical_studies.*,
  drug_interactions.*,
  dosages.*,
  constituents.*,
  preparations.*,
  historical_texts.*,
  practitioner_notes.*,
  case_studies.*, case_studies.condition_id.title,
  references.*,
  images.*, images.file.*,
  conditions_treated.conditions_id.*,
  related_species.related_herbs_id.title,
  tags.herb_tags_id.*,
  tcm_categories.tcm_categories_id.*
```

This replaces the Drupal JSON:API call with `?include=field_common_names,field_active_constituents,...` (which required resolving 19+ paragraph entity references).

**Performance advantage:** O2M data is fetched via simple JOINs. JSON repeater fields require zero JOINs (inline on the row). Drupal Paragraphs required separate entity loads for each paragraph item.

---

## Migration Script Outline

Since there is no existing content, the schema can be created via Directus Admin UI or automated with the SDK:

```javascript
// create-schema.mjs
import { createDirectus, rest, schemaApply } from '@directus/sdk';

const client = createDirectus('http://localhost:8055')
  .with(rest())
  .with(staticToken('admin-token'));

// Apply schema from snapshot
const snapshot = JSON.parse(fs.readFileSync('./schema-snapshot.json'));
await client.request(schemaApply(snapshot));
```

**Recommended workflow:**
1. Build the schema in Directus Admin UI (point and click)
2. Export snapshot: `npx directus schema snapshot ./schema-snapshot.json`
3. Commit snapshot to Git
4. Apply on staging/prod: `npx directus schema apply ./schema-snapshot.json`

---

## Comparison: Drupal Paragraphs vs. This Design

| Aspect | Drupal Paragraphs | Directus Hybrid |
|--------|-------------------|-----------------|
| **Tables created** | 22 paragraph tables + revision tables + field tables (~60+) | 12 O2M collections + 13 junction tables (25 total) |
| **Query complexity** | Entity reference resolution + paragraph entity loading | Simple JOINs or inline JSON |
| **Admin UX** | Nested entity form, can be slow | Grouped fields + inline O2M lists + repeater accordions |
| **Validation** | Per-field Drupal validation | Per-field Directus validation (O2M); none for JSON repeaters |
| **Independent queries** | Possible but awkward (paragraphs aren't first-class) | Natural for O2M collections |
| **API response** | Requires `?include=` for each paragraph type | Requires `?fields=` with nested syntax |
| **Revision tracking** | Per-paragraph revisions | Per-collection revisions (Directus activity log) |
