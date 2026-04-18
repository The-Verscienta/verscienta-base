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
