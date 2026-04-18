# Directus Module Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Trefle Sync, Perenual Sync, and Cloudflare Media Offload from Drupal PHP modules to Directus extension hooks.

**Architecture:** Three Directus hooks — a scheduled plant-sync hook (Trefle + Perenual), an event-driven cloudflare-offload hook, and a one-time migration script. Hooks use Directus internal services (ItemsService, FilesService) and follow the same extension pattern as the existing meilisearch-sync hook.

**Tech Stack:** Node.js (ESM), Directus 11 Hook API, native fetch, Directus SDK services

---

### Task 1: Plant Sync — Trefle API Client

**Files:**
- Create: `directus/extensions/hooks/plant-sync/trefle-client.js`
- Create: `directus/extensions/hooks/plant-sync/package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "directus-hook-plant-sync",
  "version": "1.0.0",
  "type": "module",
  "directus:extension": {
    "type": "hook",
    "path": "index.js",
    "host": "^11.0.0"
  }
}
```

- [ ] **Step 2: Create trefle-client.js**

```js
/**
 * Trefle.io API client with sliding-window rate limiting.
 * Rate limit: 120 requests per minute.
 */

const API_BASE = "https://trefle.io/api/v1";
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;

export class TrefleClient {
  constructor(apiKey, logger) {
    this.apiKey = apiKey;
    this.logger = logger;
    this.requestTimestamps = [];
  }

  /** Returns false if rate limit would be exceeded. */
  canRequest() {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < RATE_WINDOW_MS
    );
    return this.requestTimestamps.length < RATE_LIMIT;
  }

  async request(endpoint, params = {}) {
    if (!this.canRequest()) {
      this.logger.warn("Trefle rate limit reached, pausing");
      return null;
    }

    const url = new URL(API_BASE + endpoint);
    url.searchParams.set("token", this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }

    this.requestTimestamps.push(Date.now());

    const res = await fetch(url.href, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Trefle ${endpoint} returned ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json();
  }

  /** Fetch a page of species. */
  async getSpeciesPage(page) {
    return this.request("/species", { page });
  }

  /** Fetch detailed species data. */
  async getSpecies(id) {
    const data = await this.request(`/species/${id}`);
    return data?.data ?? null;
  }

  /** Search plants by query. */
  async search(query, page = 1) {
    return this.request("/plants/search", { q: query, page });
  }
}
```

- [ ] **Step 3: Verify file was created**

Run: `ls directus/extensions/hooks/plant-sync/`
Expected: `package.json  trefle-client.js`

- [ ] **Step 4: Commit**

```bash
git add directus/extensions/hooks/plant-sync/package.json directus/extensions/hooks/plant-sync/trefle-client.js
git commit -m "feat: add Trefle API client for plant sync hook"
```

---

### Task 2: Plant Sync — Perenual API Client

**Files:**
- Create: `directus/extensions/hooks/plant-sync/perenual-client.js`

- [ ] **Step 1: Create perenual-client.js**

```js
/**
 * Perenual.com API client with daily rate limiting.
 * Rate limit: 100 requests per day (free tier).
 */

const API_BASE = "https://perenual.com/api/v2";
const DAILY_LIMIT = 100;

export class PerenualClient {
  constructor(apiKey, logger) {
    this.apiKey = apiKey;
    this.logger = logger;
    this.requestCount = 0;
    this.requestDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  /** Reset counter if day has changed. */
  checkDayReset() {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.requestDate) {
      this.requestCount = 0;
      this.requestDate = today;
    }
  }

  /** Load persisted counter from import_logs. */
  loadCounter(count, date) {
    this.requestCount = count || 0;
    this.requestDate = date || new Date().toISOString().slice(0, 10);
  }

  canRequest() {
    this.checkDayReset();
    return this.requestCount < DAILY_LIMIT;
  }

  getRemainingRequests() {
    this.checkDayReset();
    return DAILY_LIMIT - this.requestCount;
  }

  async request(endpoint, params = {}) {
    if (!this.canRequest()) {
      this.logger.warn("Perenual daily limit reached, skipping enrichment");
      return null;
    }

    const url = new URL(API_BASE + endpoint);
    url.searchParams.set("key", this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }

    this.requestCount++;

    const res = await fetch(url.href, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Perenual ${endpoint} returned ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json();
  }

  /** Search species by scientific name. */
  async searchByName(scientificName) {
    return this.request("/species-list", { q: scientificName });
  }

  /** Get detailed species data. */
  async getSpecies(id) {
    return this.request(`/species/details/${id}`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add directus/extensions/hooks/plant-sync/perenual-client.js
git commit -m "feat: add Perenual API client for plant sync hook"
```

---

### Task 3: Plant Sync — Field Mapper

**Files:**
- Create: `directus/extensions/hooks/plant-sync/field-mapper.js`

This translates the PHP field mapping logic from `backend/web/modules/custom/trefle_sync/src/TrefleFieldMapper.php` and `backend/web/modules/custom/perenual_sync/src/PerenualFieldMapper.php`.

- [ ] **Step 1: Create field-mapper.js**

