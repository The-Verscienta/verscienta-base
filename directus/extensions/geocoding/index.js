/**
 * Directus Hook: Geocoding for Practitioners
 *
 * Replaces the Drupal holistic_hub module.
 * On practitioner create/update, if address is present and lat/lon are empty,
 * geocodes via OpenStreetMap Nominatim and fills the coordinates.
 *
 * No external dependencies — uses native fetch + Nominatim free API.
 */

export default ({ action }, { logger }) => {
  const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
  const USER_AGENT = "Verscienta Health Application";

  /**
   * Geocode an address via Nominatim
   */
  async function geocodeAddress(address) {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
    });

    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) {
      logger.warn(`Nominatim returned ${res.status} for address: ${address}`);
      return null;
    }

    const results = await res.json();
    if (!results || results.length === 0) {
      logger.info(`No geocoding results for: ${address}`);
      return null;
    }

    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon),
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

        // Re-geocode when address changes
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
