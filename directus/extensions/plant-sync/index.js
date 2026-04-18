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
