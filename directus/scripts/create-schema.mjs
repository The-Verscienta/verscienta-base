/**
 * Verscienta Directus Schema Creator
 *
 * Creates all collections, fields, and relationships defined in
 * docs/DIRECTUS-SCHEMA-DESIGN.md programmatically via the Directus SDK.
 *
 * Usage:
 *   1. Start Directus: docker compose up -d
 *   2. Run: node scripts/create-schema.mjs
 *
 * Prerequisites:
 *   npm install @directus/sdk
 *
 * Environment:
 *   DIRECTUS_URL   (default: http://localhost:8055)
 *   DIRECTUS_TOKEN (admin static token — generate in Directus admin)
 */

import {
  createDirectus,
  rest,
  staticToken,
  createCollection,
  createField,
  createRelation,
} from "@directus/sdk";

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error(
    "Error: DIRECTUS_TOKEN is required. Generate an admin static token in Directus settings."
  );
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

// ─── Helpers ────────────────────────────────────────────────────────────────

async function safeCreateCollection(collection) {
  try {
    await client.request(createCollection(collection));
    console.log(`  + Collection: ${collection.collection}`);
  } catch (e) {
    if (e?.errors?.[0]?.extensions?.code === "RECORD_NOT_UNIQUE") {
      console.log(`  = Collection: ${collection.collection} (exists)`);
    } else {
      console.error(
        `  ! Collection ${collection.collection}: ${e?.errors?.[0]?.message || e.message}`
      );
    }
  }
}

async function safeCreateField(collectionName, field) {
  try {
    await client.request(createField(collectionName, field));
    console.log(`    + Field: ${collectionName}.${field.field}`);
  } catch (e) {
    if (
      e?.errors?.[0]?.extensions?.code === "RECORD_NOT_UNIQUE" ||
      e?.errors?.[0]?.message?.includes("already exists")
    ) {
      console.log(`    = Field: ${collectionName}.${field.field} (exists)`);
    } else {
      console.error(
        `    ! Field ${collectionName}.${field.field}: ${e?.errors?.[0]?.message || e.message}`
      );
    }
  }
}

async function safeCreateRelation(relation) {
  try {
    await client.request(createRelation(relation));
    console.log(
      `    + Relation: ${relation.collection}.${relation.field} -> ${relation.related_collection}`
    );
  } catch (e) {
    if (
      e?.errors?.[0]?.extensions?.code === "RECORD_NOT_UNIQUE" ||
      e?.errors?.[0]?.message?.includes("already exists")
    ) {
      console.log(
        `    = Relation: ${relation.collection}.${relation.field} (exists)`
      );
    } else {
      console.error(
        `    ! Relation ${relation.collection}.${relation.field}: ${e?.errors?.[0]?.message || e.message}`
      );
    }
  }
}

// Dropdown choices helper
function choices(items) {
  return items.map((item) =>
    typeof item === "string" ? { text: item, value: item.toLowerCase().replace(/[\s/]+/g, "_") } : item
  );
}

// ─── 1. Taxonomy Collections ────────────────────────────────────────────────

async function createTaxonomyCollections() {
  console.log("\n=== Taxonomy Collections ===");

  // herb_tags (hierarchical)
  await safeCreateCollection({
    collection: "herb_tags",
    meta: { icon: "sell", note: "Hierarchical tags for herbs" },
    schema: {},
  });
  await safeCreateField("herb_tags", {
    field: "name",
    type: "string",
    meta: { interface: "input", required: true, width: "half" },
    schema: { is_nullable: false },
  });
  await safeCreateField("herb_tags", {
    field: "slug",
    type: "string",
    meta: { interface: "input", width: "half" },
    schema: { is_unique: true },
  });
  await safeCreateField("herb_tags", {
    field: "parent_id",
    type: "integer",
    meta: { interface: "select-dropdown-m2o", width: "half", note: "Parent tag for hierarchy" },
    schema: { is_nullable: true },
  });
  await safeCreateRelation({
    collection: "herb_tags",
    field: "parent_id",
    related_collection: "herb_tags",
    meta: { one_field: "children" },
    schema: { on_delete: "SET NULL" },
  });

  // tcm_categories (hierarchical)
  await safeCreateCollection({
    collection: "tcm_categories",
    meta: { icon: "category", note: "TCM classification system" },
    schema: {},
  });
  await safeCreateField("tcm_categories", {
    field: "name",
    type: "string",
    meta: { interface: "input", required: true, width: "half" },
    schema: { is_nullable: false },
  });
  await safeCreateField("tcm_categories", {
    field: "slug",
    type: "string",
    meta: { interface: "input", width: "half" },
    schema: { is_unique: true },
  });
  await safeCreateField("tcm_categories", {
    field: "parent_id",
    type: "integer",
    meta: { interface: "select-dropdown-m2o", width: "half" },
    schema: { is_nullable: true },
  });
  await safeCreateRelation({
    collection: "tcm_categories",
    field: "parent_id",
    related_collection: "tcm_categories",
    meta: { one_field: "children" },
    schema: { on_delete: "SET NULL" },
  });
}

