/**
 * Verscienta MeiliSearch Index Setup
 *
 * Creates and configures all search indices with the correct
 * searchable attributes, filterable attributes, and ranking rules.
 *
 * Replaces the Algolia index configuration from frontend/scripts/index-algolia.ts.
 *
 * Usage:
 *   MEILI_URL=http://localhost:7700 MEILI_MASTER_KEY=your-key node scripts/setup-meilisearch.mjs
 *
 * Prerequisites:
 *   npm install meilisearch
 */

import { MeiliSearch } from "meilisearch";

const MEILI_URL = process.env.MEILI_URL || "http://localhost:7700";
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY;

if (!MEILI_MASTER_KEY) {
  console.error("Error: MEILI_MASTER_KEY required");
  process.exit(1);
}

const client = new MeiliSearch({ host: MEILI_URL, apiKey: MEILI_MASTER_KEY });

// ─── Index Definitions ──────────────────────────────────────────────────────
// Mirrors the Algolia config from docs/DRUPAL-COMPREHENSIVE-HERB-SETUP.md
// and frontend/scripts/index-algolia.ts

const indices = {
  herbs: {
    primaryKey: "id",
    searchableAttributes: [
      "title",
      "scientific_name",
      "common_names",
      "family",
      "therapeutic_uses",
      "tcm_functions",
      "keywords",
      "western_properties",
      "latin_name",
      "pinyin_name",
      "synonyms",
    ],
    filterableAttributes: [
      "plant_type",
      "parts_used",
      "tcm_temperature",
      "tcm_taste",
      "tcm_meridians",
      "tcm_category",
      "western_properties",
      "conservation_status",
      "peer_review_status",
      "dosage_forms",
      "native_region",
      "source_databases",
      "type",
    ],
    sortableAttributes: [
      "title",
      "scientific_name",
      "review_count",
      "average_rating",
    ],
    rankingRules: [
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
      "review_count:desc",
      "average_rating:desc",
    ],
    displayedAttributes: [
      "id",
      "title",
      "slug",
      "scientific_name",
      "common_names",
      "therapeutic_uses",
      "tcm_taste",
      "tcm_temperature",
      "tcm_meridians",
      "latin_name",
      "pinyin_name",
      "source_databases",
      "plant_type",
      "parts_used",
      "image",
      "type",
      "url",
    ],
  },

  modalities: {
    primaryKey: "id",
    searchableAttributes: [
      "title",
      "description",
      "benefits",
      "excels_at",
    ],
    filterableAttributes: ["type"],
    sortableAttributes: ["title"],
    displayedAttributes: [
      "id",
      "title",
      "slug",
      "description",
      "excels_at",
      "benefits",
      "type",
      "url",
    ],
  },

  conditions: {
    primaryKey: "id",
    searchableAttributes: [
      "title",
      "description",
      "symptoms",
    ],
    filterableAttributes: ["severity", "type"],
    sortableAttributes: ["title"],
    displayedAttributes: [
      "id",
      "title",
      "slug",
      "description",
      "symptoms",
      "severity",
      "type",
      "url",
    ],
  },

  practitioners: {
    primaryKey: "id",
    searchableAttributes: [
      "title",
      "first_name",
      "last_name",
      "bio",
      "practice_type",
      "address",
    ],
    filterableAttributes: ["practice_type", "type"],
    sortableAttributes: ["title"],
    // MeiliSearch supports geo search natively
    displayedAttributes: [
      "id",
      "title",
      "slug",
      "first_name",
      "last_name",
      "practice_type",
      "bio",
      "address",
      "latitude",
      "longitude",
      "_geo",
      "image",
      "type",
      "url",
    ],
  },

  clinics: {
    primaryKey: "id",
    searchableAttributes: [
      "name",
      "title",
      "description",
      "address",
      "city",
      "state",
      "services",
    ],
    filterableAttributes: ["accepts_insurance", "city", "state", "services", "type"],
    sortableAttributes: ["title", "name"],
    displayedAttributes: [
      "id",
      "title",
      "name",
      "slug",
      "description",
      "phone",
      "email",
      "website",
      "address",
      "city",
      "state",
      "zip_code",
      "services",
      "accepts_insurance",
      "latitude",
      "longitude",
      "_geo",
      "image",
      "type",
      "url",
    ],
  },

  formulas: {
    primaryKey: "id",
    searchableAttributes: [
      "title",
      "chinese_name",
      "pinyin_name",
      "description",
      "use_cases",
      "classic_source",
      "source_author",
    ],
    filterableAttributes: ["source_dynasty", "type"],
    sortableAttributes: ["title"],
    displayedAttributes: [
      "id",
      "title",
      "slug",
      "chinese_name",
      "pinyin_name",
      "description",
      "use_cases",
      "classic_source",
      "source_author",
      "source_dynasty",
      "source_year",
      "image",
      "type",
      "url",
    ],
  },

  // Combined index for global search
  all: {
    primaryKey: "objectID",
    searchableAttributes: [
      "title",
      "name",
      "description",
      "scientific_name",
      "common_names",
      "symptoms",
      "excels_at",
      "therapeutic_uses",
      "latin_name",
      "pinyin_name",
      "tcm_taste",
      "tcm_temperature",
      "tcm_meridians",
      "use_cases",
      "classic_source",
      "practice_type",
      "address",
      "bio",
      "chinese_name",
    ],
    filterableAttributes: [
      "type",
      "tcm_temperature",
      "tcm_taste",
      "tcm_meridians",
      "source_databases",
      "plant_type",
      "parts_used",
      "severity",
      "practice_type",
    ],
    sortableAttributes: ["title"],
    displayedAttributes: ["*"],
  },
};

