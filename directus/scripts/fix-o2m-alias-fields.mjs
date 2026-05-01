/**
 * One-time fix: register O2M alias fields on parent collections.
 *
 * The relations exist in directus_relations with meta.one_field set, but
 * the alias rows in directus_fields were never created (pre-existing
 * schema migration gap). This script inserts the missing alias fields so
 * the API can resolve queries like `herbs.images.file`.
 *
 * Usage:
 *   DIRECTUS_TOKEN=xxx node scripts/fix-o2m-alias-fields.mjs
 */

import { createDirectus, rest, staticToken, createField, readFields } from "@directus/sdk";

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error("DIRECTUS_TOKEN required");
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

// (parent collection, alias field name, child collection, sort field if any)
const aliases = [
  ["herbs", "clinical_studies", "herb_clinical_studies"],
  ["herbs", "drug_interactions", "herb_drug_interactions"],
  ["herbs", "dosages", "herb_dosages"],
  ["herbs", "constituents", "herb_constituents"],
  ["herbs", "preparations", "herb_preparations"],
  ["herbs", "historical_texts", "herb_historical_texts"],
  ["herbs", "practitioner_notes", "herb_practitioner_notes"],
  ["herbs", "case_studies", "herb_case_studies"],
  ["herbs", "references", "herb_references"],
  ["herbs", "images", "herb_images"],
  ["clinics", "images", "clinic_images"],
  ["formulas", "ingredients", "formula_ingredients"],
  ["formulas", "modifications", "formula_modifications"],
];

async function getExistingAliases(parent) {
  try {
    const fields = await client.request(readFields(parent));
    return new Set(
      fields
        .filter((f) => f.collection === parent && f.type === "alias")
        .map((f) => f.field)
    );
  } catch (e) {
    return new Set();
  }
}

async function main() {
  for (const [parent, alias, child] of aliases) {
    const existing = await getExistingAliases(parent);
    if (existing.has(alias)) {
      console.log(`  = ${parent}.${alias} (already exists)`);
      continue;
    }
    try {
      await client.request(
        createField(parent, {
          field: alias,
          type: "alias",
          meta: {
            interface: "list-o2m",
            special: ["o2m"],
            options: { template: "{{title || name || id}}" },
          },
          schema: null,
        })
      );
      console.log(`  + ${parent}.${alias} → ${child}`);
    } catch (e) {
      console.error(`  ! ${parent}.${alias}: ${e?.errors?.[0]?.message || e.message}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
