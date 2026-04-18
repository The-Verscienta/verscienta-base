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

    // Convert buffer to a readable stream for FilesService.
    const { Readable } = await import("node:stream");
    const stream = Readable.from(buffer);

    // Import into Directus files.
    const filesService = new FilesService({ accountability, schema });
    const fileId = await filesService.uploadOne(stream, {
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
