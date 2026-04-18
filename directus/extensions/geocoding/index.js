/**
 * Directus Hook: Geocoding for Practitioners via Geoapify
 *
 * On practitioner create/update, if address is present and lat/lon are empty
 * (or address changed), geocodes via Geoapify and fills the coordinates.
 *
 * Environment variables:
 *   GEOAPIFY_API_KEY  (required)
 */

export default ({ action }, { env, logger }) => {
  const API_KEY = env.GEOAPIFY_API_KEY;

  if (!API_KEY) {
    logger.warn("Geocoding disabled: GEOAPIFY_API_KEY not set");
    return;
  }

  /**
   * Geocode an address via Geoapify Geocoding API
   */
  async function geocodeAddress(address) {
    const params = new URLSearchParams({
      text: address,
      apiKey: API_KEY,
      format: "json",
      limit: "1",
    });

    const res = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`);

    if (!res.ok) {
      logger.warn(`Geoapify returned ${res.status} for address: ${address}`);
      return null;
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      logger.info(`No geocoding results for: ${address}`);
      return null;
    }

    const result = data.results[0];
    return {
      latitude: result.lat,
      longitude: result.lon,
      formatted: result.formatted || address,
    };
  }

  // Geocode on practitioner create
  action("practitioners.items.create", async ({ key, payload }, { database }) => {
    try {
      const items = await database("practitioners").where({ id: key }).select("address", "latitude", "longitude");
      const item = items[0];

      if (!item?.address) return;
      if (item.latitude && item.longitude) return; // Already geocoded

      const coords = await geocodeAddress(item.address);
      if (!coords) return;

      await database("practitioners").where({ id: key }).update({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      logger.info(`Geocoded practitioner ${key}: ${coords.latitude}, ${coords.longitude}`);
    } catch (e) {
      logger.error(`Geocoding error for practitioner ${key}: ${e.message}`);
    }
  });

  // Geocode on practitioner update (if address changed)
  action("practitioners.items.update", async ({ keys, payload }, { database }) => {
    // Only geocode if address was updated
    if (!payload?.address) return;

    for (const key of keys) {
      try {
        const items = await database("practitioners").where({ id: key }).select("address", "latitude", "longitude");
        const item = items[0];

        if (!item?.address) continue;

        const coords = await geocodeAddress(item.address);
        if (!coords) continue;

        await database("practitioners").where({ id: key }).update({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        logger.info(`Re-geocoded practitioner ${key}: ${coords.latitude}, ${coords.longitude}`);
      } catch (e) {
        logger.error(`Geocoding error for practitioner ${key}: ${e.message}`);
      }
    }
  });
};
