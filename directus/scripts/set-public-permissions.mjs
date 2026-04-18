/**
 * Set public read permissions for all content collections.
 * This allows the Astro frontend to read data without authentication.
 *
 * Usage: DIRECTUS_URL=https://backend.verscienta.com DIRECTUS_TOKEN=xxx node scripts/set-public-permissions.mjs
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const TOKEN = process.env.DIRECTUS_TOKEN;

if (!TOKEN) { console.error("DIRECTUS_TOKEN required"); process.exit(1); }

const collections = [
  "herbs", "formulas", "conditions", "modalities", "practitioners",
  "herb_tags", "tcm_categories",
  "herb_clinical_studies", "herb_drug_interactions", "herb_dosages",
  "herb_constituents", "herb_preparations", "herb_historical_texts",
  "herb_practitioner_notes", "herb_case_studies", "herb_references", "herb_images",
  "formula_ingredients", "formula_modifications",
  "tcm_ingredients", "tcm_target_interactions", "tcm_clinical_evidence",
  "herbs_conditions", "herbs_related_species", "herbs_substitutes",
  "herbs_similar_tcm", "herbs_similar_western", "herbs_herb_tags", "herbs_tcm_categories",
  "modalities_conditions", "practitioners_modalities",
  "tcm_evidence_herbs", "formulas_conditions", "formulas_related", "tcm_ingredients_herbs",
  "import_logs", "directus_files",
];

async function main() {
  console.log("Setting public read permissions on " + DIRECTUS_URL);

  // Find the public policy ID
  const policiesRes = await fetch(DIRECTUS_URL + "/policies", {
    headers: { "Authorization": "Bearer " + TOKEN },
  });
  const policiesData = await policiesRes.json();
  const publicPolicy = policiesData.data?.find(p => p.name === "$t:public_label" || p.name === "Public" || (!p.admin_access && !p.app_access));

  if (!publicPolicy) {
    console.error("Could not find public policy. Available policies:", policiesData.data?.map(p => p.name));
    process.exit(1);
  }

  console.log("Public policy ID: " + publicPolicy.id);
  let ok = 0, fail = 0;

  for (const col of collections) {
    try {
      const res = await fetch(DIRECTUS_URL + "/permissions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policy: publicPolicy.id,
          collection: col,
          action: "read",
          fields: ["*"],
          permissions: {},
          validation: {},
        }),
      });

      if (res.ok) {
        ok++;
        console.log("  + " + col);
      } else {
        const err = await res.json().catch(() => ({}));
        if (err?.errors?.[0]?.extensions?.code === "RECORD_NOT_UNIQUE") {
          ok++;
          console.log("  = " + col + " (exists)");
        } else {
          fail++;
          console.log("  ! " + col + ": " + (err?.errors?.[0]?.message || res.status));
        }
      }
    } catch (e) {
      fail++;
      console.log("  ! " + col + ": " + e.message);
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log("\nDone: " + ok + " OK, " + fail + " failed");
}

main();
