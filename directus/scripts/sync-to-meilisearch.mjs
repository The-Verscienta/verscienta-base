/**
 * Verscienta MeiliSearch Bulk Sync
 *
 * Fetches all items from Directus and pushes them to MeiliSearch.
 * Run this for initial data population or to rebuild indices.
 *
 * Usage:
 *   DIRECTUS_TOKEN=xxx MEILI_MASTER_KEY=xxx node scripts/sync-to-meilisearch.mjs
 *
 * Prerequisites:
 *   1. Run setup-meilisearch.mjs first (creates indices)
 *   2. Directus must be running with data
 */

import { createDirectus, rest, staticToken, readItems } from "@directus/sdk";
import { MeiliSearch } from "meilisearch";

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const MEILI_URL = process.env.MEILI_URL || "http://localhost:7700";
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY;

if (!DIRECTUS_TOKEN || !MEILI_MASTER_KEY) {
  console.error("Error: DIRECTUS_TOKEN and MEILI_MASTER_KEY required");
  process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

const meili = new MeiliSearch({ host: MEILI_URL, apiKey: MEILI_MASTER_KEY });

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

// ─── Collection sync configs ────────────────��───────────────────────────────

const collections = {
  herbs: {
    index: "verscienta_herbs",
    fields: ["*"],
    transform: (item) => ({
      id: item.id,
      type: "herb",
      url: `/herbs/${item.slug || item.id}`,
      title: item.title,
      slug: item.slug,
      scientific_name: item.scientific_name,
      common_names: Array.isArray(item.common_names)
        ? item.common_names.map((cn) => cn.name || cn).filter(Boolean)
        : [],
      family: item.family,
      therapeutic_uses: stripHtml(item.therapeutic_uses),
      tcm_functions: stripHtml(item.tcm_functions),
      keywords: item.keywords || [],
      western_properties: item.western_properties || [],
      latin_name: item.latin_name,
      pinyin_name: item.pinyin_name,
      synonyms: item.synonyms || [],
      plant_type: item.plant_type,
      parts_used: item.parts_used || [],
      tcm_temperature: item.tcm_temperature,
      tcm_taste: item.tcm_taste || [],
      tcm_meridians: item.tcm_meridians || [],
      tcm_category: item.tcm_category,
      conservation_status: item.conservation_status,
      peer_review_status: item.peer_review_status,
      dosage_forms: item.dosage_forms || [],
      native_region: item.native_region || [],
      source_databases: item.source_databases || [],
      review_count: item.review_count || 0,
      average_rating: item.average_rating || 0,
    }),
  },
  formulas: {
    index: "verscienta_formulas",
    fields: ["*"],
    transform: (item) => ({
      id: item.id,
      type: "formula",
      url: `/formulas/${item.slug || item.id}`,
      title: item.title,
      slug: item.slug,
      chinese_name: item.chinese_name,
      pinyin_name: item.pinyin_name,
      description: stripHtml(item.description),
      use_cases: item.use_cases || [],
      classic_source: item.classic_source,
    }),
  },
  conditions: {
    index: "verscienta_conditions",
    fields: ["*"],
    transform: (item) => ({
      id: item.id,
      type: "condition",
      url: `/conditions/${item.slug || item.id}`,
      title: item.title,
      slug: item.slug,
      description: stripHtml(item.description),
      symptoms: item.symptoms || [],
      severity: item.severity,
    }),
  },
  modalities: {
    index: "verscienta_modalities",
    fields: ["*"],
    transform: (item) => ({
      id: item.id,
      type: "modality",
      url: `/modalities/${item.slug || item.id}`,
      title: item.title,
      slug: item.slug,
      description: stripHtml(item.description),
      excels_at: item.excels_at || [],
      benefits: stripHtml(item.benefits),
    }),
  },
  practitioners: {
    index: "verscienta_practitioners",
    fields: ["*"],
    transform: (item) => ({
      id: item.id,
      type: "practitioner",
      url: `/practitioners/${item.slug || item.id}`,
      title: item.title,
      name: item.title,
      slug: item.slug,
      practice_type: item.practice_type,
      bio: stripHtml(item.bio),
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      _geo:
        item.latitude && item.longitude
          ? { lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) }
          : undefined,
    }),
  },
};

// ─── Sync ───────────────��───────────────────────────────────────────────────

async function syncCollection(name, config) {
  console.log(`\n--- ${name} ---`);

  // Fetch all items from Directus (paginated)
  let allItems = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const items = await directus.request(
      readItems(name, {
        fields: config.fields,
        limit,
        offset: (page - 1) * limit,
      })
    );

    if (!items || items.length === 0) break;
    allItems.push(...items);
    console.log(`  Fetched page ${page} (${items.length} items)`);

    if (items.length < limit) break;
    page++;
  }

  if (allItems.length === 0) {
    console.log(`  No items to sync`);
    return [];
  }

  // Transform items
  const docs = allItems.map(config.transform);

  // Push to collection-specific index
  const task = await meili.index(config.index).addDocuments(docs);
  console.log(`  Pushed ${docs.length} docs to ${config.index} (task ${task.taskUid})`);

  return docs;
}

async function main() {
  console.log("Verscienta MeiliSearch Bulk Sync");
  console.log(`Directus: ${DIRECTUS_URL}`);
  console.log(`MeiliSearch: ${MEILI_URL}`);
  console.log("================================");

  // Verify connections
  try {
    await meili.health();
    console.log("MeiliSearch: connected");
  } catch (e) {
    console.error(`MeiliSearch connection failed: ${e.message}`);
    process.exit(1);
  }

  // Sync each collection
  const allDocs = [];

  for (const [name, config] of Object.entries(collections)) {
    const docs = await syncCollection(name, config);
    // Add to "all" index with objectID prefix
    allDocs.push(
      ...docs.map((doc) => ({
        ...doc,
        objectID: `${name}_${doc.id}`,
      }))
    );
  }

  // Push to combined index
  if (allDocs.length > 0) {
    console.log(`\n--- verscienta_all (combined) ---`);
    const task = await meili.index("verscienta_all").addDocuments(allDocs);
    console.log(`  Pushed ${allDocs.length} total docs (task ${task.taskUid})`);
  }

  // Wait for all tasks
  console.log("\nWaiting for indexing to complete...");
  const tasks = await meili.getTasks({ limit: 50, statuses: ["enqueued", "processing"] });
  for (const task of tasks.results) {
    await meili.waitForTask(task.uid, { timeOutMs: 60000 });
  }

  console.log("\n================================");
  console.log(`Sync complete! ${allDocs.length} total documents indexed.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