```js
/**
 * Maps Trefle and Perenual API responses to Directus herb fields.
 * Port of TrefleFieldMapper.php and PerenualFieldMapper.php.
 */

/** Medicinal plant families — plants in these families pass the filter. */
const MEDICINAL_FAMILIES = new Set([
  "Lamiaceae", "Asteraceae", "Apiaceae", "Fabaceae", "Rosaceae",
  "Solanaceae", "Zingiberaceae", "Rubiaceae", "Lauraceae", "Myrtaceae",
  "Rutaceae", "Piperaceae", "Malvaceae", "Cucurbitaceae", "Poaceae",
  "Brassicaceae", "Araceae", "Liliaceae", "Amaryllidaceae", "Ranunculaceae",
  "Valerianaceae", "Papaveraceae",
]);

const HABIT_MAP = {
  tree: "Tree",
  shrub: "Shrub",
  herb: "Herb",
  vine: "Vine",
  grass: "Grass",
  forb: "Herb",
  subshrub: "Shrub",
  graminoid: "Grass",
};

/** Escape HTML entities. */
function esc(val) {
  if (val == null) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escArr(arr) {
  if (!Array.isArray(arr)) return esc(arr);
  return arr.map(esc).join(", ");
}

/**
 * Check if a plant has nutritional or medicinal benefits.
 * Port of TrefleSyncService::hasNutritionalOrMedicinalBenefits().
 */
export function hasPlantBenefits(plant) {
  if (plant.edible === true) return true;
  if (plant.vegetable === true) return true;
  if (Array.isArray(plant.edible_part) && plant.edible_part.length > 0) return true;

  const main = plant.main_species || {};
  if (main.edible === true) return true;
  if (Array.isArray(main.edible_part) && main.edible_part.length > 0) return true;
  if (main.vegetable === true) return true;

  const specs = plant.specifications || main.specifications || {};
  if (specs.edible === true) return true;

  const family = typeof plant.family === "object"
    ? plant.family?.name
    : plant.family;
  if (family && MEDICINAL_FAMILIES.has(family)) return true;

  const mainFamily = typeof main.family === "object"
    ? main.family?.name
    : main.family;
  if (mainFamily && MEDICINAL_FAMILIES.has(mainFamily)) return true;

  return false;
}

/**
 * Map Trefle species data to Directus herb fields.
 * Port of TrefleFieldMapper::mapToNode().
 */
export function mapTrefleToHerb(plant) {
  const family = typeof plant.family === "object"
    ? plant.family?.name
    : plant.family;

  const scientificName = plant.scientific_name || "";
  const speciesPart = scientificName.split(" ")[1] || null;

  const growth = plant.growth || {};
  const habit = growth.habit || plant.growth_habit || null;
  const plantType = habit
    ? HABIT_MAP[habit.toLowerCase()] || habit.charAt(0).toUpperCase() + habit.slice(1)
    : null;

  const native = plant.distribution?.native;
  const nativeRegion = Array.isArray(native)
    ? native.slice(0, 10).join(", ")
    : native || null;

  const commonNames = [];
  if (plant.common_name) {
    commonNames.push({ name: plant.common_name, language: "en" });
  }
  if (Array.isArray(plant.common_names)) {
    for (const [lang, names] of Object.entries(plant.common_names)) {
      if (Array.isArray(names)) {
        for (const n of names) commonNames.push({ name: n, language: lang });
      }
    }
  }

  return {
    title: plant.common_name || plant.scientific_name || "Unknown Plant",
    slug: scientificName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    trefle_id: plant.id,
    scientific_name: scientificName || null,
    family: family || null,
    genus: plant.genus?.name || plant.genus || null,
    species: speciesPart,
    plant_type: plantType,
    native_region: nativeRegion,
    synonyms: plant.synonyms || [],
    conservation_status: plant.status || null,
    botanical_description: buildBotanicalDescription(plant),
    contraindications: buildToxicityWarning(plant),
    parts_used: Array.isArray(plant.edible_part)
      ? plant.edible_part.join(", ")
      : plant.edible_part || null,
    common_names: commonNames.length > 0 ? commonNames : null,
    peer_review_status: "draft",
  };
}

function buildBotanicalDescription(plant) {
  const parts = [];

  if (plant.description) {
    parts.push(`<p>${esc(plant.description)}</p>`);
  }

  const flower = plant.flower || {};
  if (flower.color || flower.conspicuous != null) {
    const fp = [];
    if (flower.color) fp.push("Color: " + escArr(flower.color));
    if (flower.conspicuous != null) fp.push(flower.conspicuous ? "Conspicuous" : "Inconspicuous");
    parts.push(`<p><strong>Flower:</strong> ${fp.join("; ")}</p>`);
  }

  const foliage = plant.foliage || {};
  if (foliage.color || foliage.texture) {
    const fp = [];
    if (foliage.color) fp.push("Color: " + escArr(foliage.color));
    if (foliage.texture) fp.push("Texture: " + esc(foliage.texture));
    parts.push(`<p><strong>Foliage:</strong> ${fp.join("; ")}</p>`);
  }

  const fruit = plant.fruit_or_seed || plant.fruit || {};
  if (fruit.color || fruit.seed_persistence != null) {
    const fp = [];
    if (fruit.color) fp.push("Color: " + escArr(fruit.color));
    if (fruit.seed_persistence != null) fp.push(fruit.seed_persistence ? "Seeds persist" : "Seeds do not persist");
    parts.push(`<p><strong>Fruit/Seed:</strong> ${fp.join("; ")}</p>`);
  }

  return parts.length > 0 ? parts.join("\n") : null;
}

function buildToxicityWarning(plant) {
  if (!plant.toxicity) return null;
  const tox = Array.isArray(plant.toxicity)
    ? plant.toxicity.map(esc).join(", ")
    : esc(plant.toxicity);
  return `<p><strong>Toxicity:</strong> ${tox}</p>`;
}

/**
 * Enrich a Directus herb record with Perenual data.
 * Only fills fields that are empty/null. Non-destructive.
 * Port of PerenualFieldMapper::enrichNode().
 *
 * @param {object} existing - Current herb record from Directus.
 * @param {object} perenual - Perenual API response data.
 * @returns {object|null} - Partial update object, or null if nothing to update.
 */
export function enrichWithPerenual(existing, perenual) {
  const updates = {};
  let hasUpdates = false;

  function setIfEmpty(field, value) {
    if (value != null && (existing[field] == null || existing[field] === "")) {
      updates[field] = value;
      hasUpdates = true;
    }
  }

  setIfEmpty("perenual_id", perenual.id);
  setIfEmpty("plant_type", perenual.type ? perenual.type.charAt(0).toUpperCase() + perenual.type.slice(1) : null);

  if (perenual.origin && Array.isArray(perenual.origin)) {
    setIfEmpty("native_region", perenual.origin.join(", "));
  }

  if (perenual.description) {
    setIfEmpty("botanical_description", `<p>${esc(perenual.description)}</p>`);
  }

  // Contraindications from poisoning data.
  if (perenual.poisonous_to_humans || perenual.poisonous_to_pets) {
    const warnings = [];
    if (perenual.poisonous_to_humans) warnings.push("Poisonous to humans");
    if (perenual.poisonous_to_pets) warnings.push("Poisonous to pets");
    setIfEmpty("contraindications", `<p><strong>Warning:</strong> ${warnings.join(". ")}.</p>`);
  }

  // Parts used from edible parts.
  const edibleParts = [];
  if (perenual.edible_leaf) edibleParts.push("leaf");
  if (perenual.edible_fruit) edibleParts.push("fruit");
  if (perenual.flowers) edibleParts.push("flowers");
  if (edibleParts.length > 0) {
    setIfEmpty("parts_used", edibleParts.join(", "));
  }

  if (perenual.other_name && Array.isArray(perenual.other_name)) {
    setIfEmpty("synonyms", perenual.other_name);
  }

  return hasUpdates ? updates : null;
}
```

