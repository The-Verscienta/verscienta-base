/**
 * Add `traditions` tag field to the herbs collection and backfill existing
 * rows based on the tradition-specific fields already populated.
 *
 * Idempotent: re-running is safe — field creation and per-row updates both
 * skip when no change is needed.
 *
 * Usage:
 *   DIRECTUS_URL=... DIRECTUS_TOKEN=... node scripts/add-herbs-traditions-field.mjs
 *
 * Heuristics for backfill (a herb can belong to multiple traditions):
 *   - TCM       if any of pinyin_name | tcm_category | tcm_taste | tcm_meridians
 *                       | tcm_functions | traditional_chinese_uses is populated
 *   - Western   if any of western_properties | traditional_american_uses
 *                       is populated
 *   - Native American if native_american_uses is populated
 *   - (Ayurvedic / Other are not backfilled — no signals in the schema.)
 *
 * If a herb matches none of the above, it is left with an empty traditions
 * array so an editor can classify it manually.
 */

import {
  createDirectus,
  rest,
  staticToken,
  createField,
  readItems,
  updateItem,
} from "@directus/sdk";

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error("Error: DIRECTUS_TOKEN is required.");
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

const TRADITION_CHOICES = [
  { text: "TCM", value: "tcm" },
  { text: "Western", value: "western" },
  { text: "Ayurvedic", value: "ayurvedic" },
  { text: "Native American", value: "native_american" },
  { text: "Other", value: "other" },
];

async function ensureField() {
  try {
    await client.request(
      createField("herbs", {
        field: "traditions",
        type: "json",
        meta: {
          interface: "select-multiple-checkbox",
          options: { choices: TRADITION_CHOICES },
          width: "full",
          note: "Which herbal traditions classify/use this herb. Drives Formula Constructor filtering.",
          special: ["cast-json"],
        },
        schema: {},
      })
    );
    console.log("+ Created herbs.traditions field");
  } catch (e) {
    const msg = e?.errors?.[0]?.message || e.message || "";
    if (msg.toLowerCase().includes("already exists") || e?.errors?.[0]?.extensions?.code === "RECORD_NOT_UNIQUE") {
      console.log("= herbs.traditions field already exists");
    } else {
      throw e;
    }
  }
}

function hasContent(v) {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

function inferTraditions(h) {
  const out = new Set();
  if (
    hasContent(h.pinyin_name) ||
    hasContent(h.tcm_category) ||
    hasContent(h.tcm_taste) ||
    hasContent(h.tcm_meridians) ||
    hasContent(h.tcm_functions) ||
    hasContent(h.traditional_chinese_uses)
  ) {
    out.add("tcm");
  }
  if (hasContent(h.western_properties) || hasContent(h.traditional_american_uses)) {
    out.add("western");
  }
  if (hasContent(h.native_american_uses)) {
    out.add("native_american");
  }
  return [...out];
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}

async function backfill() {
  const items = await client.request(
    readItems("herbs", {
      fields: [
        "id",
        "title",
        "traditions",
        "pinyin_name",
        "tcm_category",
        "tcm_taste",
        "tcm_meridians",
        "tcm_functions",
        "traditional_chinese_uses",
        "western_properties",
        "traditional_american_uses",
        "native_american_uses",
      ],
      limit: -1,
    })
  );

  let updated = 0;
  let skipped = 0;
  let untagged = 0;

  for (const h of items) {
    const current = Array.isArray(h.traditions) ? h.traditions : [];
    const inferred = inferTraditions(h);

    // Don't clobber values an editor has set manually.
    if (current.length > 0 && !sameSet(current, inferred)) {
      skipped++;
      continue;
    }
    if (current.length > 0 && sameSet(current, inferred)) {
      skipped++;
      continue;
    }
    if (inferred.length === 0) {
      untagged++;
      continue;
    }

    await client.request(updateItem("herbs", h.id, { traditions: inferred }));
    updated++;
    console.log(`  ~ ${h.title || h.id}: ${inferred.join(", ")}`);
  }

  console.log(
    `\nBackfill complete: ${updated} updated, ${skipped} preserved, ${untagged} left untagged (no signals).`
  );
}

async function main() {
  console.log(`Directus: ${DIRECTUS_URL}`);
  await ensureField();
  await backfill();
}

main().catch((e) => {
  console.error("Failed:", e?.errors || e);
  process.exit(1);
});
