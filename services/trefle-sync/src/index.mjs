/**
 * Trefle.io Sync Service
 *
 * Standalone Node.js replacement for the Drupal trefle_sync module.
 * Paginates through the Trefle API, filters for medicinal/edible plants,
 * maps fields to the Directus herbs collection, and uploads images.
 *
 * Usage:
 *   TREFLE_API_KEY=xxx DIRECTUS_TOKEN=xxx node src/index.mjs
 *
 * Cron (daily):
 *   0 3 * * * cd /opt/verscienta/services/trefle-sync && node src/index.mjs >> /var/log/trefle-sync.log 2>&1
 */

import { createDirectus, rest, staticToken, readItems, createItem, updateItem, uploadFiles } from "@directus/sdk";
import { mapTrefleToHerb, hasMedicinalBenefits } from "./field-mapper.mjs";
import { RateLimiter } from "./rate-limiter.mjs";
import { downloadImage } from "./image-handler.mjs";

// ─── Config ─────────────────────────────────────────────────────────────────

const TREFLE_URL = process.env.TREFLE_API_URL || "https://trefle.io/api/v1";
const TREFLE_KEY = process.env.TREFLE_API_KEY;
const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

const SYNC_IMAGES = process.env.SYNC_IMAGES !== "false";
const UPDATE_EXISTING = process.env.UPDATE_EXISTING === "true";
const SKIP_EXISTING = process.env.SKIP_EXISTING !== "false";
const FILTER_EDIBLE = process.env.FILTER_EDIBLE_ONLY !== "false";
const ITEMS_PER_RUN = parseInt(process.env.ITEMS_PER_RUN || "20");
const START_PAGE = parseInt(process.env.START_PAGE || "1");
const MAX_PAGES = parseInt(process.env.MAX_PAGES || "0"); // 0 = unlimited

if (!TREFLE_KEY) { console.error("TREFLE_API_KEY required"); process.exit(1); }
if (!DIRECTUS_TOKEN) { console.error("DIRECTUS_TOKEN required"); process.exit(1); }

const directus = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());
const limiter = new RateLimiter(120, 60000); // 120 req/min

const stats = { processed: 0, created: 0, updated: 0, skipped: 0, errors: 0, images: 0 };

// ─── Trefle API ─────────────────────────────────────────────────────────────