- [ ] **Step 2: Commit**

```bash
git add directus/extensions/hooks/plant-sync/field-mapper.js
git commit -m "feat: add field mapper for Trefle/Perenual to Directus herb mapping"
```

---

### Task 4: Plant Sync — Image Handler

**Files:**
- Create: `directus/extensions/hooks/plant-sync/image-handler.js`

- [ ] **Step 1: Create image-handler.js**

Downloads images from Trefle API and creates `herb_images` records in Directus.

```js
/**
 * Downloads images from plant APIs and creates herb_images records.
 * Port of TrefleImageHandler.php.
 */

const MAX_IMAGES = 5;
const IMAGE_TYPE_PRIORITY = ["flower", "leaf", "habit", "fruit", "bark"];

/**
 * Extract image URLs from Trefle plant data, ordered by preference.
 */
export function extractImageUrls(plantData) {
  const images = [];
  const seen = new Set();

  // Check typed image arrays first (preferred order).
  for (const type of IMAGE_TYPE_PRIORITY) {
    const urls = plantData.images?.[type] || [];
    for (const entry of urls) {
      const url = typeof entry === "string" ? entry : entry?.image_url || entry?.url;
      if (url && !seen.has(url)) {
        seen.add(url);
        images.push({ url, type, caption: `${plantData.scientific_name || plantData.common_name || ""} — ${type}` });
      }
    }
  }

  // Fallback: main image_url field.
  if (plantData.image_url && !seen.has(plantData.image_url)) {
    images.push({ url: plantData.image_url, type: "habit", caption: plantData.scientific_name || "" });
  }

  return images.slice(0, MAX_IMAGES);
}

/**
 * Download an image and import it into Directus files,
 * then create a herb_images junction record.
 *
 * @param {object} imageData - { url, type, caption }
 * @param {number} herbId - The herb ID in Directus.
 * @param {object} services - { ItemsService, FilesService, accountability, schema, logger }
 */
export async function importImage(imageData, herbId, { ItemsService, FilesService, accountability, schema, logger }) {
  const { url, type, caption } = imageData;

  try {
    // Download the image.
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      logger.warn(`Failed to download image ${url}: ${res.status}`);
      return false;
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());

    // Extract filename from URL.
    const urlPath = new URL(url).pathname;
    const filename = urlPath.split("/").pop() || `herb-${herbId}-${type}.jpg`;

    // Import into Directus files.
    const filesService = new FilesService({ accountability, schema });
    const fileId = await filesService.uploadOne(buffer, {
      title: caption || filename,
      filename_download: filename,
      type: contentType,
      storage: "local",
    });

    // Create herb_images junction record.
    const herbImagesService = new ItemsService("herb_images", { accountability, schema });
    await herbImagesService.createOne({
      herb_id: herbId,
      file: fileId,
      image_type: type,
      caption: caption || null,
    });

    logger.info(`Imported image for herb ${herbId}: ${type}`);
    return true;
  } catch (e) {
    logger.warn(`Image import failed for herb ${herbId} (${url}): ${e.message}`);
    return false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add directus/extensions/hooks/plant-sync/image-handler.js
git commit -m "feat: add image handler for plant sync"
```

