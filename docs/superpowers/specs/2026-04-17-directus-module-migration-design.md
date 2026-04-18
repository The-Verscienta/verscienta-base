# Directus Module Migration Design

Migrate three Drupal modules to Directus extension hooks: Trefle Sync, Perenual Sync, and Cloudflare Media Offload.

## Scope

| Module | Type | Trigger |
|---|---|---|
| Trefle Sync | Scheduled hook | Interval timer (default 60 min) |
| Perenual Sync | Called by Trefle hook | On-demand enrichment for herbs with missing fields |
| Cloudflare Media Offload | Event hook | `files.upload` and `files.delete` events |

OIDC Discovery is out of scope.

## 1. Trefle + Perenual Sync Hook

### Extension Location

`directus/extensions/hooks/plant-sync/index.js`

Shared helpers in the same directory:
- `trefle-client.js` — Trefle API client with rate limiting
- `perenual-client.js` — Perenual API client with rate limiting
- `field-mapper.js` — Maps API responses to Directus herb fields
- `image-handler.js` — Downloads and creates `herb_images` records

### Trigger

Runs on Directus `init` event, sets up a `setInterval` timer based on `SYNC_INTERVAL_MINUTES`. Each tick processes one batch of plants.

### Data Flow

1. Read last synced page from `import_logs` collection
2. Fetch next page from Trefle API (`GET /plants?page={N}&token={key}`)
3. For each plant, fetch species detail (`GET /species/{id}`)
4. Filter: keep only plants that are edible, vegetable, or belong to a medicinal family
5. Map Trefle fields to Directus herb fields (see field mapping below)
6. Upsert herb in Directus via `ItemsService` (match on `trefle_id`)
7. If `SYNC_IMAGES` is true, download up to 5 images (preference: flower, leaf, habit, fruit, bark) and create `herb_images` records
8. For herbs with empty fields, call Perenual enrichment
9. Update `import_logs` with page number, timestamp, counts

### Perenual Enrichment

Called for each herb that has empty fields after Trefle import:

1. Search Perenual by scientific name (`GET /species-list?q={scientific_name}`)
2. Fetch species detail (`GET /species/details/{id}`)
3. Only fill fields that are currently empty (non-destructive)
4. Additional fields from Perenual: care_level, hardiness zones, poisoning data, watering, sunlight

### Field Mapping: Trefle to Directus

| Trefle Field | Directus Field | Transform |
|---|---|---|
| `id` | `trefle_id` | Direct |
| `common_name` | `title` | Direct |
| `scientific_name` | `scientific_name` | Direct |
| `family.name` | `family` | Extract `.name` string |
| `genus` | `genus` | Direct |
| `scientific_name` (2nd word) | `species` | Split and take second word |
| `growth.habit` | `plant_type` | Map: tree->Tree, shrub->Shrub, herb->Herb |
| `distribution.native` | `native_region` | Join array, limit 10 |
| `synonyms` | `synonyms` | JSON array |
| `status` | `conservation_status` | Direct |
| `description` + `flower.*` + `foliage.*` | `botanical_description` | Composite HTML |
| `toxicity` | `contraindications` | Wrap as HTML warning |
| `edible_part` | `parts_used` | Join array |
| `common_names` | `common_names` | JSON array with `{name, language}` |

### Field Mapping: Perenual to Directus (Enrichment Only)

| Perenual Field | Directus Field | Transform |
|---|---|---|
| `id` | `perenual_id` | Direct |
| `type` | `plant_type` | Capitalize |
| `origin` | `native_region` | Join array |
| `description` | `botanical_description` | HTML paragraph |
| `poisonous_to_humans` | `contraindications` | HTML warning |
| `edible_leaf`, `edible_fruit` | `parts_used` | Join checked parts |
| `other_name` | `synonyms` | JSON array |

All Perenual mappings are non-destructive: only applied if the target field is empty.

### Medicinal Family Filter

Plants are kept if they match any of these criteria:
- `edible` is true
- `vegetable` is true
- `edible_part` is non-empty
- Family is in the medicinal families list: Lamiaceae, Asteraceae, Apiaceae, Fabaceae, Rosaceae, Solanaceae, Zingiberaceae, Rubiaceae, Lauraceae, Myrtaceae, Rutaceae, Piperaceae, Malvaceae, Cucurbitaceae, Poaceae, Brassicaceae, Araceae, Liliaceae, Amaryllidaceae, Ranunculaceae

### Rate Limiting

- **Trefle:** 120 requests per minute. In-memory sliding window counter. If limit hit, stop processing and resume on next tick.
- **Perenual:** 100 requests per day. Counter stored in `import_logs` (persists across restarts), resets at midnight UTC. If limit hit, skip enrichment for remaining herbs in batch.

### Resumability

