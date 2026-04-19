/**
 * Directus Hook: Geocoding for Practitioners via Geoapify
 *
 * On practitioner create/update, if address fields are present and lat/lon
 * are empty (or address changed), geocodes via Geoapify and fills coordinates.
 *
 * Supports both structured fields (street_address, city, state, zip_code)
 * and the legacy single "address" field.
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
   * Build a geocode query string from structured or legacy address fields
   */
  function buildAddressQuery(item) {
    // Prefer structured fields
    const parts = [];
    if (item.street_address) parts.push(item.street_address);
    // suite_apt intentionally excluded from geocoding — it doesn't help
    if (item.city) parts.push(item.city);
    if (item.state) parts.push(item.state);
    if (item.zip_code) parts.push(item.zip_code);

    if (parts.length > 0) return parts.join(", ");

    // Fall back to legacy single address field
    if (item.address) return item.address;

    return null;
  }

  /**
   * Geocode an address via Geoapify Geocoding API
   */
  async function geocodeAddress(addressQuery) {
    const params = new URLSearchParams({
      text: addressQuery,
      apiKey: API_KEY,
      format: "json",
      limit: "1",
    });

    const res = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`);

    if (!res.ok) {
      logger.warn(`Geoapify returned ${res.status} for address: ${addressQuery}`);
      return null;
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      logger.info(`No geocoding results for: ${addressQuery}`);
      return null;
    }

    const result = data.results[0];
    return {
      latitude: result.lat,
      longitude: result.lon,
    };
  }

  // Fields that trigger re-geocoding when changed
  const ADDRESS_FIELDS = ["address", "street_address", "city", "state", "zip_code"];

  // Geocode on practitioner create
  action("practitioners.items.create", async ({ key, payload }, { database }) => {
    try {
      const items = await database("practitioners").where({ id: key })
        .select("address", "street_address", "city", "state", "zip_code", "latitude", "longitude");
      const item = items[0];
      if (!item) return;

      if (item.latitude && item.longitude) return; // Already geocoded

      const query = buildAddressQuery(item);
      if (!query) return;

      const coords = await geocodeAddress(query);
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

  // Geocode on practitioner update (if any address field changed)
  action("practitioners.items.update", async ({ keys, payload }, { database }) => {
    // Only geocode if an address-related field was updated
    const addressChanged = ADDRESS_FIELDS.some((f) => payload?.[f] !== undefined);
    if (!addressChanged) return;

    for (const key of keys) {
      try {
        const items = await database("practitioners").where({ id: key })
          .select("address", "street_address", "city", "state", "zip_code", "latitude", "longitude");
        const item = items[0];
        if (!item) continue;

        const query = buildAddressQuery(item);
        if (!query) continue;

        const coords = await geocodeAddress(query);
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