---

### Task 5: Plant Sync — Main Hook Entry Point

**Files:**
- Create: `directus/extensions/hooks/plant-sync/index.js`

- [ ] **Step 1: Create index.js**

This is the main hook that ties everything together — scheduled sync, upsert logic, enrichment, and progress tracking.

```js
/**
 * Directus Hook: Plant Data Sync
 *
 * Scheduled sync from Trefle.io with Perenual.com enrichment.
 * Runs on an interval, processes one batch per tick.
 *
 * Environment variables:
 *   TREFLE_API_KEY        (required)
 *   PERENUAL_API_KEY       (required)
 *   SYNC_INTERVAL_MINUTES  (default: 60)
 *   SYNC_BATCH_SIZE        (default: 20)
 *   SYNC_IMAGES            (default: true)
 */

import { TrefleClient } from "./trefle-client.js";
import { PerenualClient } from "./perenual-client.js";
import { hasPlantBenefits, mapTrefleToHerb, enrichWithPerenual } from "./field-mapper.js";
import { extractImageUrls, importImage } from "./image-handler.js";

export default ({ init, action }, { env, logger, getSchema }) => {
  const TREFLE_KEY = env.TREFLE_API_KEY;
  const PERENUAL_KEY = env.PERENUAL_API_KEY;
  const INTERVAL = (parseInt(env.SYNC_INTERVAL_MINUTES) || 60) * 60_000;
  const BATCH_SIZE = parseInt(env.SYNC_BATCH_SIZE) || 20;
  const SYNC_IMAGES = env.SYNC_IMAGES !== "false";

  if (!TREFLE_KEY) {
    logger.warn("Plant sync disabled: TREFLE_API_KEY not set");
    return;
  }

  const trefle = new TrefleClient(TREFLE_KEY, logger);
  const perenual = PERENUAL_KEY ? new PerenualClient(PERENUAL_KEY, logger) : null;

  let running = false;

  init("app.after", async ({ services }) => {
    const { ItemsService } = services;

    logger.info(`Plant sync enabled: interval=${INTERVAL / 60000}m, batch=${BATCH_SIZE}, images=${SYNC_IMAGES}`);

    // Run first sync after a short delay to let Directus finish starting.
    setTimeout(() => runSync(services), 10_000);

    // Schedule recurring syncs.
    setInterval(() => runSync(services), INTERVAL);
  });

  async function runSync(services) {
    if (running) {
      logger.info("Plant sync: previous run still active, skipping");
      return;
    }
    running = true;

    try {
      const schema = await getSchema();
      const accountability = { admin: true };
      const { ItemsService, FilesService } = services;

      // Read sync state from import_logs.
      const logsService = new ItemsService("import_logs", { accountability, schema });
      const logs = await logsService.readByQuery({
        filter: { source_db: { _eq: "trefle" } },
        sort: ["-id"],
        limit: 1,
      });

      let lastPage = 0;
      let totalImported = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalFailed = 0;
      let logId = null;

      if (logs.length > 0) {
        const log = logs[0];
        // Parse last_page from the title field (e.g., "trefle sync page 42")
        const pageMatch = log.title?.match(/page (\d+)/);
        lastPage = pageMatch ? parseInt(pageMatch[1]) : 0;
        totalImported = log.records_created || 0;
        totalUpdated = log.records_updated || 0;
        totalSkipped = log.records_skipped || 0;
        totalFailed = 0;
        logId = log.id;
      }

      const nextPage = lastPage + 1;
      logger.info(`Plant sync: fetching page ${nextPage}`);

      // Fetch a page of species from Trefle.
      const response = await trefle.getSpeciesPage(nextPage);
      if (!response || !response.data || response.data.length === 0) {
        logger.info("Plant sync: no more pages, sync complete");
        if (logId) {
          await logsService.updateOne(logId, {
            title: `trefle sync complete (${totalImported + totalUpdated} total)`,
          });
        }
        running = false;
        return;
      }

      const plants = response.data.slice(0, BATCH_SIZE);
      let batchImported = 0;
      let batchUpdated = 0;
      let batchSkipped = 0;
      let batchFailed = 0;
      const errors = [];

      const herbsService = new ItemsService("herbs", { accountability, schema });

      for (const plant of plants) {
        try {
          // Filter: skip plants without benefits.
          if (!hasPlantBenefits(plant)) {
            batchSkipped++;
            continue;
          }

          // Fetch detailed species data.
          let speciesData = plant;
          if (plant.id && trefle.canRequest()) {
            const detailed = await trefle.getSpecies(plant.id);
            if (detailed) {
              speciesData = { ...plant, ...detailed };
            }
          } else if (!trefle.canRequest()) {
            logger.info("Plant sync: Trefle rate limit reached, stopping batch");
            break;
          }

          // Map to Directus fields.
          const herbData = mapTrefleToHerb(speciesData);

          // Check if herb already exists (by trefle_id or scientific_name).
          const existing = await herbsService.readByQuery({
            filter: {
              _or: [
                { trefle_id: { _eq: speciesData.id } },
                ...(herbData.scientific_name
                  ? [{ scientific_name: { _eq: herbData.scientific_name } }]
                  : []),
              ],
            },
            limit: 1,
          });

          let herbId;
          if (existing.length > 0) {
            // Update existing — but don't overwrite fields that already have data.
            herbId = existing[0].id;
            const updateData = {};
            for (const [key, val] of Object.entries(herbData)) {
              if (val != null && (existing[0][key] == null || existing[0][key] === "")) {
                updateData[key] = val;
              }
            }
            // Always update trefle_id if missing.
            if (!existing[0].trefle_id) updateData.trefle_id = speciesData.id;

            if (Object.keys(updateData).length > 0) {
              await herbsService.updateOne(herbId, updateData);
              batchUpdated++;
            } else {
              batchSkipped++;
            }
          } else {
            // Create new herb.
            herbId = await herbsService.createOne(herbData);
            batchImported++;
          }

          // Import images.
          if (SYNC_IMAGES && herbId) {
            const imageUrls = extractImageUrls(speciesData);
            if (imageUrls.length > 0) {
              // Check if herb already has images.
              const herbImagesService = new ItemsService("herb_images", { accountability, schema });
              const existingImages = await herbImagesService.readByQuery({
                filter: { herb_id: { _eq: herbId } },
                limit: 1,
              });

              if (existingImages.length === 0) {
                for (const img of imageUrls) {
                  await importImage(img, herbId, {
                    ItemsService, FilesService, accountability, schema, logger,
                  });
                }
              }
            }
          }

          // Perenual enrichment for herbs with missing data.
          if (perenual && perenual.canRequest()) {
            const currentHerb = await herbsService.readOne(herbId);
            const emptyFields = ["plant_type", "native_region", "botanical_description", "parts_used"]
              .some((f) => !currentHerb[f]);

            if (emptyFields && currentHerb.scientific_name) {
              try {
                const searchResult = await perenual.searchByName(currentHerb.scientific_name);
                const match = searchResult?.data?.[0];
                if (match) {
                  const detail = await perenual.getSpecies(match.id);
                  if (detail) {
                    const enrichment = enrichWithPerenual(currentHerb, detail);
                    if (enrichment) {
                      await herbsService.updateOne(herbId, enrichment);
                      logger.info(`Enriched herb ${herbId} with Perenual data`);
                    }
                  }
                }
              } catch (e) {
                logger.warn(`Perenual enrichment failed for herb ${herbId}: ${e.message}`);
              }
            }
          }
        } catch (e) {
          batchFailed++;
          errors.push(`Plant ${plant.id}: ${e.message}`);
          logger.error(`Plant sync error for ${plant.id}: ${e.message}`);
        }
      }

      // Update import_logs.
      const logData = {
        title: `trefle sync page ${nextPage}`,
        source_db: "trefle",
        records_created: totalImported + batchImported,
        records_updated: totalUpdated + batchUpdated,
        records_skipped: totalSkipped + batchSkipped,
        records_processed: plants.length,
        errors: errors.length > 0 ? errors.join("\n") : null,
        duration_seconds: 0,
      };

      if (logId) {
        await logsService.updateOne(logId, logData);
      } else {
        await logsService.createOne(logData);
      }

      logger.info(
        `Plant sync page ${nextPage}: +${batchImported} new, ~${batchUpdated} updated, =${batchSkipped} skipped, !${batchFailed} failed`
      );
    } catch (e) {
      logger.error(`Plant sync error: ${e.message}`);
    } finally {
      running = false;
    }
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add directus/extensions/hooks/plant-sync/index.js
git commit -m "feat: add plant sync hook entry point with scheduled import"
```

