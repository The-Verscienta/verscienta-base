/**
 * Directus Hook: MeiliSearch Auto-Sync
 *
 * Automatically syncs Directus collection items to MeiliSearch
 * on create, update, and delete events.
 *
 * Watches: herbs, formulas, conditions, modalities, practitioners
 *
 * Environment variables:
 *   MEILI_URL        (default: http://meilisearch:7700)
 *   MEILI_MASTER_KEY (required)
 */

import { MeiliSearch } from "meilisearch";

// Collections to sync and their MeiliSearch index names
const SYNCED_COLLECTIONS = {
  herbs: "verscienta_herbs",
  formulas: "verscienta_formulas",
  conditions: "verscienta_conditions",
  modalities: "verscienta_modalities",
  practitioners: "verscienta_practitioners",
  clinics: "verscienta_clinics",
};

// The combined "all" index
const ALL_INDEX = "verscienta_all";

// Fields to strip from rich text (HTML → plain text for search)
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

// Transform a Directus item into a MeiliSearch document.
// `firstImageFile` is the UUID of the first related image (from herb_images / clinic_images),
// resolved by the caller before invoking this transform.
function transformForSearch(collection, item, firstImageFile = null) {
  const base = {
    id: item.id,
    type: collection.replace(/s$/, ""), // herbs → herb
    url: `/${collection}/${item.slug || item.id}`,
  };

  switch (collection) {
    case "herbs":
      return {
        ...base,
        title: item.title,
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
        image: firstImageFile,
        slug: item.slug,
      };

    case "formulas":
      return {
        ...base,
        title: item.title,
        chinese_name: item.chinese_name,
        pinyin_name: item.pinyin_name,
        description: stripHtml(item.description),
        use_cases: item.use_cases || [],
        classic_source: item.classic_source,
        source_author: item.source_author,
        source_dynasty: item.source_dynasty,
        source_year: item.source_year,
        image: item.image || null,
        slug: item.slug,
      };

    case "conditions":
      return {
        ...base,
        title: item.title,
        description: stripHtml(item.description),
        symptoms: item.symptoms || [],
        severity: item.severity,
        slug: item.slug,
      };

    case "modalities":
      return {
        ...base,
        title: item.title,
        description: stripHtml(item.description),
        excels_at: item.excels_at || [],
        benefits: stripHtml(item.benefits),
        slug: item.slug,
      };

    case "practitioners":
      return {
        ...base,
        title: item.title,
        first_name: item.first_name,
        last_name: item.last_name,
        name: [item.first_name, item.last_name].filter(Boolean).join(" ") || item.title,
        practice_type: item.practice_type,
        bio: stripHtml(item.bio),
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        image: item.image || null,
        _geo: item.latitude && item.longitude
          ? { lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) }
          : undefined,
        slug: item.slug,
      };

    case "clinics":
      return {
        ...base,
        name: item.name,
        title: item.name,
        description: stripHtml(item.description),
        address: item.address,
        city: item.city,
        state: item.state,
        zip_code: item.zip_code,
        phone: item.phone,
        email: item.email,
        website: item.website,
        services: item.services || [],
        accepts_insurance: !!item.accepts_insurance,
        latitude: item.latitude,
        longitude: item.longitude,
        image: firstImageFile,
        _geo: item.latitude && item.longitude
          ? { lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) }
          : undefined,
        slug: item.slug,
      };

    default:
      return { ...base, title: item.title };
  }
}

// Transform for the combined "all" index (uses objectID instead of id)
function transformForAllIndex(collection, item, firstImageFile = null) {
  const doc = transformForSearch(collection, item, firstImageFile);
  return {
    ...doc,
    objectID: `${collection}_${item.id}`,
  };
}

// Status filter — hide drafts/inactive from search.
// Returns true if the item should NOT be indexed (and should be removed if present).
function isHiddenFromSearch(collection, item) {
  if (collection === "herbs" && item.status && item.status !== "published") return true;
  if (collection === "clinics" && item.status && item.status !== "active") return true;
  return false;
}

// Look up the first related image's file UUID for collections with image O2M.
// Returns null if no image is set.
async function getFirstImageFile(database, collection, itemId) {
  try {
    if (collection === "herbs") {
      const rows = await database("herb_images")
        .where({ herb_id: itemId })
        .orderBy("sort", "asc")
        .orderBy("id", "asc")
        .limit(1)
        .select("file");
      return rows[0]?.file || null;
    }
    if (collection === "clinics") {
      const rows = await database("clinic_images")
        .where({ clinic_id: itemId })
        .orderBy("sort", "asc")
        .orderBy("id", "asc")
        .limit(1)
        .select("file");
      return rows[0]?.file || null;
    }
  } catch (e) {
    // Table may not exist yet (e.g. clinic_images before schema migration) — fail soft.
    return null;
  }
  return null;
}

