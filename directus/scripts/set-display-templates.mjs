/**
 * Configures `display_template` on child collections so O2M lists in the
 * Directus admin show meaningful labels instead of row IDs.
 *
 * Usage:
 *   DIRECTUS_TOKEN=xxx DIRECTUS_URL=http://localhost:8055 node scripts/set-display-templates.mjs
 */

import { createDirectus, rest, staticToken, updateCollection } from "@directus/sdk";

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error("DIRECTUS_TOKEN required");
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

// Each entry: [collection name, display template]
// Templates use Directus mustache syntax. Cross-collection M2O lookups use `{{field.subfield}}`.
const templates = [
  ["formula_ingredients", "{{herb_id.title}} — {{quantity}}{{unit}} ({{role}})"],
  ["formula_modifications", "{{action}} {{herb_id.title}} — when {{condition}}"],
  ["herb_clinical_studies", "{{title}} ({{year}})"],
  ["herb_drug_interactions", "{{drug_name}} — {{interaction_type}}"],
  ["herb_dosages", "{{form}} — {{amount}} {{frequency}}"],
  ["herb_constituents", "{{name}}{{chemical_class}}"],
  ["herb_preparations", "{{method}}"],
  ["herb_historical_texts", "{{source_name}} — {{author}}"],
  ["herb_practitioner_notes", "{{author_name}} ({{tradition}})"],
  ["herb_case_studies", "{{title}}"],
  ["herb_references", "{{authors}} — {{title}} ({{year}})"],
  ["herb_images", "{{image_type}}: {{caption}}"],
  ["clinic_images", "{{image_type}}: {{caption}}"],
  ["herbs", "{{title}} ({{scientific_name}})"],
  ["formulas", "{{title}} {{chinese_name}}"],
  ["conditions", "{{title}}"],
  ["modalities", "{{title}}"],
  ["practitioners", "{{first_name}} {{last_name}}"],
  ["clinics", "{{name}}"],
  ["tcm_ingredients", "{{title}}"],
  ["tcm_target_interactions", "{{target_name}} ({{gene_name}})"],
  ["tcm_clinical_evidence", "{{title}}"],
  ["herb_tags", "{{name}}"],
  ["tcm_categories", "{{name}}"],
];

async function main() {
  for (const [collection, template] of templates) {
    try {
      await client.request(
        updateCollection(collection, {
          meta: { display_template: template },
        })
      );
      console.log(`  + ${collection}: ${template}`);
    } catch (e) {
      const msg = e?.errors?.[0]?.message || e.message;
      console.error(`  ! ${collection}: ${msg}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
