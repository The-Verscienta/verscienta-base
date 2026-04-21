/**
 * Directus Endpoint: Geoapify Geocoding Proxy
 *
 * Proxies requests to Geoapify's APIs so the API key
 * stays server-side. Used by the address-autocomplete interface.
 *
 * GET /geocoding/autocomplete?text=123+Main+St
 * GET /geocoding/geocode?text=123+Main+St+Springfield+IL
 *
 * Environment variables:
 *   GEOAPIFY_API_KEY  (required)
 */

export default {
  id: "geocoding",
  handler: (router, { env, logger }) => {
    const API_KEY = env.GEOAPIFY_API_KEY;

    if (!API_KEY) {
      logger.warn("Geocoding endpoint disabled: GEOAPIFY_API_KEY not set");
      return;
    }

    logger.info("Geocoding endpoint loaded — routes: /geocoding/autocomplete, /geocoding/geocode");

    // GET /geocoding/autocomplete?text=...&limit=5
    router.get("/autocomplete", async (req, res) => {
      const { text, limit = "5" } = req.query;

      if (!text || typeof text !== "string" || text.trim().length < 2) {
        return res.json({ results: [] });
      }

      try {
        const params = new URLSearchParams({
          text: text.trim(),
          apiKey: API_KEY,
          limit,
          type: "amenity,street,city,district",
          format: "json",
        });

        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?${params}`
        );

        if (!response.ok) {
          logger.warn(`Geoapify autocomplete returned ${response.status}`);
          return res.status(502).json({ error: "Geocoding service error" });
        }

        const data = await response.json();
        const results = (data.results || []).map((r) => ({
          formatted: r.formatted,
          lat: r.lat,
          lon: r.lon,
          city: r.city,
          state: r.state,
          country: r.country,
          postcode: r.postcode,
        }));

        return res.json({ results });
      } catch (e) {
        logger.error(`Autocomplete error: ${e.message}`);
        return res.status(500).json({ error: "Internal error" });
      }
    });

    // GET /geocoding/geocode?text=...
    router.get("/geocode", async (req, res) => {
      const { text } = req.query;

      if (!text || typeof text !== "string" || text.trim().length < 2) {
        return res.status(400).json({ error: "text parameter required" });
      }

      try {
        const params = new URLSearchParams({
          text: text.trim(),
          apiKey: API_KEY,
          format: "json",
          limit: "1",
        });

        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/search?${params}`
        );

        if (!response.ok) {
          logger.warn(`Geoapify geocode returned ${response.status}`);
          return res.status(502).json({ error: "Geocoding service error" });
        }

        const data = await response.json();
        const result = data.results?.[0];

        if (!result) {
          return res.json({ result: null });
        }

        return res.json({
          result: {
            formatted: result.formatted,
            lat: result.lat,
            lon: result.lon,
            city: result.city,
            state: result.state,
            country: result.country,
            postcode: result.postcode,
          },
        });
      } catch (e) {
        logger.error(`Geocode error: ${e.message}`);
        return res.status(500).json({ error: "Internal error" });
      }
    });
  },
};
