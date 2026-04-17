/**
 * Perenual → Directus Field Mapper
 *
 * Maps Perenual API plant data to Directus herbs collection.
 * Ported from PerenualFieldMapper.php.
 */

const MEDICINAL_FAMILIES = [
  "lamiaceae", "asteraceae", "apiaceae", "zingiberaceae",
  "fabaceae", "rosaceae", "valerianaceae", "papaveraceae", "solanaceae",
];

export function hasBenefits(plantData) {
  if (plantData.medicinal) return true;
  if (plantData.edible_leaf || plantData.edible_fruit) return true;
  const family = (plantData.family || "").toLowerCase();
  if (MEDICINAL_FAMILIES.some((f) => family.includes(f))) return true;
  if (plantData.poisonous_to_humans) return false;
  return true; // Default include
}

export function mapPerenualToHerb(plantData) {
  const sciName = Array.isArray(plantData.scientific_name) ? plantData.scientific_name[0] : (plantData.scientific_name || "");
  const title = plantData.common_name || sciName || "Unknown Plant";

  const commonNames = [];
  if (plantData.common_name) commonNames.push({ name: plantData.common_name, language: "en" });
  if (plantData.other_name?.length > 0) {
    for (const name of plantData.other_name.slice(0, 10)) {
      if (name && name !== plantData.common_name) commonNames.push({ name, language: "en" });
    }
  }

  // Plant type
  const plantType = (plantData.type || "").toLowerCase();
  const typeMap = { herb: "herb", shrub: "shrub", tree: "tree", vine: "vine", grass: "grass" };

  // Parts used
  const partsUsed = [];
  if (plantData.edible_leaf) partsUsed.push("leaf");
  if (plantData.edible_fruit) partsUsed.push("fruit");
  if (plantData.flowers) partsUsed.push("flower");

  // Native region
  const nativeRegion = (plantData.origin || []).slice(0, 10);

  // Contraindications
  const contraindications = [];
  if (plantData.poisonous_to_humans) contraindications.push("Poisonous to humans");
  if (plantData.poisonous_to_pets) contraindications.push("Poisonous to pets");

  // Growing conditions → botanical description
  const descParts = [];
  if (plantData.description) descParts.push(plantData.description);
  if (plantData.sunlight) descParts.push(`Sunlight: ${Array.isArray(plantData.sunlight) ? plantData.sunlight.join(", ") : plantData.sunlight}`);
  if (plantData.watering) descParts.push(`Watering: ${plantData.watering}`);
  if (plantData.growth_rate) descParts.push(`Growth rate: ${plantData.growth_rate}`);
  if (plantData.care_level) descParts.push(`Care level: ${plantData.care_level}`);
  if (plantData.cycle) descParts.push(`Cycle: ${plantData.cycle}`);
  if (plantData.dimensions?.max_height?.cm) descParts.push(`Max height: ${plantData.dimensions.max_height.cm} cm`);

  const slug = sciName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return {
    title,
    slug: slug || `perenual-${plantData.id}`,
    herb_id: `P-${String(plantData.id).padStart(5, "0")}`,
    scientific_name: sciName,
    family: plantData.family || null,
    genus: plantData.genus || null,
    species: plantData.species_epithet || null,
    plant_type: typeMap[plantType] || null,
    common_names: commonNames.length > 0 ? commonNames : null,
    synonyms: plantData.other_name?.length > 0 ? plantData.other_name.slice(0, 20) : null,
    native_region: nativeRegion.length > 0 ? nativeRegion : null,
    botanical_description: descParts.length > 0 ? `<p>${descParts.join("</p><p>")}</p>` : null,
    parts_used: partsUsed.length > 0 ? partsUsed : null,
    contraindications: contraindications.length > 0 ? `<p>${contraindications.join(". ")}</p>` : null,
    perenual_id: plantData.id,
    source_databases: ["perenual.com"],
    status: "draft",
    peer_review_status: "draft",
  };
}

/**
 * Enrich existing herb — only fill empty fields
 */
export function enrichHerbFields(existingHerb, perenualData) {
  const enriched = {};
  const mapped = mapPerenualToHerb(perenualData);

  // Only set fields that are currently empty on the existing herb
  for (const [key, value] of Object.entries(mapped)) {
    if (value === null || value === undefined) continue;
    if (key === "title" || key === "slug" || key === "herb_id" || key === "status" || key === "peer_review_status") continue;

    const existing = existingHerb[key];
    if (existing === null || existing === undefined || existing === "" || (Array.isArray(existing) && existing.length === 0)) {
      enriched[key] = value;
    }
  }

  return enriched;
}