// ─── Setup ──────────────────────────────────────────────────────────────────

async function setupIndex(name, config) {
  const indexName = `verscienta_${name}`;
  console.log(`\n--- ${indexName} ---`);

  // Create index if it doesn't exist
  try {
    await client.createIndex(indexName, { primaryKey: config.primaryKey });
    console.log(`  + Created index: ${indexName}`);
  } catch (e) {
    if (e.code === "index_already_exists") {
      console.log(`  = Index exists: ${indexName}`);
    } else {
      console.error(`  ! Error creating ${indexName}: ${e.message}`);
      return;
    }
  }

  const index = client.index(indexName);

  // Configure searchable attributes
  if (config.searchableAttributes) {
    const task = await index.updateSearchableAttributes(config.searchableAttributes);
    console.log(`  + Searchable attributes (task ${task.taskUid})`);
  }

  // Configure filterable attributes
  if (config.filterableAttributes) {
    const task = await index.updateFilterableAttributes(config.filterableAttributes);
    console.log(`  + Filterable attributes (task ${task.taskUid})`);
  }

  // Configure sortable attributes
  if (config.sortableAttributes) {
    const task = await index.updateSortableAttributes(config.sortableAttributes);
    console.log(`  + Sortable attributes (task ${task.taskUid})`);
  }

  // Configure ranking rules (only if custom)
  if (config.rankingRules) {
    const task = await index.updateRankingRules(config.rankingRules);
    console.log(`  + Ranking rules (task ${task.taskUid})`);
  }

  // Configure displayed attributes
  if (config.displayedAttributes) {
    const task = await index.updateDisplayedAttributes(config.displayedAttributes);
    console.log(`  + Displayed attributes (task ${task.taskUid})`);
  }

  // Configure typo tolerance
  const task = await index.updateTypoTolerance({
    enabled: true,
    minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
  });
  console.log(`  + Typo tolerance (task ${task.taskUid})`);
}

async function generateSearchApiKey() {
  // Create a search-only API key for the frontend
  try {
    const key = await client.createKey({
      description: "Verscienta frontend search key",
      actions: ["search"],
      indexes: ["verscienta_*"],
      expiresAt: null, // Never expires
    });
    console.log(`\n  Search API Key (for frontend): ${key.key}`);
    console.log(`  Key UID: ${key.uid}`);
    return key;
  } catch (e) {
    if (e.code === "duplicate_index_found" || e.message?.includes("already exists")) {
      console.log("\n  Search API key may already exist. Check MeiliSearch dashboard.");
    } else {
      console.warn(`\n  Could not create search API key: ${e.message}`);
    }
  }
}

async function main() {
  console.log("Verscienta MeiliSearch Setup");
  console.log(`Target: ${MEILI_URL}`);
  console.log("============================");

  // Verify connection
  try {
    const health = await client.health();
    console.log(`Server status: ${health.status}`);
  } catch (e) {
    console.error(`Cannot connect to MeiliSearch at ${MEILI_URL}: ${e.message}`);
    process.exit(1);
  }

  // Create and configure all indices
  for (const [name, config] of Object.entries(indices)) {
    await setupIndex(name, config);
  }

  // Generate search API key
  await generateSearchApiKey();

  // Wait for all tasks to complete
  console.log("\nWaiting for tasks to complete...");
  try {
    // Get recent tasks and wait
    const tasks = await client.getTasks({ limit: 50, statuses: ["enqueued", "processing"] });
    if (tasks.results.length > 0) {
      for (const task of tasks.results) {
        await client.waitForTask(task.uid, { timeOutMs: 30000 });
      }
    }
    console.log("All tasks completed!");
  } catch (e) {
    console.warn(`Task wait warning: ${e.message}`);
  }

  console.log("\n============================");
  console.log("MeiliSearch setup complete!");
  console.log("\nNext steps:");
  console.log("  1. Add MEILI_SEARCH_KEY to your Astro .env (the search-only key above)");
  console.log("  2. The Directus hook will auto-sync content to MeiliSearch on create/update/delete");
  console.log("  3. For initial data load, run: node scripts/sync-to-meilisearch.mjs");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