The hook stores sync state in the `import_logs` collection:
- `source`: "trefle" or "perenual"
- `last_page`: last successfully completed page number
- `total_imported`: running count
- `total_updated`: running count
- `total_skipped`: running count
- `total_failed`: running count
- `last_run`: timestamp
- `status`: "running", "paused", "completed", "error"
- `error_message`: last error if any

On startup, the hook reads the last log entry to determine where to resume.

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `TREFLE_API_KEY` | Yes | — | Trefle.io API token |
| `PERENUAL_API_KEY` | Yes | — | Perenual.com API key |
| `SYNC_INTERVAL_MINUTES` | No | 60 | Minutes between sync runs |
| `SYNC_BATCH_SIZE` | No | 20 | Plants per batch |
| `SYNC_IMAGES` | No | true | Download and attach images |

---

## 2. Cloudflare Media Offload Hook

### Extension Location

`directus/extensions/hooks/cloudflare-offload/index.js`

Helpers:
- `cloudflare-client.js` — Cloudflare Images API client
- `retry.js` — Retry logic with exponential backoff

### Trigger

Listens to Directus action events:
- `files.upload` — upload to Cloudflare after local save
- `files.delete` — delete from Cloudflare

### Data Flow: Upload

1. `files.upload` event fires with file key
2. Read the file from local storage via `AssetsService`
3. Upload to Cloudflare Images API (`POST /accounts/{accountId}/images/v1`)
   - Include metadata: `directus_file_id`, `original_filename`
   - Cloudflare returns an image ID
4. Update the `directus_files` record with:
   - `cloudflare_image_id`: the Cloudflare image ID
   - `cloudflare_url`: `https://imagedelivery.net/{accountHash}/{imageId}`
5. Keep local file intact (hybrid mode)

### Data Flow: Delete

1. `files.delete` event fires with file key
2. Read `cloudflare_image_id` from the file record
3. If present, call Cloudflare delete (`DELETE /accounts/{accountId}/images/v1/{imageId}`)
4. Proceed with Directus local deletion

### Retry Logic

- On upload failure, retry up to `CLOUDFLARE_RETRY_ATTEMPTS` times
- Exponential backoff: 1s, 2s, 4s
- After final failure, log error; file stays local-only (`cloudflare_image_id` remains null)
- No retry on delete failure (log and move on)

### Schema Changes

Two fields added to `directus_files` collection:

| Field | Type | Nullable | Description |
|---|---|---|---|
| `cloudflare_image_id` | string | Yes | Cloudflare image identifier |
| `cloudflare_url` | string | Yes | Full delivery URL |

These fields are created by the hook on Directus `init` if they don't exist.

### Frontend Integration

The Astro frontend uses the Cloudflare URL when available:

```
const imageUrl = file.cloudflare_url
  ? `${file.cloudflare_url}/w=400,h=300,fit=cover,format=webp`
  : `${directusUrl}/assets/${file.id}?width=400&height=300&fit=cover&format=webp`;
```

This requires a small update to herb listing and detail pages.

### Bulk Migration Script

`directus/scripts/migrate-to-cloudflare.mjs`

One-time script to upload all existing local files:
1. Fetch all files from `directus_files` where `cloudflare_image_id` is null
2. For each, read from local storage and upload to Cloudflare
3. Update the record with Cloudflare ID and URL
4. Rate limited to avoid overwhelming the API
5. Logs progress and can resume (skips files that already have a Cloudflare ID)

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `CLOUDFLARE_IMAGES_TOKEN` | Yes | — | Cloudflare API bearer token |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | — | Cloudflare account ID |
| `CLOUDFLARE_ACCOUNT_HASH` | Yes | — | Account hash for delivery URLs |
| `CLOUDFLARE_RETRY_ATTEMPTS` | No | 3 | Max upload retry attempts |

---

## 3. File Structure

```
directus/extensions/hooks/
  plant-sync/
    index.js              # Hook entry: schedule, orchestrate
    trefle-client.js      # Trefle API client + rate limiter
    perenual-client.js    # Perenual API client + rate limiter
    field-mapper.js       # API response -> Directus fields
    image-handler.js      # Download images, create herb_images
    package.json
  cloudflare-offload/
    index.js              # Hook entry: file event listeners
    cloudflare-client.js  # Cloudflare Images API client
    retry.js              # Retry with exponential backoff
    package.json

directus/scripts/
  migrate-to-cloudflare.mjs  # One-time bulk upload script
```

## 4. Error Handling

- All API calls wrapped in try/catch with structured logging via Directus logger
- Trefle/Perenual: individual plant failures don't stop the batch; errors logged to `import_logs`
- Cloudflare: upload failures fall back to local-only; logged as warnings
- Rate limit hits pause processing gracefully (no errors thrown)

## 5. Testing

- Manual testing against live APIs with small batch sizes
- Verify field mappings produce correct data in Directus
- Verify Cloudflare upload/delete lifecycle
- Verify resumability by stopping and restarting Directus mid-sync
- Verify rate limiting by setting low thresholds