---

### Task 6: Cloudflare Offload — API Client and Retry Helper

**Files:**
- Create: `directus/extensions/hooks/cloudflare-offload/package.json`
- Create: `directus/extensions/hooks/cloudflare-offload/cloudflare-client.js`
- Create: `directus/extensions/hooks/cloudflare-offload/retry.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "directus-hook-cloudflare-offload",
  "version": "1.0.0",
  "type": "module",
  "directus:extension": {
    "type": "hook",
    "path": "index.js",
    "host": "^11.0.0"
  }
}
```

- [ ] **Step 2: Create retry.js**

```js
/**
 * Retry with exponential backoff.
 */
export async function withRetry(fn, { maxAttempts = 3, logger } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        if (logger) logger.warn(`Retry ${attempt}/${maxAttempts} in ${delay}ms: ${e.message}`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
```

- [ ] **Step 3: Create cloudflare-client.js**

```js
/**
 * Cloudflare Images API client.
 * Port of CloudflareApiClient.php.
 */

const API_BASE = "https://api.cloudflare.com/client/v4";
const DELIVERY_BASE = "https://imagedelivery.net";

export class CloudflareImagesClient {
  constructor(token, accountId, accountHash, logger) {
    this.token = token;
    this.accountId = accountId;
    this.accountHash = accountHash;
    this.logger = logger;
  }

  /** Build the delivery URL for an image. */
  deliveryUrl(imageId) {
    return `${DELIVERY_BASE}/${this.accountHash}/${imageId}`;
  }

  /**
   * Upload an image to Cloudflare Images.
   * @param {Buffer} buffer - Image data.
   * @param {string} filename - Original filename.
   * @param {object} metadata - Key-value metadata.
   * @returns {object} - { id, deliveryUrl }
   */
  async upload(buffer, filename, metadata = {}) {
    const formData = new FormData();
    formData.append("file", new Blob([buffer]), filename);

    if (Object.keys(metadata).length > 0) {
      formData.append("metadata", JSON.stringify(metadata));
    }

    const res = await fetch(
      `${API_BASE}/accounts/${this.accountId}/images/v1`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}` },
        body: formData,
        signal: AbortSignal.timeout(60_000),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Cloudflare upload failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const imageId = data.result?.id;
    if (!imageId) throw new Error("Cloudflare upload returned no image ID");

    return {
      id: imageId,
      deliveryUrl: this.deliveryUrl(imageId),
    };
  }

  /**
   * Delete an image from Cloudflare Images.
   * @param {string} imageId - Cloudflare image ID.
   */
  async delete(imageId) {
    const res = await fetch(
      `${API_BASE}/accounts/${this.accountId}/images/v1/${imageId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.token}` },
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => "");
      throw new Error(`Cloudflare delete failed (${res.status}): ${text.slice(0, 200)}`);
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add directus/extensions/hooks/cloudflare-offload/
git commit -m "feat: add Cloudflare Images API client and retry helper"
```

---

### Task 7: Cloudflare Offload — Main Hook Entry Point

**Files:**
- Create: `directus/extensions/hooks/cloudflare-offload/index.js`

- [ ] **Step 1: Create index.js**

```js
/**
 * Directus Hook: Cloudflare Images Offload
 *
 * Automatically uploads files to Cloudflare Images on upload,
 * and deletes from Cloudflare on file deletion. Hybrid mode:
 * local file is kept as fallback.
 *
 * Environment variables:
 *   CLOUDFLARE_IMAGES_TOKEN   (required)
 *   CLOUDFLARE_ACCOUNT_ID     (required)
 *   CLOUDFLARE_ACCOUNT_HASH   (required)
 *   CLOUDFLARE_RETRY_ATTEMPTS (default: 3)
 */