async function trefleFetch(endpoint, params = {}) {
  await limiter.waitForAvailability();
  limiter.recordRequest();

  const url = new URL(`${TREFLE_URL}${endpoint}`);
  url.searchParams.set("token", TREFLE_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Trefle API ${res.status}: ${text}`);
  }
  return res.json();
}

async function getPlants(page = 1) {
  const params = { page };
  if (FILTER_EDIBLE) {
    params["filter[edible]"] = "true";
  }
  return trefleFetch("/plants", params);
}

async function getPlantDetails(id) {
  return trefleFetch(`/plants/${id}`);
}

// ─── Directus Operations ────────────────────────────────────────────────────

async function findExistingHerb(trefleId, scientificName) {
  // Check by trefle_id first
  const byId = await directus.request(readItems("herbs", {
    filter: { trefle_id: { _eq: trefleId } },
    fields: ["id", "title"],
    limit: 1,
  }));
  if (byId.length > 0) return byId[0];

  // Fallback: check by scientific name
  if (scientificName) {
    const byName = await directus.request(readItems("herbs", {
      filter: { scientific_name: { _eq: scientificName } },
      fields: ["id", "title"],
      limit: 1,
    }));
    if (byName.length > 0) return byName[0];
  }

  return null;
}

async function uploadImageToDirectus(imageBuffer, filename, mimeType) {
  const formData = new FormData();
  formData.append("file", new Blob([imageBuffer], { type: mimeType }), filename);

  const res = await fetch(`${DIRECTUS_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`Image upload failed: ${res.status}`);
  const result = await res.json();
  return result.data.id;
}

// ─── Sync Logic ─────────────────────────────────────────────────────────────

async function syncPlant(plantSummary) {
  stats.processed++;
  const trefleId = plantSummary.id;

  try {
    // Check if already exists
    const existing = await findExistingHerb(trefleId, plantSummary.scientific_name);
    if (existing && SKIP_EXISTING && !UPDATE_EXISTING) {
      stats.skipped++;
      console.log(`  = Skip: ${plantSummary.scientific_name || plantSummary.common_name} (exists: ${existing.id})`);
      return;
    }

    // Fetch full plant details
    const details = await getPlantDetails(trefleId);
    const plantData = details.data;

    if (!plantData) {
      stats.errors++;
      console.log(`  ! No details for trefle_id=${trefleId}`);
      return;
    }

    // Check for medicinal/edible benefits
    if (!hasMedicinalBenefits(plantData)) {
      stats.skipped++;
      return;
    }

    // Map fields
    const herbData = mapTrefleToHerb(plantData);

    // Handle images
    if (SYNC_IMAGES && plantData.images) {
      const imageIds = [];
      const imageTypes = ["flower", "leaf", "habit", "fruit", "bark"];

      for (const type of imageTypes) {
        const imageUrls = plantData.images?.[type] || plantData.main_species?.images?.[type] || [];
        if (imageUrls.length === 0) continue;

        const url = typeof imageUrls[0] === "string" ? imageUrls[0] : imageUrls[0]?.image_url;
        if (!url) continue;

        try {
          const { buffer, mimeType, extension } = await downloadImage(url);
          const filename = `trefle_${trefleId}_${type}.${extension}`;
          const fileId = await uploadImageToDirectus(buffer, filename, mimeType);
          imageIds.push({ file: fileId, image_type: type, caption: `${plantData.common_name || plantData.scientific_name} - ${type}` });
          stats.images++;
        } catch (imgErr) {
          console.log(`    ! Image error (${type}): ${imgErr.message}`);
        }

        if (imageIds.length >= 5) break;
      }

      // Fallback to main image_url
      if (imageIds.length === 0 && plantData.image_url) {
        try {
          const { buffer, mimeType, extension } = await downloadImage(plantData.image_url);
          const filename = `trefle_${trefleId}_main.${extension}`;
          const fileId = await uploadImageToDirectus(buffer, filename, mimeType);
          imageIds.push({ file: fileId, image_type: "whole_plant", caption: plantData.common_name || plantData.scientific_name });
          stats.images++;
        } catch (imgErr) {
          console.log(`    ! Main image error: ${imgErr.message}`);
        }
      }

      // Create herb_images entries after herb creation (see below)
      herbData._imageEntries = imageIds;
    }

    // Create or update in Directus
    const imageEntries = herbData._imageEntries || [];
    delete herbData._imageEntries;

    if (existing && UPDATE_EXISTING) {
      await directus.request(updateItem("herbs", existing.id, herbData));
      stats.updated++;
      console.log(`  ↑ Updated: ${herbData.title} (id=${existing.id})`);
    } else if (!existing) {
      const created = await directus.request(createItem("herbs", herbData));
      stats.created++;
      console.log(`  + Created: ${herbData.title} (id=${created.id})`);

      // Create herb_images entries
      for (const img of imageEntries) {
        await directus.request(createItem("herb_images", { herb_id: created.id, ...img }));
      }
    }
  } catch (err) {
    stats.errors++;
    console.error(`  ! Error syncing trefle_id=${trefleId}: ${err.message}`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.log("Verscienta Trefle Sync");
  console.log(`Trefle API: ${TREFLE_URL}`);
  console.log(`Directus: ${DIRECTUS_URL}`);
  console.log(`Settings: images=${SYNC_IMAGES} update=${UPDATE_EXISTING} skip=${SKIP_EXISTING} edible=${FILTER_EDIBLE}`);
  console.log(`Pages: start=${START_PAGE} max=${MAX_PAGES || "unlimited"} items/page=20`);
  console.log("==================================\n");

  let page = START_PAGE;
  let totalPages = MAX_PAGES || Infinity;
  let pagesProcessed = 0;

  while (page <= totalPages && pagesProcessed < (MAX_PAGES || Infinity)) {
    console.log(`\n--- Page ${page} ---`);

    try {
      const result = await getPlants(page);
      const plants = result.data || [];
      const meta = result.links?.last ? parseInt(new URL(result.links.last).searchParams.get("page") || "1") : page;

      if (totalPages === Infinity && meta > 0) {
        totalPages = meta;
        console.log(`  Total pages: ${totalPages}`);
      }

      if (plants.length === 0) {
        console.log("  No more plants. Done.");
        break;
      }

      let count = 0;
      for (const plant of plants) {
        if (count >= ITEMS_PER_RUN && ITEMS_PER_RUN > 0) break;
        await syncPlant(plant);
        count++;
      }
    } catch (err) {
      console.error(`  ! Page ${page} error: ${err.message}`);
      stats.errors++;
    }

    page++;
    pagesProcessed++;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n==================================");
  console.log("Sync complete!");
  console.log(`Duration: ${duration}s`);
  console.log(`Processed: ${stats.processed} | Created: ${stats.created} | Updated: ${stats.updated} | Skipped: ${stats.skipped} | Errors: ${stats.errors} | Images: ${stats.images}`);

  // Log to Directus import_logs
  try {
    await directus.request(createItem("import_logs", {
      title: `Trefle Sync - ${new Date().toISOString().slice(0, 10)}`,
      source_db: "trefle.io",
      records_processed: stats.processed,
      records_created: stats.created,
      records_updated: stats.updated,
      records_skipped: stats.skipped,
      errors: stats.errors > 0 ? `${stats.errors} errors occurred` : null,
      duration_seconds: parseFloat(duration),
    }));
  } catch {
    // Non-critical
  }
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
