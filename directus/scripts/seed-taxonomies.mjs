/**
 * Verscienta Directus Taxonomy Seeder
 *
 * Populates herb_tags and tcm_categories with the hierarchical
 * taxonomy terms from the original Drupal setup scripts.
 *
 * Usage:
 *   DIRECTUS_TOKEN=your-token node scripts/seed-taxonomies.mjs
 */

import { createDirectus, rest, staticToken, readItems, createItem } from "@directus/sdk";

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error("Error: DIRECTUS_TOKEN required");
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function seedCollection(collection, tree, parentId = null) {
  for (const [name, children] of Object.entries(tree)) {
    let item;
    try {
      item = await client.request(
        createItem(collection, {
          name,
          slug: slug(name),
          parent_id: parentId,
        })
      );
      console.log(`  + ${name}${parentId ? ` (child of ${parentId})` : ""}`);
    } catch (e) {
      if (e?.errors?.[0]?.extensions?.code === "RECORD_NOT_UNIQUE") {
        // Already exists, look it up
        const existing = await client.request(
          readItems(collection, { filter: { slug: { _eq: slug(name) } }, limit: 1 })
        );
        item = existing[0];
        console.log(`  = ${name} (exists)`);
      } else {
        console.error(`  ! ${name}: ${e?.errors?.[0]?.message || e.message}`);
        continue;
      }
    }

    if (children && typeof children === "object" && Object.keys(children).length > 0) {
      await seedCollection(collection, children, item.id);
    }
  }
}

// ─── Herb Tags Hierarchy ────────────────────────────────────────────────────
// Source: setup-drupal.sh, docs/DRUPAL-COMPREHENSIVE-HERB-SETUP.md

const herbTags = {
  "By Action": {
    Adaptogen: {},
    Alterative: {},
    Analgesic: {},
    "Anti-inflammatory": {},
    Antimicrobial: {},
    Antioxidant: {},
    Antispasmodic: {},
    Astringent: {},
    Bitter: {},
    Carminative: {},
    Demulcent: {},
    Diaphoretic: {},
    Diuretic: {},
    Expectorant: {},
    Hepatic: {},
    Nervine: {},
    Sedative: {},
    Stimulant: {},
    Tonic: {},
    Vulnerary: {},
  },
  "By Condition": {
    Anxiety: {},
    "Digestive Issues": {},
    "Immune Support": {},
    "Pain Relief": {},
    "Sleep Support": {},
    "Respiratory Health": {},
    "Skin Health": {},
    "Cardiovascular Health": {},
    "Women's Health": {},
    "Men's Health": {},
    "Cognitive Support": {},
    "Joint Health": {},
    "Liver Support": {},
    "Kidney Support": {},
    "Eye Health": {},
  },
  "By Tradition": {
    TCM: {},
    Western: {},
    "Native American": {},
    Ayurvedic: {},
    "African Traditional": {},
    "South American": {},
  },
  "By Part Used": {
    Root: {},
    Leaf: {},
    Stem: {},
    Flower: {},
    Seed: {},
    Bark: {},
    Fruit: {},
    "Whole Plant": {},
    Rhizome: {},
    Bulb: {},
    Resin: {},
  },
  "By Form": {
    Tea: {},
    Tincture: {},
    Capsule: {},
    Extract: {},
    Powder: {},
    "Essential Oil": {},
    Salve: {},
    Poultice: {},
    Syrup: {},
    Decoction: {},
  },
};

// ─── TCM Categories ─────────────────────────────────────────────────────────
// Source: setup-tcm-content-types.sh, docs/DRUPAL-COMPREHENSIVE-HERB-SETUP.md

const tcmCategories = {
  "Releasing the Exterior": {},
  "Clearing Heat": {},
  "Draining Downward": {},
  "Wind-Damp Dispelling": {},
  "Transforming Dampness": {},
  "Transforming Phlegm": {},
  "Relieving Food Stagnation": {},
  "Regulating Qi": {},
  "Regulating Blood": {},
  "Warming Interior": {},
  Tonifying: {
    "Qi Tonics": {},
    "Blood Tonics": {},
    "Yin Tonics": {},
    "Yang Tonics": {},
  },
  Astringent: {},
  "Calming Spirit": {},
  "Extinguishing Wind": {},
  "Opening Orifices": {},
  "External Applications": {},
};

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("Verscienta Taxonomy Seeder");
  console.log(`Target: ${DIRECTUS_URL}`);
  console.log("=========================\n");

  console.log("=== herb_tags ===");
  await seedCollection("herb_tags", herbTags);

  console.log("\n=== tcm_categories ===");
  await seedCollection("tcm_categories", tcmCategories);

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
