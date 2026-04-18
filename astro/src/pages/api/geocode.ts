/**
 * API Route: Geocode proxy
 *
 * Proxies geocoding requests to the Directus geocoding endpoint,
 * keeping the Geoapify API key server-side and avoiding CORS/CSP issues.
 *
 * GET /api/geocode?text=53216
 */
import type { APIRoute } from "astro";

const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL || "http://localhost:8055";

export const GET: APIRoute = async ({ url }) => {
  const text = url.searchParams.get("text");

  if (!text || text.trim().length < 2) {
    return new Response(JSON.stringify({ result: null }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(
      `${DIRECTUS_URL}/geocoding/geocode?text=${encodeURIComponent(text.trim())}`
    );

    if (!res.ok) {
      return new Response(JSON.stringify({ result: null }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ result: null }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