import { CloudflareImagesClient } from "./cloudflare-client.js";
import { withRetry } from "./retry.js";

export default ({ init, action, filter }, { env, logger, getSchema }) => {
  const TOKEN = env.CLOUDFLARE_IMAGES_TOKEN;
  const ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
  const ACCOUNT_HASH = env.CLOUDFLARE_ACCOUNT_HASH;
  const MAX_RETRIES = parseInt(env.CLOUDFLARE_RETRY_ATTEMPTS) || 3;

  if (!TOKEN || !ACCOUNT_ID || !ACCOUNT_HASH) {
    logger.warn("Cloudflare offload disabled: CLOUDFLARE_IMAGES_TOKEN, CLOUDFLARE_ACCOUNT_ID, or CLOUDFLARE_ACCOUNT_HASH not set");
    return;
  }

  const cf = new CloudflareImagesClient(TOKEN, ACCOUNT_ID, ACCOUNT_HASH, logger);

  logger.info("Cloudflare Images offload enabled");

  // Ensure custom fields exist on directus_files.
  init("app.after", async ({ services }) => {
    try {
      const schema = await getSchema();
      const { FieldsService } = services;
      const fieldsService = new FieldsService({ accountability: { admin: true }, schema });

      const existingFields = await fieldsService.readAll("directus_files");
      const fieldNames = existingFields.map((f) => f.field);

      if (!fieldNames.includes("cloudflare_image_id")) {
        await fieldsService.createField("directus_files", {
          field: "cloudflare_image_id",
          type: "string",
          meta: { interface: "input", hidden: true },
          schema: { is_nullable: true },
        });
        logger.info("Created field: directus_files.cloudflare_image_id");
      }

      if (!fieldNames.includes("cloudflare_url")) {
        await fieldsService.createField("directus_files", {
          field: "cloudflare_url",
          type: "string",
          meta: { interface: "input", hidden: true },
          schema: { is_nullable: true },
        });
        logger.info("Created field: directus_files.cloudflare_url");
      }
    } catch (e) {
      logger.error(`Failed to ensure Cloudflare fields: ${e.message}`);
    }
  });

  // Upload to Cloudflare after file is saved locally.
  action("files.upload", async ({ key, payload }, { database, schema, accountability }) => {
    try {
      // Read the file record.
      const files = await database("directus_files").where({ id: key }).select("*");
      const file = files[0];
      if (!file) return;

      // Only process image types.
      if (!file.type?.startsWith("image/")) return;

      // Read file data from local storage.
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const storageRoot = env.STORAGE_LOCAL_ROOT || "/directus/uploads";
      const filePath = path.join(storageRoot, file.filename_disk);

      let buffer;
      try {
        buffer = await fs.readFile(filePath);
      } catch (e) {
        logger.warn(`Cannot read local file for Cloudflare upload: ${filePath}: ${e.message}`);
        return;
      }

      // Upload to Cloudflare with retry.
      const result = await withRetry(
        () => cf.upload(buffer, file.filename_download || file.filename_disk, {
          directus_file_id: key,
          original_filename: file.filename_download,
        }),
        { maxAttempts: MAX_RETRIES, logger }
      );

      // Store Cloudflare ID and URL on the file record.
      await database("directus_files").where({ id: key }).update({
        cloudflare_image_id: result.id,
        cloudflare_url: result.deliveryUrl,
      });

      logger.info(`Uploaded to Cloudflare: ${file.filename_download} -> ${result.id}`);
    } catch (e) {
      // Upload failed after retries — file stays local-only.
      logger.error(`Cloudflare upload failed for file ${key}: ${e.message}`);
    }
  });

  // Delete from Cloudflare when file is deleted.
  filter("files.delete", async (keys, _meta, { database }) => {
    for (const key of keys) {
      try {
        const files = await database("directus_files").where({ id: key }).select("cloudflare_image_id");
        const file = files[0];
        if (file?.cloudflare_image_id) {
          await cf.delete(file.cloudflare_image_id);
          logger.info(`Deleted from Cloudflare: ${file.cloudflare_image_id}`);
        }
      } catch (e) {
        // Don't block deletion if Cloudflare delete fails.
        logger.warn(`Cloudflare delete failed for file ${key}: ${e.message}`);
      }
    }
    return keys;
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add directus/extensions/hooks/cloudflare-offload/index.js
git commit -m "feat: add Cloudflare Images offload hook with upload/delete lifecycle"
```

---

### Task 8: Cloudflare Bulk Migration Script

**Files:**
- Create: `directus/scripts/migrate-to-cloudflare.mjs`

- [ ] **Step 1: Create migrate-to-cloudflare.mjs**

```js
/**
 * One-time migration: upload all existing local files to Cloudflare Images.
 * Skips files that already have a cloudflare_image_id.
 *
 * Usage: DIRECTUS_URL=... DIRECTUS_TOKEN=... CLOUDFLARE_IMAGES_TOKEN=... \
 *        CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_ACCOUNT_HASH=... \
 *        node scripts/migrate-to-cloudflare.mjs
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const CF_TOKEN = process.env.CLOUDFLARE_IMAGES_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_ACCOUNT_HASH = process.env.CLOUDFLARE_ACCOUNT_HASH;

if (!DIRECTUS_TOKEN || !CF_TOKEN || !CF_ACCOUNT_ID || !CF_ACCOUNT_HASH) {
  console.error("Required env vars: DIRECTUS_TOKEN, CLOUDFLARE_IMAGES_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCOUNT_HASH");
  process.exit(1);
}

const CF_API = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`;
const CF_DELIVERY = `https://imagedelivery.net/${CF_ACCOUNT_HASH}`;

async function main() {
  console.log("Cloudflare Images Migration");
  console.log(`Directus: ${DIRECTUS_URL}`);

  // Fetch all image files without a cloudflare_image_id.
  let page = 1;
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  while (true) {
    const res = await fetch(
      `${DIRECTUS_URL}/files?filter[type][_starts_with]=image&filter[cloudflare_image_id][_null]=true&limit=50&page=${page}`,
      { headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
    );
    const data = await res.json();
    const files = data.data || [];

    if (files.length === 0) break;

    for (const file of files) {
      try {
        // Download from Directus.
        const dlRes = await fetch(`${DIRECTUS_URL}/assets/${file.id}`, {
          headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
        });
        if (!dlRes.ok) {
          console.log(`  ! ${file.filename_download}: download failed (${dlRes.status})`);
          failed++;
          continue;
        }

        const buffer = Buffer.from(await dlRes.arrayBuffer());

        // Upload to Cloudflare.
        const formData = new FormData();
        formData.append("file", new Blob([buffer]), file.filename_download || "image.jpg");
        formData.append("metadata", JSON.stringify({ directus_file_id: file.id }));

        const cfRes = await fetch(CF_API, {
          method: "POST",
          headers: { Authorization: `Bearer ${CF_TOKEN}` },
          body: formData,
        });

        if (!cfRes.ok) {
          const errText = await cfRes.text().catch(() => "");
          console.log(`  ! ${file.filename_download}: CF upload failed (${cfRes.status}): ${errText.slice(0, 100)}`);
          failed++;
          continue;
        }

        const cfData = await cfRes.json();
        const imageId = cfData.result?.id;

        // Update Directus file record.
        await fetch(`${DIRECTUS_URL}/files/${file.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${DIRECTUS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cloudflare_image_id: imageId,
            cloudflare_url: `${CF_DELIVERY}/${imageId}`,
          }),
        });

        uploaded++;
        console.log(`  + ${file.filename_download} -> ${imageId}`);
      } catch (e) {
        failed++;
        console.log(`  ! ${file.filename_download}: ${e.message}`);
      }

      // Rate limit: 200ms between uploads.
      await new Promise((r) => setTimeout(r, 200));
    }

    page++;
  }

  console.log(`\nDone: ${uploaded} uploaded, ${skipped} skipped, ${failed} failed`);
}

main();
```

- [ ] **Step 2: Commit**

```bash
git add directus/scripts/migrate-to-cloudflare.mjs
git commit -m "feat: add one-time Cloudflare Images migration script"
```

---

### Task 9: Frontend — Cloudflare Image URL Support

**Files:**
- Modify: `astro/src/pages/herbs/index.astro:92-99`
- Modify: `astro/src/pages/herbs/[id].astro:104-110`

Update the Astro frontend to use Cloudflare delivery URLs when available, with fallback to Directus `/assets/`.

- [ ] **Step 1: Create a shared image URL helper**

Create: `astro/src/lib/image-url.ts`

```ts
/**
 * Build an image URL, preferring Cloudflare delivery if available.
 */
const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL;

export function imageUrl(
  file: { cloudflare_url?: string; id?: string } | string,
  params: { width?: number; height?: number; fit?: string; format?: string } = {}
): string {
  const { width, height, fit = "cover", format = "webp" } = params;

  // If file is a string (just an ID), use Directus assets.
  if (typeof file === "string") {
    const qs = new URLSearchParams();
    if (width) qs.set("width", String(width));
    if (height) qs.set("height", String(height));
    qs.set("fit", fit);
    qs.set("format", format);
    return `${directusUrl}/assets/${file}?${qs}`;
  }

  // Prefer Cloudflare URL.
  if (file.cloudflare_url) {
    const parts = [];
    if (width) parts.push(`w=${width}`);
    if (height) parts.push(`h=${height}`);
    parts.push(`fit=${fit}`);
    parts.push(`format=${format}`);
    return `${file.cloudflare_url}/${parts.join(",")}`;
  }

  // Fallback to Directus assets.
  const id = file.id || "";
  const qs = new URLSearchParams();
  if (width) qs.set("width", String(width));
  if (height) qs.set("height", String(height));
  qs.set("fit", fit);
  qs.set("format", format);
  return `${directusUrl}/assets/${id}?${qs}`;
}
```

- [ ] **Step 2: Update herbs/index.astro to use the helper**

In `astro/src/pages/herbs/index.astro`, add the import and update the image tag.

Add import at the top (inside the frontmatter):
```ts
import { imageUrl } from "@/lib/image-url";
```

Replace the image `src` attribute (line 95):
```
src={imageUrl(herb.images[0].file, { width: 400, height: 300 })}
```

- [ ] **Step 3: Update herbs/[id].astro to use the helper**

In `astro/src/pages/herbs/[id].astro`, add the import and update the image tag.

Add import at the top (inside the frontmatter):
```ts
import { imageUrl } from "@/lib/image-url";
```

Replace the image `src` attribute (line 107):
```
src={imageUrl(herb.images[0].file, { width: 640, height: 640 })}
```

- [ ] **Step 4: Commit**

```bash
git add astro/src/lib/image-url.ts astro/src/pages/herbs/index.astro astro/src/pages/herbs/\[id\].astro
git commit -m "feat: add Cloudflare image URL support with Directus fallback"
```

---

### Task 10: Docker Compose — Add Environment Variables

**Files:**
- Modify: `directus/docker-compose.yml`
- Modify: `directus/.env.example`

- [ ] **Step 1: Add env vars to .env.example**

Append to `directus/.env.example`:

```
# Plant sync
TREFLE_API_KEY=
PERENUAL_API_KEY=
SYNC_INTERVAL_MINUTES=60
SYNC_BATCH_SIZE=20
SYNC_IMAGES=true

# Cloudflare Images offload
CLOUDFLARE_IMAGES_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ACCOUNT_HASH=
CLOUDFLARE_RETRY_ATTEMPTS=3
```

- [ ] **Step 2: Add env vars to docker-compose.yml directus service**

Add the new environment variables to the Directus service's `environment` section:

```yaml
TREFLE_API_KEY: ${TREFLE_API_KEY:-}
PERENUAL_API_KEY: ${PERENUAL_API_KEY:-}
SYNC_INTERVAL_MINUTES: ${SYNC_INTERVAL_MINUTES:-60}
SYNC_BATCH_SIZE: ${SYNC_BATCH_SIZE:-20}
SYNC_IMAGES: ${SYNC_IMAGES:-true}
CLOUDFLARE_IMAGES_TOKEN: ${CLOUDFLARE_IMAGES_TOKEN:-}
CLOUDFLARE_ACCOUNT_ID: ${CLOUDFLARE_ACCOUNT_ID:-}
CLOUDFLARE_ACCOUNT_HASH: ${CLOUDFLARE_ACCOUNT_HASH:-}
CLOUDFLARE_RETRY_ATTEMPTS: ${CLOUDFLARE_RETRY_ATTEMPTS:-3}
```

- [ ] **Step 3: Commit**

```bash
git add directus/.env.example directus/docker-compose.yml
git commit -m "feat: add plant sync and Cloudflare env vars to Docker config"
```

---

### Task 11: Manual Verification

- [ ] **Step 1: Verify all hook files exist**

Run: `find directus/extensions/hooks -type f | sort`

Expected:
```
directus/extensions/hooks/cloudflare-offload/cloudflare-client.js
directus/extensions/hooks/cloudflare-offload/index.js
directus/extensions/hooks/cloudflare-offload/package.json
directus/extensions/hooks/cloudflare-offload/retry.js
directus/extensions/hooks/geocoding/index.js
directus/extensions/hooks/geocoding/package.json
directus/extensions/hooks/meilisearch-sync/index.js
directus/extensions/hooks/meilisearch-sync/package.json
directus/extensions/hooks/plant-sync/field-mapper.js
directus/extensions/hooks/plant-sync/image-handler.js
directus/extensions/hooks/plant-sync/index.js
directus/extensions/hooks/plant-sync/package.json
directus/extensions/hooks/plant-sync/perenual-client.js
directus/extensions/hooks/plant-sync/trefle-client.js
```

- [ ] **Step 2: Verify no syntax errors**

Run: `node --check directus/extensions/hooks/plant-sync/index.js && node --check directus/extensions/hooks/cloudflare-offload/index.js && echo "All OK"`

Expected: `All OK`

- [ ] **Step 3: Verify migration script**

Run: `node --check directus/scripts/migrate-to-cloudflare.mjs && echo "OK"`

Expected: `OK`
