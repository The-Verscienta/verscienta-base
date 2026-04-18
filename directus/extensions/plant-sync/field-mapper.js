/**
 * Maps Trefle and Perenual API responses to Directus herb fields.
 * Port of TrefleFieldMapper.php and PerenualFieldMapper.php.
 */

/** Medicinal plant families — plants in these families pass the filter. */
const MEDICINAL_FAMILIES = new Set([
  "Lamiaceae", "Asteraceae", "Apiaceae", "Fabaceae", "Rosaceae",
  "Solanaceae", "Zingiberaceae", "Rubiaceae", "Lauraceae", "Myrtaceae",
  "Rutaceae", "Piperaceae", "Malvaceae", "Cucurbitaceae", "Poaceae",
  "Brassicaceae", "Araceae", "Liliaceae", "Amaryllidaceae", "Ranunculaceae",
  "Valerianaceae", "Papaveraceae",
]);

const HABIT_MAP = {
  tree: "Tree",
  shrub: "Shrub",
  herb: "Herb",
  vine: "Vine",
  grass: "Grass",
  forb: "Herb",
  subshrub: "Shrub",
  graminoid: "Grass",
};

/** Escape HTML entities. */
function esc(val) {
  if (val == null) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escArr(arr) {
  if (!Array.isArray(arr)) return esc(arr);
  return arr.map(esc).join(", ");
}

/**
 * Check if a plant has nutritional or medicinal benefits.
 * Port of TrefleSyncService::hasNutritionalOrMedicinalBenefits().
 */
export function hasPlantBenefits(plant) {
  if (plant.edible === true) return true;
  if (plant.vegetable === true) return true;
  if (Array.isArray(plant.edible_part) && plant.edible_part.length > 0) return true;

  const main = plant.main_species || {};
  if (main.edible === true) return true;
  if (Array.isArray(main.edible_part) && main.edible_part.length > 0) return true;
  if (main.vegetable === true) return true;

  const specs = plant.specifications || main.specifications || {};
  if (specs.edible === true) return true;

  const family = typeof plant.family === "object"
    ? plant.family?.name
    : plant.family;
  if (family && MEDICINAL_FAMILIES.has(family)) return true;

  const mainFamily = typeof main.family === "object"
    ? main.family?.name
    : main.family;
  if (mainFamily && MEDICINAL_FAMILIES.has(mainFamily)) return true;

  return false;
}

/**
 * Map Trefle species data to Directus herb fields.
 * Port of TrefleFieldMapper::mapToNode().
 */
export function mapTrefleToHerb(plant) {
  const family = typeof plant.family === "object"
    ? plant.family?.name
    : plant.family;

  const scientificName = plant.scientific_name || "";
  const speciesPart = scientificName.split(" ")[1] || null;

  const growth = plant.growth || {};
  const habit = growth.habit || plant.growth_habit || null;
  const plantType = habit
    ? HABIT_MAP[habit.toLowerCase()] || habit.charAt(0).toUpperCase() + habit.slice(1)
    : null;

  const native = plant.distribution?.native;
  let nativeRegion = null;
  if (Array.isArray(native) && native.length > 0) {
    nativeRegion = native;
  } else if (typeof native === "string") {
    nativeRegion = [native];
  }

  const commonNames = [];
  if (plant.common_name) {
    commonNames.push({ name: plant.common_name, language: "en" });
  }
  if (Array.isArray(plant.common_names)) {
    for (const [lang, names] of Object.entries(plant.common_names)) {
      if (Array.isArray(names)) {
        for (const n of names) commonNames.push({ name: n, language: lang });
      }
    }
  }

  // Generate a unique herb_id from the Trefle ID (e.g., "T-12345").
  const herbId = `T-${plant.id}`;

  return {
    herb_id: herbId,
    title: plant.common_name || plant.scientific_name || "Unknown Plant",
    slug: scientificName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    trefle_id: plant.id,
    scientific_name: scientificName || null,
    family: family || null,
    genus: plant.genus?.name || plant.genus || null,
    species: speciesPart,
    plant_type: plantType,
    native_region: nativeRegion,
    synonyms: Array.isArray(plant.synonyms)
      ? plant.synonyms.map((s) => (typeof s === "object" ? s.name : s)).filter(Boolean)
      : [],
    conservation_status: plant.status || null,
    botanical_description: buildBotanicalDescription(plant),
    contraindications: buildToxicityWarning(plant),
    parts_used: Array.isArray(plant.edible_part)
      ? plant.edible_part
      : plant.edible_part ? [plant.edible_part] : null,
    common_names: commonNames.length > 0 ? commonNames : null,
    peer_review_status: "draft",
  };
}

function buildBotanicalDescription(plant) {
  const parts = [];

  if (plant.description) {
    parts.push(`<p>${esc(plant.description)}</p>`);
  }

  const flower = plant.flower || {};
  if (flower.color || flower.conspicuous != null) {
    const fp = [];
    if (flower.color) fp.push("Color: " + escArr(flower.color));
    if (flower.conspicuous != null) fp.push(flower.conspicuous ? "Conspicuous" : "Inconspicuous");
    parts.push(`<p><strong>Flower:</strong> ${fp.join("; ")}</p>`);
  }

  const foliage = plant.foliage || {};
  if (foliage.color || foliage.texture) {
    const fp = [];
    if (foliage.color) fp.push("Color: " + escArr(foliage.color));
    if (foliage.texture) fp.push("Texture: " + esc(foliage.texture));
    parts.push(`<p><strong>Foliage:</strong> ${fp.join("; ")}</p>`);
  }

  const fruit = plant.fruit_or_seed || plant.fruit || {};
  if (fruit.color || fruit.seed_persistence != null) {
    const fp = [];
    if (fruit.color) fp.push("Color: " + escArr(fruit.color));
    if (fruit.seed_persistence != null) fp.push(fruit.seed_persistence ? "Seeds persist" : "Seeds do not persist");
    parts.push(`<p><strong>Fruit/Seed:</strong> ${fp.join("; ")}</p>`);
  }

  return parts.length > 0 ? parts.join("\n") : null;
}

function buildToxicityWarning(plant) {
  if (!plant.toxicity) return null;
  const tox = Array.isArray(plant.toxicity)
    ? plant.toxicity.map(esc).join(", ")
    : esc(plant.toxicity);
  return `<p><strong>Toxicity:</strong> ${tox}</p>`;
}

/**
 * Enrich a Directus herb record with Perenual data.
 * Only fills fields that are empty/null. Non-destructive.
 * Port of PerenualFieldMapper::enrichNode().
 *
 * @param {object} existing - Current herb record from Directus.
 * @param {object} perenual - Perenual API response data.
 * @returns {object|null} - Partial update object, or null if nothing to update.
 */
export function enrichWithPerenual(existing, perenual) {
  const updates = {};
  let hasUpdates = false;

  function setIfEmpty(field, value) {
    if (value != null && (existing[field] == null || existing[field] === "")) {
      updates[field] = value;
      hasUpdates = true;
    }
  }

  setIfEmpty("perenual_id", perenual.id);
  setIfEmpty("plant_type", perenual.type ? perenual.type.charAt(0).toUpperCase() + perenual.type.slice(1) : null);

  if (perenual.origin && Array.isArray(perenual.origin)) {
    setIfEmpty("native_region", perenual.origin);
  }

  if (perenual.description) {
    setIfEmpty("botanical_description", `<p>${esc(perenual.description)}</p>`);
  }

  // Contraindications from poisoning data.
  if (perenual.poisonous_to_humans || perenual.poisonous_to_pets) {
    const warnings = [];
    if (perenual.poisonous_to_humans) warnings.push("Poisonous to humans");
    if (perenual.poisonous_to_pets) warnings.push("Poisonous to pets");
    setIfEmpty("contraindications", `<p><strong>Warning:</strong> ${warnings.join(". ")}.</p>`);
  }

  // Parts used from edible parts.
  const edibleParts = [];
  if (perenual.edible_leaf) edibleParts.push("leaf");
  if (perenual.edible_fruit) edibleParts.push("fruit");
  if (perenual.flowers) edibleParts.push("flowers");
  if (edibleParts.length > 0) {
    setIfEmpty("parts_used", edibleParts);
  }

  if (perenual.other_name && Array.isArray(perenual.other_name)) {
    setIfEmpty("synonyms", perenual.other_name);
  }

  return hasUpdates ? updates : null;
}
