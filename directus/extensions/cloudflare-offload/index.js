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

export default ({ init, action, filter }, { env, logger, getSchema, services }) => {
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
  init("app.after", async () => {
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
