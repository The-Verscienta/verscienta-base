/**
 * Trefle → Directus Field Mapper
 *
 * Maps Trefle.io API plant data to the Directus herbs collection schema.
 * Ported from TrefleFieldMapper.php.
 */

const GROWTH_HABIT_MAP = {
  tree: "tree",
  shrub: "shrub",
  subshrub: "shrub",
  herb: "herb",
  forb: "herb",
  vine: "vine",
  graminoid: "grass",
  grass: "grass",
  fern: "fern",
  moss: "moss",
  fungus: "fungus",
  lichen: "lichen",
};

const MEDICINAL_FAMILIES = [
  "lamiaceae", "asteraceae", "apiaceae", "zingiberaceae",
  "fabaceae", "rosaceae", "valerianaceae", "papaveraceae",
  "solanaceae", "rubiaceae", "gentianaceae", "berberidaceae",
];

/**
 * Check if a plant has medicinal or edible benefits
 */
export function hasMedicinalBenefits(plantData) {
  // Direct edible/vegetable flags
  if (plantData.edible || plantData.vegetable) return true;
  if (plantData.edible_part?.length > 0) return true;

  // Check main_species
  const ms = plantData.main_species;
  if (ms) {
    if (ms.edible || ms.vegetable) return true;
    if (ms.edible_part?.length > 0) return true;
  }

  // Check family
  const family = (plantData.family || plantData.family_common_name || "").toLowerCase();
  if (MEDICINAL_FAMILIES.some((f) => family.includes(f))) return true;

  return false;
}

/**
 * Map Trefle plant data to Directus herb fields
 */
export function mapTrefleToHerb(plantData) {
  const ms = plantData.main_species || {};
  const title = plantData.common_name || plantData.scientific_name || "Unknown Plant";
  const scientificName = plantData.scientific_name || "";

  // Parse species epithet
  const nameParts = scientificName.split(" ");
  const species = nameParts.length >= 2 ? nameParts.slice(1).join(" ") : "";

  // Build common names JSON
  const commonNames = [];
  if (plantData.common_name) {
    commonNames.push({ name: plantData.common_name, language: "en" });
  }
  // Add any synonyms as common names
  if (plantData.common_names) {
    for (const [lang, names] of Object.entries(plantData.common_names)) {
      for (const name of (Array.isArray(names) ? names : [names])) {
        if (name && name !== plantData.common_name) {
          commonNames.push({ name, language: lang });
        }
      }
    }
  }

  // Growth habit → plant type
  const growthHabit = (ms.specifications?.growth_habit || ms.growth_habit || "").toLowerCase();
  const plantType = GROWTH_HABIT_MAP[growthHabit] || null;

  // Native regions (from distribution)
  const nativeRegion = [];
  if (ms.distribution?.native) {
    for (const region of ms.distribution.native.slice(0, 10)) {
      nativeRegion.push(typeof region === "string" ? region : region.name || String(region));
    }
  }

  // Botanical description
  const descParts = [];
  if (ms.specifications?.growth_form) descParts.push(`Growth form: ${ms.specifications.growth_form}`);
  if (ms.flower?.color) descParts.push(`Flower: ${Array.isArray(ms.flower.color) ? ms.flower.color.join(", ") : ms.flower.color}`);
  if (ms.foliage?.color) descParts.push(`Foliage: ${Array.isArray(ms.foliage.color) ? ms.foliage.color.join(", ") : ms.foliage.color}`);
  if (ms.fruit_or_seed?.color) descParts.push(`Fruit: ${Array.isArray(ms.fruit_or_seed.color) ? ms.fruit_or_seed.color.join(", ") : ms.fruit_or_seed.color}`);
  if (ms.specifications?.average_height?.cm) descParts.push(`Average height: ${ms.specifications.average_height.cm} cm`);
  if (ms.specifications?.maximum_height?.cm) descParts.push(`Maximum height: ${ms.specifications.maximum_height.cm} cm`);

  // Synonyms
  const synonyms = (plantData.synonyms || [])
    .map((s) => (typeof s === "string" ? s : s.name || ""))
    .filter(Boolean)
    .slice(0, 20);

  // Parts used (from edible parts)
  const partsUsed = (plantData.edible_part || ms.edible_part || [])
    .map((p) => p.toLowerCase())
    .filter((p) => ["root", "leaf", "stem", "flower", "seed", "bark", "fruit", "whole_plant", "rhizome", "bulb", "resin"].includes(p));

  // Conservation status
  const statusMap = {
    LC: "least_concern", NT: "near_threatened", VU: "vulnerable",
    EN: "endangered", CR: "critically_endangered", EW: "extinct_in_wild",
    NE: "not_evaluated", DD: "data_deficient",
  };
  const conservation = statusMap[plantData.status] || null;

  // Contraindications from toxicity
  const toxicParts = [];
  if (ms.specifications?.toxicity) {
    const tox = ms.specifications.toxicity;
    if (typeof tox === "string" && tox !== "none") toxicParts.push(tox);
    if (Array.isArray(tox)) toxicParts.push(...tox.filter((t) => t !== "none"));
  }

  // Build slug
  const slug = scientificName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    title,
    slug,
    herb_id: `T-${String(plantData.id).padStart(5, "0")}`,
    scientific_name: scientificName,
    family: plantData.family || ms.family || null,
    genus: plantData.genus?.name || plantData.genus || nameParts[0] || null,
    species: species || null,
    plant_type: plantType,
    common_names: commonNames.length > 0 ? commonNames : null,
    synonyms: synonyms.length > 0 ? synonyms : null,
    native_region: nativeRegion.length > 0 ? nativeRegion : null,
    botanical_description: descParts.length > 0 ? `<p>${descParts.join("</p><p>")}</p>` : null,
    parts_used: partsUsed.length > 0 ? partsUsed : null,
    conservation_status: conservation,
    contraindications: toxicParts.length > 0 ? `<p>Toxicity: ${toxicParts.join(", ")}</p>` : null,
    trefle_id: plantData.id,
    source_databases: ["trefle.io"],
    status: "draft",
    peer_review_status: "draft",
  };
}
