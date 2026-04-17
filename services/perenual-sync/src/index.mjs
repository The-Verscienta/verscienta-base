/**
 * Perenual.com Sync Service
 *
 * Standalone Node.js replacement for the Drupal perenual_sync module.
 * Secondary data source — enriches existing herbs or imports new ones.
 *
 * Rate limit: 100 requests/day (free tier).
 *
 * Usage:
 *   PERENUAL_API_KEY=xxx DIRECTUS_TOKEN=xxx node src/index.mjs
 */

import { createDirectus, rest, staticToken, readItems, createItem, updateItem } from "@directus/sdk";
import { mapPerenualToHerb, enrichHerbFields, hasBenefits } from "./field-mapper.mjs";
import { DailyRateLimiter } from "./rate-limiter.mjs";
import { downloadImage, isUrlSafe } from "./image-handler.mjs";

// ─── Config ─────────────────────────────────────────────────────────────────

const PERENUAL_URL = process.env.PERENUAL_API_URL || "https://perenual.com/api/v2";
const PERENUAL_KEY = process.env.PERENUAL_API_KEY;
const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

const SYNC_IMAGES = process.env.SYNC_IMAGES !== "false";
const UPDATE_EXISTING = process.env.UPDATE_EXISTING === "true";
const SKIP_EXISTING = process.env.SKIP_EXISTING !== "false";
const ITEMS_PER_RUN = parseInt(process.env.ITEMS_PER_RUN || "20");
const START_PAGE = parseInt(process.env.START_PAGE || "1");
const MAX_PAGES = parseInt(process.env.MAX_PAGES || "5");

if (!PERENUAL_KEY) { console.error("PERENUAL_API_KEY required"); process.exit(1); }
if (!DIRECTUS_TOKEN) { console.error("DIRECTUS_TOKEN required"); process.exit(1); }

const directus = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());
const limiter = new DailyRateLimiter(100); // 100 req/day free tier

const stats = { processed: 0, created: 0, updated: 0, enriched: 0, skipped: 0, errors: 0, images: 0 };

// ─── Perenual API ───────────────────────────────────────────────────────────

