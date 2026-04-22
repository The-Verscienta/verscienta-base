/**
 * Directus Hook: Practitioner Lifecycle
 *
 * On practitioner create/update:
 *   1. Auto-computes `title` from first_name + last_name
 *   2. Geocodes address via Geoapify (if address fields present and lat/lon empty)
 *      Fills: latitude, longitude, city, state, zip_code (if empty)
 *
 * Supports both structured fields (street_address, city, state, zip_code)
 * and the legacy single "address" field.
 *
 * Environment variables:
 *   GEOAPIFY_API_KEY  (required for geocoding)
 */

export default ({ filter, action }, { env, logger }) => {
  // ── Auto-compute title from first_name + last_name ───────────────

  // On create: set title in the payload before save (has both fields)
  filter("practitioners.items.create", (payload) => {
    if (payload.first_name || payload.last_name) {
      const first = (payload.first_name || "").trim();
      const last = (payload.last_name || "").trim();
      payload.title = [first, last].filter(Boolean).join(" ");
    }
    return payload;
  });

  // On update: payload may only have one name field, so read the full record after save
  action("practitioners.items.update", async ({ keys, payload }, { database }) => {
    const nameChanged = payload?.first_name !== undefined || payload?.last_name !== undefined;
    if (!nameChanged) return;

    for (const key of keys) {
      try {
        const items = await database("practitioners").where({ id: key })
          .select("first_name", "last_name");
        const item = items[0];
        if (!item) continue;

        const first = (item.first_name || "").trim();
        const last = (item.last_name || "").trim();
        const title = [first, last].filter(Boolean).join(" ");

        if (title) {
          await database("practitioners").where({ id: key }).update({ title });
        }
      } catch (e) {
        logger.error(`Title compute error for practitioner ${key}: ${e.message}`);
      }
    }
  });

  // ── Geocoding ────────────────────────────────────────────────────
  const API_KEY = env.GEOAPIFY_API_KEY;

  if (!API_KEY) {
    logger.warn("Geocoding disabled: GEOAPIFY_API_KEY not set");
    return;
  }

  /**
   * Build a geocode query string from structured or legacy address fields
   */
  function buildAddressQuery(item) {
    const parts = [];
    if (item.street_address) parts.push(item.street_address);
    if (item.city) parts.push(item.city);
    if (item.state) parts.push(item.state);
    if (item.zip_code) parts.push(item.zip_code);

    if (parts.length > 0) return parts.join(", ");
    if (item.address) return item.address;
    return null;
  }

  /**
   * Geocode an address via Geoapify — returns coords + address components
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

    const r = data.results[0];
    return {
      latitude: r.lat,
      longitude: r.lon,
      city: r.city || null,
      state: r.state || null,
      zip_code: r.postcode || null,
    };
  }

  /**
   * Build the update payload — always set coords, fill address parts only if empty
   */
  function buildUpdate(item, geocoded) {
    const update = {
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
    };

    // Fill structured address fields only if they're currently empty
    if (!item.city && geocoded.city) update.city = geocoded.city;
    if (!item.state && geocoded.state) update.state = geocoded.state;
    if (!item.zip_code && geocoded.zip_code) update.zip_code = geocoded.zip_code;

    return update;
  }

  const ADDRESS_FIELDS = ["address", "street_address", "city", "state", "zip_code"];

  // Geocode on practitioner create
  action("practitioners.items.create", async ({ key, payload }, { database }) => {
    try {
      const items = await database("practitioners").where({ id: key })
        .select("address", "street_address", "city", "state", "zip_code", "latitude", "longitude");
      const item = items[0];
      if (!item) return;

      if (item.latitude && item.longitude) return;

      const query = buildAddressQuery(item);
      if (!query) return;

      const geocoded = await geocodeAddress(query);
      if (!geocoded) return;

      const update = buildUpdate(item, geocoded);
      await database("practitioners").where({ id: key }).update(update);

      logger.info(`Geocoded practitioner ${key}: ${geocoded.latitude}, ${geocoded.longitude}` +
        (update.city ? ` | city=${update.city}` : "") +
        (update.state ? ` | state=${update.state}` : "") +
        (update.zip_code ? ` | zip=${update.zip_code}` : ""));
    } catch (e) {
      logger.error(`Geocoding error for practitioner ${key}: ${e.message}`);
    }
  });

  // Geocode on practitioner update (if any address field changed)
  action("practitioners.items.update", async ({ keys, payload }, { database }) => {
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

        const geocoded = await geocodeAddress(query);
        if (!geocoded) continue;

        const update = buildUpdate(item, geocoded);
        await database("practitioners").where({ id: key }).update(update);

        logger.info(`Re-geocoded practitioner ${key}: ${geocoded.latitude}, ${geocoded.longitude}` +
          (update.city ? ` | city=${update.city}` : "") +
          (update.state ? ` | state=${update.state}` : "") +
          (update.zip_code ? ` | zip=${update.zip_code}` : ""));
      } catch (e) {
        logger.error(`Geocoding error for practitioner ${key}: ${e.message}`);
      }
    }
  });
};
