/**
 * Fix M2M alias fields — adds missing interface & special metadata.
 *
 * When create-schema.mjs created M2M relations, it relied on Directus to
 * auto-create alias fields via `one_field` in relation meta. Those
 * auto-created fields lack `interface: "list-m2m"` and `special: ["m2m"]`,
 * so the "Create New" button in relational drawers shows an empty junction
 * form instead of the related collection form.
 *
 * This script patches all 14 affected fields on a live Directus instance.
 *
 * Usage:
 *   DIRECTUS_URL=https://backend.verscienta.com DIRECTUS_TOKEN=xxx node scripts/fix-m2m-fields.mjs
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const TOKEN = process.env.DIRECTUS_TOKEN;

if (!TOKEN) {
  console.error("Error: DIRECTUS_TOKEN is required.");
  process.exit(1);
}

// All M2M alias fields created by create-schema.mjs's createM2M helper.
// Format: [collection, field]
const M2M_FIELDS = [
  ["herbs", "conditions_treated"],
  ["herbs", "related_species"],
  ["herbs", "substitute_herbs"],
  ["herbs", "similar_tcm_herbs"],
  ["herbs", "similar_western_herbs"],
  ["herbs", "tags"],
  ["herbs", "tcm_category_tags"],
  ["modalities", "conditions"],
  ["practitioners", "modalities"],
  ["tcm_clinical_evidence", "herb_refs"],
  ["formulas", "conditions"],
  ["formulas", "related_formulas"],
  ["tcm_ingredients", "herb_sources"],
];

async function patchField(collection, field) {
  const url = `${DIRECTUS_URL}/fields/${collection}/${field}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      meta: {
        interface: "list-m2m",
        special: ["m2m"],
      },
    }),
  });

  if (res.ok) {
    console.log(`  ✓ ${collection}.${field}`);
  } else {
    const body = await res.json().catch(() => ({}));
    const msg = body?.errors?.[0]?.message || res.statusText;
    console.error(`  ✗ ${collection}.${field}: ${msg}`);
  }
}

async function main() {
  console.log(`Fixing M2M fields on ${DIRECTUS_URL}`);
  console.log("=".repeat(50));

  for (const [collection, field] of M2M_FIELDS) {
    await patchField(collection, field);
  }

  console.log("\nDone! Refresh Directus admin to see the changes.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