async function perenualFetch(endpoint, params = {}) {
  if (!limiter.canMakeRequest()) {
    console.log(`  ! Daily rate limit reached (${limiter.getRequestCount()}/100). Stopping.`);
    return null;
  }
  limiter.recordRequest();

  const url = new URL(`${PERENUAL_URL}${endpoint}`);
  url.searchParams.set("key", PERENUAL_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Perenual API ${res.status}: ${text}`);
  }
  return res.json();
}

async function searchPlants(query, page = 1) {
  return perenualFetch("/species-list", { q: query, page });
}

async function getPlantDetails(id) {
  return perenualFetch(`/species/details/${id}`);
}

// ─── Directus Operations ────────────────────────────────────────────────────

async function findExistingHerb(perenualId, scientificName) {
  const byId = await directus.request(readItems("herbs", {
    filter: { perenual_id: { _eq: perenualId } },
    fields: ["id", "title", "scientific_name", "family", "genus", "botanical_description"],
    limit: 1,
  }));
  if (byId.length > 0) return byId[0];

  if (scientificName) {
    const sciName = Array.isArray(scientificName) ? scientificName[0] : scientificName;
    const byName = await directus.request(readItems("herbs", {
      filter: { scientific_name: { _eq: sciName } },
      fields: ["id", "title", "scientific_name", "family", "genus", "botanical_description"],
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
  const perenualId = plantSummary.id;

  try {
    const sciName = Array.isArray(plantSummary.scientific_name) ? plantSummary.scientific_name[0] : plantSummary.scientific_name;
    const existing = await findExistingHerb(perenualId, sciName);

    if (existing && SKIP_EXISTING && !UPDATE_EXISTING) {
      stats.skipped++;
      return;
    }

    // Fetch details (costs 1 API call)
    const details = await getPlantDetails(perenualId);
    if (!details) { stats.errors++; return; }

    if (!hasBenefits(details)) {
      stats.skipped++;
      return;
    }

    // Handle images
    let imageFileId = null;
    if (SYNC_IMAGES && details.default_image?.regular_url) {
      const imgUrl = details.default_image.regular_url || details.default_image.medium_url || details.default_image.original_url;
      if (imgUrl && isUrlSafe(imgUrl)) {
        try {
          const { buffer, mimeType, extension } = await downloadImage(imgUrl);
          const filename = `perenual_${perenualId}_main.${extension}`;
          imageFileId = await uploadImageToDirectus(buffer, filename, mimeType);
          stats.images++;
        } catch (imgErr) {
          console.log(`    ! Image error: ${imgErr.message}`);
        }
      }
    }

    if (existing && UPDATE_EXISTING) {
      // Enrich: only fill empty fields
      const enrichData = enrichHerbFields(existing, details);
      enrichData.perenual_id = perenualId;
      if (Object.keys(enrichData).length > 1) { // more than just perenual_id
        await directus.request(updateItem("herbs", existing.id, enrichData));
        stats.enriched++;
        console.log(`  ↑ Enriched: ${existing.title} (id=${existing.id})`);
      } else {
        stats.skipped++;
      }
    } else if (!existing) {
      const herbData = mapPerenualToHerb(details);
      const created = await directus.request(createItem("herbs", herbData));
      stats.created++;
      console.log(`  + Created: ${herbData.title} (id=${created.id})`);

      // Add image if downloaded
      if (imageFileId) {
        await directus.request(createItem("herb_images", {
          herb_id: created.id,
          file: imageFileId,
          image_type: "whole_plant",
          caption: herbData.title,
        }));
      }
    }
  } catch (err) {
    stats.errors++;
    console.error(`  ! Error syncing perenual_id=${perenualId}: ${err.message}`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.log("Verscienta Perenual Sync");
  console.log(`Perenual API: ${PERENUAL_URL}`);
  console.log(`Directus: ${DIRECTUS_URL}`);
  console.log(`Rate limit: ${limiter.getRemaining()}/100 requests remaining today`);
  console.log("==================================\n");

  let page = START_PAGE;

  for (let p = 0; p < MAX_PAGES; p++) {
    if (!limiter.canMakeRequest()) {
      console.log("Daily rate limit reached. Stopping.");
      break;
    }

    console.log(`\n--- Page ${page} ---`);

    try {
      const result = await perenualFetch("/species-list", { page });
      if (!result) break;

      const plants = result.data || [];
      if (plants.length === 0) {
        console.log("  No more plants.");
        break;
      }

      let count = 0;
      for (const plant of plants) {
        if (!limiter.canMakeRequest()) break;
        if (count >= ITEMS_PER_RUN) break;
        await syncPlant(plant);
        count++;
      }
    } catch (err) {
      console.error(`  ! Page ${page} error: ${err.message}`);
      stats.errors++;
    }

    page++;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n==================================");
  console.log("Sync complete!");
  console.log(`Duration: ${duration}s | API calls remaining: ${limiter.getRemaining()}/100`);
  console.log(`Processed: ${stats.processed} | Created: ${stats.created} | Enriched: ${stats.enriched} | Skipped: ${stats.skipped} | Errors: ${stats.errors} | Images: ${stats.images}`);

  try {
    await directus.request(createItem("import_logs", {
      title: `Perenual Sync - ${new Date().toISOString().slice(0, 10)}`,
      source_db: "perenual.com",
      records_processed: stats.processed,
      records_created: stats.created,
      records_updated: stats.enriched,
      records_skipped: stats.skipped,
      errors: stats.errors > 0 ? `${stats.errors} errors` : null,
      duration_seconds: parseFloat(duration),
    }));
  } catch { /* non-critical */ }
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