// ─── 2. Primary Collections ─────────────────────────────────────────────────

async function createPrimaryCollections() {
  console.log("\n=== Primary Collections ===");

  // ── herbs ─────────────────────────────────────────────────────────────────
  await safeCreateCollection({
    collection: "herbs",
    meta: {
      icon: "eco",
      note: "Comprehensive medicinal herb database",
      archive_field: "status",
      archive_value: "archived",
      unarchive_value: "draft",
      sort_field: "sort",
    },
    schema: {},
  });

  // Status & sort
  await safeCreateField("herbs", { field: "status", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Published", "Draft", "Archived"]) }, width: "half", default_value: "draft" }, schema: { default_value: "draft" } });
  await safeCreateField("herbs", { field: "sort", type: "integer", meta: { interface: "input", hidden: true }, schema: {} });

  // Identification
  await safeCreateField("herbs", { field: "herb_id", type: "string", meta: { interface: "input", required: true, width: "half", note: "Unique ID (e.g., H-0001)" }, schema: { is_unique: true, is_nullable: false } });
  await safeCreateField("herbs", { field: "title", type: "string", meta: { interface: "input", required: true, width: "half" }, schema: { is_nullable: false } });
  await safeCreateField("herbs", { field: "slug", type: "string", meta: { interface: "input", width: "half" }, schema: { is_unique: true } });
  await safeCreateField("herbs", { field: "scientific_name", type: "string", meta: { interface: "input", required: true, width: "half" }, schema: { is_nullable: false } });
  await safeCreateField("herbs", { field: "family", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "genus", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "species", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "synonyms", type: "json", meta: { interface: "tags", width: "full" }, schema: {} });

  // Botanical
  await safeCreateField("herbs", { field: "plant_type", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Herb", "Shrub", "Tree", "Vine", "Grass", "Fern", "Moss", "Fungus", "Lichen"]) }, width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "native_region", type: "json", meta: { interface: "tags", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "habitat", type: "text", meta: { interface: "input-multiline", width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "parts_used", type: "json", meta: { interface: "select-multiple-checkbox", options: { choices: choices(["Root", "Leaf", "Stem", "Flower", "Seed", "Bark", "Fruit", "Whole Plant", "Rhizome", "Bulb", "Resin"]) }, width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "botanical_description", type: "text", meta: { interface: "input-rich-text-html", width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "conservation_status", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Least Concern", "Near Threatened", "Vulnerable", "Endangered", "Critically Endangered", "Extinct in Wild", "Not Evaluated", "Data Deficient"]) }, width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "conservation_notes", type: "text", meta: { interface: "input-rich-text-html", width: "full" }, schema: {} });

  // TCM Properties
  await safeCreateField("herbs", { field: "tcm_taste", type: "json", meta: { interface: "select-multiple-checkbox", options: { choices: choices(["Sweet", "Bitter", "Sour", "Pungent", "Salty", "Bland"]) }, width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "tcm_temperature", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Hot", "Warm", "Neutral", "Cool", "Cold"]) }, width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "tcm_meridians", type: "json", meta: { interface: "select-multiple-checkbox", options: { choices: choices(["Lung", "Large Intestine", "Stomach", "Spleen", "Heart", "Small Intestine", "Bladder", "Kidney", "Pericardium", "Triple Burner", "Gallbladder", "Liver"]) }, width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "tcm_functions", type: "text", meta: { interface: "input-rich-text-html", width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "tcm_category", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Releasing Exterior", "Clearing Heat", "Draining Downward", "Wind-Damp Dispelling", "Transforming Dampness", "Transforming Phlegm", "Relieving Food Stagnation", "Regulating Qi", "Regulating Blood", "Warming Interior", "Tonifying", "Astringent", "Calming Spirit", "Extinguishing Wind", "Opening Orifices", "External Applications"]) }, width: "half" }, schema: {} });

  // Western Properties
  await safeCreateField("herbs", { field: "western_properties", type: "json", meta: { interface: "select-multiple-checkbox", options: { choices: choices(["Adaptogen", "Alterative", "Analgesic", "Anti-inflammatory", "Antimicrobial", "Antioxidant", "Antispasmodic", "Astringent", "Bitter", "Carminative", "Demulcent", "Diaphoretic", "Diuretic", "Expectorant", "Hepatic", "Nervine", "Sedative", "Stimulant", "Tonic", "Vulnerary"]) }, width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "dosage_forms", type: "json", meta: { interface: "select-multiple-checkbox", options: { choices: choices(["Tincture", "Tea/Infusion", "Decoction", "Capsule", "Tablet", "Powder", "Extract", "Essential Oil", "Poultice", "Salve", "Syrup", "Compress"]) }, width: "full" }, schema: {} });

  // Medicinal (rich text)
  for (const f of ["therapeutic_uses", "pharmacological_effects", "contraindications", "side_effects", "allergenic_potential"]) {
    await safeCreateField("herbs", { field: f, type: "text", meta: { interface: "input-rich-text-html", width: "full" }, schema: {} });
  }

  // Cultural & Historical (rich text)
  for (const f of ["traditional_american_uses", "traditional_chinese_uses", "native_american_uses", "cultural_significance", "ethnobotanical_notes", "folklore"]) {
    await safeCreateField("herbs", { field: f, type: "text", meta: { interface: "input-rich-text-html", width: "full" }, schema: {} });
  }

  // Flattened: Toxicity (from toxicity_info paragraph)
  await safeCreateField("herbs", { field: "toxicity_level", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["None Known", "Low", "Moderate", "High", "Severe"]) }, width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "toxicity_compounds", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "toxicity_dose", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "toxicity_symptoms", type: "text", meta: { interface: "input-rich-text-html", width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "toxicity_treatment", type: "text", meta: { interface: "input-rich-text-html", width: "full" }, schema: {} });

  // Flattened: Storage (from storage_info paragraph)
  await safeCreateField("herbs", { field: "storage_conditions", type: "text", meta: { interface: "input-multiline", width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "storage_temperature", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "storage_light", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Dark", "Low Light", "Ambient"]) }, width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "storage_humidity", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Dry", "Moderate", "Humid"]) }, width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "storage_shelf_life", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "storage_degradation_signs", type: "text", meta: { interface: "input-multiline", width: "full" }, schema: {} });

  // Flattened: Sourcing (from sourcing_info paragraph)
  await safeCreateField("herbs", { field: "sourcing_type", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Wildcrafted", "Cultivated", "Both"]) }, width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "sourcing_organic", type: "boolean", meta: { interface: "boolean", width: "half" }, schema: { default_value: false } });
  await safeCreateField("herbs", { field: "sourcing_fair_trade", type: "boolean", meta: { interface: "boolean", width: "half" }, schema: { default_value: false } });
  await safeCreateField("herbs", { field: "sourcing_sustainability", type: "text", meta: { interface: "input-multiline", width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "sourcing_suppliers", type: "text", meta: { interface: "input-multiline", width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "sourcing_harvest_season", type: "string", meta: { interface: "input", width: "half" }, schema: {} });

  // JSON Repeaters (7 fields replacing paragraph types)
  for (const f of ["common_names", "external_ids", "contributors", "safety_warnings", "adulteration_risks", "quality_standards", "regulatory_status"]) {
    await safeCreateField("herbs", { field: f, type: "json", meta: { interface: "list", width: "full", note: `Repeatable entries (replaces ${f} paragraph type)` }, schema: {} });
  }

  // Sync tracking
  await safeCreateField("herbs", { field: "trefle_id", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "perenual_id", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "herb2_id", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "pubchem_cid", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "smiles", type: "text", meta: { interface: "input-multiline", width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "molecular_weight", type: "float", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "source_databases", type: "json", meta: { interface: "tags", width: "full" }, schema: {} });
  await safeCreateField("herbs", { field: "latin_name", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "pinyin_name", type: "string", meta: { interface: "input", width: "half" }, schema: {} });

  // Metadata
  await safeCreateField("herbs", { field: "peer_review_status", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Draft", "In Review", "Peer Reviewed", "Expert Verified", "Published", "Needs Update"]) }, width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "average_rating", type: "decimal", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "review_count", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "version", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("herbs", { field: "keywords", type: "json", meta: { interface: "tags", width: "full" }, schema: {} });

  // ── conditions ────────────────────────────────────────────────────────────
  await safeCreateCollection({ collection: "conditions", meta: { icon: "medical_information", note: "Health conditions and ailments" }, schema: {} });
  await safeCreateField("conditions", { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } });
  await safeCreateField("conditions", { field: "slug", type: "string", meta: { interface: "input" }, schema: { is_unique: true } });
  await safeCreateField("conditions", { field: "symptoms", type: "json", meta: { interface: "tags" }, schema: {} });
  await safeCreateField("conditions", { field: "severity", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Mild", "Moderate", "Severe", "Critical"]) } }, schema: {} });
  await safeCreateField("conditions", { field: "description", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} });

  // ── modalities ────────────────────────────────────────────────────────────
  await safeCreateCollection({ collection: "modalities", meta: { icon: "spa", note: "Holistic health modalities" }, schema: {} });
  await safeCreateField("modalities", { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } });
  await safeCreateField("modalities", { field: "slug", type: "string", meta: { interface: "input" }, schema: { is_unique: true } });
  await safeCreateField("modalities", { field: "excels_at", type: "json", meta: { interface: "tags" }, schema: {} });
  await safeCreateField("modalities", { field: "benefits", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} });
  await safeCreateField("modalities", { field: "description", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} });

  // ── practitioners ─────────────────────────────────────────────────────────
  await safeCreateCollection({ collection: "practitioners", meta: { icon: "person", note: "Holistic health practitioners" }, schema: {} });
  await safeCreateField("practitioners", { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } });
  await safeCreateField("practitioners", { field: "slug", type: "string", meta: { interface: "input" }, schema: { is_unique: true } });
  await safeCreateField("practitioners", { field: "practice_type", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["TCM", "Western Herbalism", "Naturopathy", "Ayurveda", "Integrative", "Other"]) } }, schema: {} });
  await safeCreateField("practitioners", { field: "bio", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} });
  await safeCreateField("practitioners", { field: "address", type: "text", meta: { interface: "input-multiline" }, schema: {} });
  await safeCreateField("practitioners", { field: "latitude", type: "decimal", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("practitioners", { field: "longitude", type: "decimal", meta: { interface: "input", width: "half" }, schema: {} });

  // ── formulas ──────────────────────────────────────────────────────────────
  await safeCreateCollection({ collection: "formulas", meta: { icon: "science", note: "Traditional herbal formulas" }, schema: {} });
  await safeCreateField("formulas", { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } });
  await safeCreateField("formulas", { field: "slug", type: "string", meta: { interface: "input" }, schema: { is_unique: true } });
  await safeCreateField("formulas", { field: "chinese_name", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("formulas", { field: "pinyin_name", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("formulas", { field: "description", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} });
  await safeCreateField("formulas", { field: "total_weight", type: "decimal", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("formulas", { field: "total_weight_unit", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["g", "mg", "oz", "mL"]) }, width: "half" }, schema: {} });
  await safeCreateField("formulas", { field: "preparation_instructions", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} });
  await safeCreateField("formulas", { field: "dosage", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} });
  await safeCreateField("formulas", { field: "use_cases", type: "json", meta: { interface: "tags" }, schema: {} });
  await safeCreateField("formulas", { field: "classic_source", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("formulas", { field: "source_author", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("formulas", { field: "source_dynasty", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("formulas", { field: "source_year", type: "string", meta: { interface: "input", width: "half" }, schema: {} });

  // ── tcm_ingredients ───────────────────────────────────────────────────────
  await safeCreateCollection({ collection: "tcm_ingredients", meta: { icon: "biotech", note: "Chemical compounds from TCM databases" }, schema: {} });
  await safeCreateField("tcm_ingredients", { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } });
  await safeCreateField("tcm_ingredients", { field: "ingredient_id", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("tcm_ingredients", { field: "pubchem_cid", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("tcm_ingredients", { field: "cas_number", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("tcm_ingredients", { field: "smiles", type: "text", meta: { interface: "input-multiline" }, schema: {} });
  await safeCreateField("tcm_ingredients", { field: "molecular_weight", type: "float", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("tcm_ingredients", { field: "source_db", type: "string", meta: { interface: "input", width: "half" }, schema: {} });

  // ── tcm_target_interactions ───────────────────────────────────────────────
  await safeCreateCollection({ collection: "tcm_target_interactions", meta: { icon: "hub", note: "Herb/ingredient to protein target interactions" }, schema: {} });
  await safeCreateField("tcm_target_interactions", { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } });
  await safeCreateField("tcm_target_interactions", { field: "target_name", type: "string", meta: { interface: "input" }, schema: {} });
  await safeCreateField("tcm_target_interactions", { field: "uniprot_id", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("tcm_target_interactions", { field: "gene_name", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("tcm_target_interactions", { field: "score", type: "float", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("tcm_target_interactions", { field: "evidence_type", type: "json", meta: { interface: "tags" }, schema: {} });
  await safeCreateField("tcm_target_interactions", { field: "source_db", type: "string", meta: { interface: "input", width: "half" }, schema: {} });

  // ── tcm_clinical_evidence ─────────────────────────────────────────────────
  await safeCreateCollection({ collection: "tcm_clinical_evidence", meta: { icon: "lab_research", note: "Clinical trial evidence for TCM" }, schema: {} });
  await safeCreateField("tcm_clinical_evidence", { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } });
  await safeCreateField("tcm_clinical_evidence", { field: "evidence_id", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("tcm_clinical_evidence", { field: "study_type", type: "json", meta: { interface: "tags" }, schema: {} });
  await safeCreateField("tcm_clinical_evidence", { field: "summary", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} });
  await safeCreateField("tcm_clinical_evidence", { field: "outcome", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} });
  await safeCreateField("tcm_clinical_evidence", { field: "source_url", type: "string", meta: { interface: "input" }, schema: {} });
  await safeCreateField("tcm_clinical_evidence", { field: "source_db", type: "string", meta: { interface: "input", width: "half" }, schema: {} });

  // ── import_logs ───────────────────────────────────────────────────────────
  await safeCreateCollection({ collection: "import_logs", meta: { icon: "history", note: "Data ingestion run tracking" }, schema: {} });
  await safeCreateField("import_logs", { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } });
  await safeCreateField("import_logs", { field: "source_db", type: "string", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("import_logs", { field: "records_processed", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("import_logs", { field: "records_created", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("import_logs", { field: "records_updated", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("import_logs", { field: "records_skipped", type: "integer", meta: { interface: "input", width: "half" }, schema: {} });
  await safeCreateField("import_logs", { field: "errors", type: "text", meta: { interface: "input-multiline" }, schema: {} });
  await safeCreateField("import_logs", { field: "duration_seconds", type: "float", meta: { interface: "input", width: "half" }, schema: {} });
}

// ─── 3. O2M Child Collections (Paragraph Replacements) ─────────────────────

async function createO2MCollections() {
  console.log("\n=== O2M Child Collections (Paragraph Replacements) ===");

  // Helper to create a standard O2M child collection
  async function createChildCollection(name, parentCollection, icon, note, fields) {
    await safeCreateCollection({ collection: name, meta: { icon, note, hidden: false }, schema: {} });
    // FK to parent
    await safeCreateField(name, { field: `${parentCollection.slice(0, -1)}_id`, type: "integer", meta: { interface: "select-dropdown-m2o", hidden: true }, schema: {} });
    await safeCreateRelation({
      collection: name,
      field: `${parentCollection.slice(0, -1)}_id`,
      related_collection: parentCollection,
      meta: { one_field: name.replace(`${parentCollection.slice(0, -1)}_`, ""), sort_field: "sort" },
      schema: { on_delete: "CASCADE" },
    });
    // Sort field
    await safeCreateField(name, { field: "sort", type: "integer", meta: { interface: "input", hidden: true }, schema: {} });
    // Custom fields
    for (const f of fields) {
      await safeCreateField(name, f);
    }
  }

  // ── herb_clinical_studies ─────────────────────────────────────────────────
  await createChildCollection("herb_clinical_studies", "herbs", "science", "Clinical research studies", [
    { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } },
    { field: "authors", type: "string", meta: { interface: "input" }, schema: {} },
    { field: "year", type: "integer", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "journal", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "study_type", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["RCT", "Meta-analysis", "Cohort", "Case-control", "In vitro", "In vivo", "Review", "Case report"]) }, width: "half" }, schema: {} },
    { field: "sample_size", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "doi", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "url", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "summary", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
    { field: "conclusion", type: "text", meta: { interface: "input-multiline" }, schema: {} },
  ]);

  // ── herb_drug_interactions ────────────────────────────────────────────────
  await createChildCollection("herb_drug_interactions", "herbs", "medication", "Drug-herb interactions", [
    { field: "drug_name", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } },
    { field: "interaction_type", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Major", "Moderate", "Minor"]) }, width: "half" }, schema: {} },
    { field: "severity", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Contraindicated", "Serious", "Monitor", "Minor"]) }, width: "half" }, schema: {} },
    { field: "mechanism", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
    { field: "evidence_level", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Established", "Probable", "Suspected", "Possible", "Unlikely"]) }, width: "half" }, schema: {} },
    { field: "clinical_note", type: "text", meta: { interface: "input-multiline" }, schema: {} },
  ]);

  // ── herb_dosages ──────────────────────────────────────────────────────────
  await createChildCollection("herb_dosages", "herbs", "local_pharmacy", "Dosage information", [
    { field: "form", type: "string", meta: { interface: "select-dropdown", required: true, options: { choices: choices(["Tincture", "Tea/Infusion", "Decoction", "Capsule", "Tablet", "Powder", "Extract", "Essential Oil", "Poultice", "Salve", "Syrup"]) } }, schema: {} },
    { field: "amount", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "frequency", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "duration", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "population", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "notes", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
  ]);

  // ── herb_constituents ─────────────────────────────────────────────────────
  await createChildCollection("herb_constituents", "herbs", "science", "Active chemical constituents", [
    { field: "name", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } },
    { field: "chemical_class", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "concentration", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "effects", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
  ]);

  // ── herb_preparations ─────────────────────────────────────────────────────
  await createChildCollection("herb_preparations", "herbs", "coffee_maker", "Preparation methods", [
    { field: "method", type: "string", meta: { interface: "select-dropdown", required: true, options: { choices: choices(["Decoction", "Infusion", "Tincture", "Powder", "Poultice", "Extract", "Oil Infusion", "Fermentation"]) } }, schema: {} },
    { field: "parts_used", type: "json", meta: { interface: "tags", width: "half" }, schema: {} },
    { field: "instructions", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
    { field: "time", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "yield", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "shelf_life", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
  ]);

  // ── herb_historical_texts ─────────────────────────────────────────────────
  await createChildCollection("herb_historical_texts", "herbs", "menu_book", "Historical text references", [
    { field: "source_name", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } },
    { field: "author", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "era", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "tradition", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["TCM", "Western", "Ayurvedic", "Native American", "Other"]) }, width: "half" }, schema: {} },
    { field: "excerpt", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
    { field: "translation", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
    { field: "url", type: "string", meta: { interface: "input" }, schema: {} },
  ]);

  // ── herb_practitioner_notes ───────────────────────────────────────────────
  await createChildCollection("herb_practitioner_notes", "herbs", "clinical_notes", "Practitioner clinical notes", [
    { field: "author_name", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } },
    { field: "credentials", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "tradition", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["TCM", "Western Herbalism", "Naturopathy", "Ayurveda", "Other"]) }, width: "half" }, schema: {} },
    { field: "note", type: "text", meta: { interface: "input-rich-text-html", required: true }, schema: {} },
    { field: "date", type: "date", meta: { interface: "datetime", width: "half" }, schema: {} },
  ]);

  // ── herb_case_studies ─────────────────────────────────────────────────────
  await createChildCollection("herb_case_studies", "herbs", "assignment", "Clinical case studies", [
    { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } },
    { field: "condition_id", type: "integer", meta: { interface: "select-dropdown-m2o", width: "half" }, schema: {} },
    { field: "patient_profile", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
    { field: "presenting_complaint", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
    { field: "treatment_protocol", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
    { field: "duration", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "outcome", type: "text", meta: { interface: "input-rich-text-html" }, schema: {} },
    { field: "practitioner", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "date", type: "date", meta: { interface: "datetime", width: "half" }, schema: {} },
  ]);
  // case_study → condition relation
  await safeCreateRelation({
    collection: "herb_case_studies",
    field: "condition_id",
    related_collection: "conditions",
    schema: { on_delete: "SET NULL" },
  });

  // ── herb_references ───────────────────────────────────────────────────────
  await createChildCollection("herb_references", "herbs", "book", "Bibliographic references", [
    { field: "type", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Book", "Journal Article", "Website", "Traditional Text", "Database", "Expert Consultation"]) }, width: "half" }, schema: {} },
    { field: "title", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } },
    { field: "authors", type: "string", meta: { interface: "input" }, schema: {} },
    { field: "year", type: "integer", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "publication", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "isbn", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "doi", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "url", type: "string", meta: { interface: "input" }, schema: {} },
    { field: "pages", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "notes", type: "text", meta: { interface: "input-multiline" }, schema: {} },
  ]);

  // ── herb_images ───────────────────────────────────────────────────────────
  await createChildCollection("herb_images", "herbs", "image", "Herb images with metadata", [
    { field: "file", type: "uuid", meta: { interface: "file-image", required: true }, schema: {} },
    { field: "image_type", type: "string", meta: { interface: "select-dropdown", options: { choices: choices(["Whole Plant", "Flower", "Leaf", "Root", "Bark", "Seed", "Dried Form", "Habitat", "Preparation"]) }, width: "half" }, schema: {} },
    { field: "caption", type: "string", meta: { interface: "input" }, schema: {} },
    { field: "credit", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "license", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
  ]);
  // file → directus_files relation
  await safeCreateRelation({
    collection: "herb_images",
    field: "file",
    related_collection: "directus_files",
    schema: { on_delete: "SET NULL" },
  });

  // ── formula_ingredients ───────────────────────────────────────────────────
  await createChildCollection("formula_ingredients", "formulas", "science", "Herb ingredients in formula", [
    { field: "herb_id", type: "integer", meta: { interface: "select-dropdown-m2o", required: true }, schema: {} },
    { field: "quantity", type: "decimal", meta: { interface: "input", required: true, width: "half" }, schema: {} },
    { field: "unit", type: "string", meta: { interface: "select-dropdown", required: true, options: { choices: choices(["g", "mg", "oz", "mL", "tsp", "tbsp", "drops", "parts"]) }, width: "half" }, schema: {} },
    { field: "percentage", type: "decimal", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "role", type: "string", meta: { interface: "select-dropdown", options: { choices: [{ text: "Chief (Jun)", value: "chief" }, { text: "Deputy (Chen)", value: "deputy" }, { text: "Assistant (Zuo)", value: "assistant" }, { text: "Envoy (Shi)", value: "envoy" }] }, width: "half" }, schema: {} },
    { field: "function", type: "string", meta: { interface: "input" }, schema: {} },
    { field: "notes", type: "text", meta: { interface: "input-multiline" }, schema: {} },
  ]);
  // ingredient → herb relation
  await safeCreateRelation({
    collection: "formula_ingredients",
    field: "herb_id",
    related_collection: "herbs",
    schema: { on_delete: "CASCADE" },
  });

  // ── formula_modifications ─────────────────────────────────────────────────
  await createChildCollection("formula_modifications", "formulas", "tune", "Jia-Jian formula modifications", [
    { field: "condition", type: "string", meta: { interface: "input", required: true }, schema: { is_nullable: false } },
    { field: "action", type: "string", meta: { interface: "select-dropdown", required: true, options: { choices: [{ text: "Add (Jia)", value: "add" }, { text: "Remove (Jian)", value: "remove" }, { text: "Increase", value: "increase" }, { text: "Decrease", value: "decrease" }, { text: "Substitute", value: "substitute" }] } }, schema: {} },
    { field: "herb_id", type: "integer", meta: { interface: "select-dropdown-m2o", required: true }, schema: {} },
    { field: "amount", type: "string", meta: { interface: "input", width: "half" }, schema: {} },
    { field: "note", type: "text", meta: { interface: "input-multiline" }, schema: {} },
  ]);
  // modification → herb relation
  await safeCreateRelation({
    collection: "formula_modifications",
    field: "herb_id",
    related_collection: "herbs",
    schema: { on_delete: "CASCADE" },
  });
}

// ─── 4. M2M Junction Tables ────────────────────────────────────────────────

async function createM2MRelations() {
  console.log("\n=== M2M Relations ===");

  async function createM2M(collection, field, relatedCollection, junctionCollection, junctionFieldA, junctionFieldB) {
    // Create junction collection
    await safeCreateCollection({
      collection: junctionCollection,
      meta: { icon: "import_export", hidden: true },
      schema: {},
    });
    // Create M2M alias field on parent collection so Directus knows to
    // render the list-m2m interface (shows the related collection form
    // on "Create New" instead of the hidden junction form).
    await safeCreateField(collection, {
      field,
      type: "alias",
      meta: {
        interface: "list-m2m",
        special: ["m2m"],
      },
    });
    // Junction FK fields
    await safeCreateField(junctionCollection, { field: junctionFieldA, type: "integer", meta: { hidden: true }, schema: {} });
    await safeCreateField(junctionCollection, { field: junctionFieldB, type: "integer", meta: { hidden: true }, schema: {} });
    // Relations
    await safeCreateRelation({
      collection: junctionCollection,
      field: junctionFieldA,
      related_collection: collection,
      meta: { one_field: field, junction_field: junctionFieldB },
      schema: { on_delete: "CASCADE" },
    });
    await safeCreateRelation({
      collection: junctionCollection,
      field: junctionFieldB,
      related_collection: relatedCollection,
      schema: { on_delete: "CASCADE" },
    });
  }

  await createM2M("herbs", "conditions_treated", "conditions", "herbs_conditions", "herbs_id", "conditions_id");
  await createM2M("herbs", "related_species", "herbs", "herbs_related_species", "herbs_id", "related_herbs_id");
  await createM2M("herbs", "substitute_herbs", "herbs", "herbs_substitutes", "herbs_id", "substitute_herbs_id");
  await createM2M("herbs", "similar_tcm_herbs", "herbs", "herbs_similar_tcm", "herbs_id", "similar_tcm_id");
  await createM2M("herbs", "similar_western_herbs", "herbs", "herbs_similar_western", "herbs_id", "similar_western_id");
  await createM2M("herbs", "tags", "herb_tags", "herbs_herb_tags", "herbs_id", "herb_tags_id");
  await createM2M("herbs", "tcm_category_tags", "tcm_categories", "herbs_tcm_categories", "herbs_id", "tcm_categories_id");
  await createM2M("modalities", "conditions", "conditions", "modalities_conditions", "modalities_id", "conditions_id");
  await createM2M("practitioners", "modalities", "modalities", "practitioners_modalities", "practitioners_id", "modalities_id");
  await createM2M("tcm_clinical_evidence", "herb_refs", "herbs", "tcm_evidence_herbs", "tcm_clinical_evidence_id", "herbs_id");
  await createM2M("formulas", "conditions", "conditions", "formulas_conditions", "formulas_id", "conditions_id");
  await createM2M("formulas", "related_formulas", "formulas", "formulas_related", "formulas_id", "related_formulas_id");

  // tcm_ingredients → herbs M2M
  await createM2M("tcm_ingredients", "herb_sources", "herbs", "tcm_ingredients_herbs", "tcm_ingredients_id", "herbs_id");

  // tcm_target_interactions M2O relations (already have fields, just need relations)
  await safeCreateField("tcm_target_interactions", { field: "ingredient_id", type: "integer", meta: { interface: "select-dropdown-m2o", width: "half" }, schema: {} });
  await safeCreateRelation({
    collection: "tcm_target_interactions",
    field: "ingredient_id",
    related_collection: "tcm_ingredients",
    schema: { on_delete: "SET NULL" },
  });
  await safeCreateField("tcm_target_interactions", { field: "herb_id", type: "integer", meta: { interface: "select-dropdown-m2o", width: "half" }, schema: {} });
  await safeCreateRelation({
    collection: "tcm_target_interactions",
    field: "herb_id",
    related_collection: "herbs",
    schema: { on_delete: "SET NULL" },
  });

  // tcm_clinical_evidence M2O to formula
  await safeCreateField("tcm_clinical_evidence", { field: "formula_id", type: "integer", meta: { interface: "select-dropdown-m2o", width: "half" }, schema: {} });
  await safeCreateRelation({
    collection: "tcm_clinical_evidence",
    field: "formula_id",
    related_collection: "formulas",
    schema: { on_delete: "SET NULL" },
  });
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("Verscienta Directus Schema Creator");
  console.log(`Target: ${DIRECTUS_URL}`);
  console.log("=====================================");

  await createTaxonomyCollections();
  await createPrimaryCollections();
  await createO2MCollections();
  await createM2MRelations();

  console.log("\n=====================================");
  console.log("Schema creation complete!");
  console.log("Next: Export snapshot with 'npx directus schema snapshot ./snapshots/initial.yaml'");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