export default ({ action }, { env, logger }) => {
  const MEILI_URL = env.MEILI_URL || "http://meilisearch:7700";
  const MEILI_MASTER_KEY = env.MEILI_MASTER_KEY;

  if (!MEILI_MASTER_KEY) {
    logger.warn("MeiliSearch sync disabled: MEILI_MASTER_KEY not set");
    return;
  }

  let client;
  try {
    client = new MeiliSearch({ host: MEILI_URL, apiKey: MEILI_MASTER_KEY });
    logger.info(`MeiliSearch sync enabled: ${MEILI_URL}`);
  } catch (e) {
    logger.error(`MeiliSearch connection failed: ${e.message}`);
    return;
  }

  // Index or remove a single item depending on its visibility status.
  async function indexOrRemove(collection, indexName, item, database) {
    const id = item.id;
    if (isHiddenFromSearch(collection, item)) {
      await client.index(indexName).deleteDocument(String(id));
      await client.index(ALL_INDEX).deleteDocument(`${collection}_${id}`);
      return "removed";
    }
    const firstImage = await getFirstImageFile(database, collection, id);
    const doc = transformForSearch(collection, item, firstImage);
    const allDoc = transformForAllIndex(collection, item, firstImage);
    await client.index(indexName).addDocuments([doc]);
    await client.index(ALL_INDEX).addDocuments([allDoc]);
    return "indexed";
  }

  // ── Create / Update ───────────────────────────────────────────────────────

  for (const [collection, indexName] of Object.entries(SYNCED_COLLECTIONS)) {
    action(`${collection}.items.create`, async ({ key }, { database }) => {
      try {
        const items = await database(collection).where({ id: key }).select("*");
        const item = items[0];
        if (!item) return;
        const result = await indexOrRemove(collection, indexName, item, database);
        logger.info(`MeiliSearch: ${result} ${collection}/${key}`);
      } catch (e) {
        logger.error(`MeiliSearch sync error (create ${collection}/${key}): ${e.message}`);
      }
    });

    action(`${collection}.items.update`, async ({ keys }, { database }) => {
      try {
        for (const key of keys) {
          const items = await database(collection).where({ id: key }).select("*");
          const item = items[0];
          if (!item) continue;
          const result = await indexOrRemove(collection, indexName, item, database);
          logger.info(`MeiliSearch: ${result} ${collection}/${key}`);
        }
      } catch (e) {
        logger.error(`MeiliSearch sync error (update ${collection}): ${e.message}`);
      }
    });

    action(`${collection}.items.delete`, async ({ keys }) => {
      try {
        await client.index(indexName).deleteDocuments(keys.map(String));
        const allKeys = keys.map((key) => `${collection}_${key}`);
        await client.index(ALL_INDEX).deleteDocuments(allKeys);
        logger.info(`MeiliSearch: deleted ${keys.length} from ${collection}`);
      } catch (e) {
        logger.error(`MeiliSearch sync error (delete ${collection}): ${e.message}`);
      }
    });
  }

  // When images change on the parent's image O2M, re-index the parent so its `image` updates.
  async function reindexFromChildImages(parentTable, parentFkField, childTable, keys, ctx) {
    try {
      const parentIds = await ctx.database(childTable).whereIn("id", keys).pluck(parentFkField);
      const indexName = SYNCED_COLLECTIONS[parentTable];
      if (!indexName) return;
      for (const parentId of parentIds.filter(Boolean)) {
        const items = await ctx.database(parentTable).where({ id: parentId }).select("*");
        const item = items[0];
        if (!item) continue;
        await indexOrRemove(parentTable, indexName, item, ctx.database);
        logger.info(`MeiliSearch: reindexed ${parentTable}/${parentId} (image change in ${childTable})`);
      }
    } catch (e) {
      logger.error(`MeiliSearch sync error (${childTable} → ${parentTable}): ${e.message}`);
    }
  }

  for (const [childTable, parentTable, parentFk] of [
    ["herb_images", "herbs", "herb_id"],
    ["clinic_images", "clinics", "clinic_id"],
  ]) {
    action(`${childTable}.items.create`, async ({ key }, ctx) => {
      await reindexFromChildImages(parentTable, parentFk, childTable, [key], ctx);
    });
    action(`${childTable}.items.update`, async ({ keys }, ctx) => {
      await reindexFromChildImages(parentTable, parentFk, childTable, keys, ctx);
    });
  }
};
