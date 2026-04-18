/**
 * Trefle.io API client with sliding-window rate limiting.
 * Rate limit: 120 requests per minute.
 */

const API_BASE = "https://trefle.io/api/v1";
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;

export class TrefleClient {
  constructor(apiKey, logger) {
    this.apiKey = apiKey;
    this.logger = logger;
    this.requestTimestamps = [];
  }

  /** Returns false if rate limit would be exceeded. */
  canRequest() {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < RATE_WINDOW_MS
    );
    return this.requestTimestamps.length < RATE_LIMIT;
  }

  async request(endpoint, params = {}) {
    if (!this.canRequest()) {
      this.logger.warn("Trefle rate limit reached, pausing");
      return null;
    }

    const url = new URL(API_BASE + endpoint);
    url.searchParams.set("token", this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }

    this.requestTimestamps.push(Date.now());

    const res = await fetch(url.href, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Trefle ${endpoint} returned ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json();
  }

  /** Fetch a page of species. */
  async getSpeciesPage(page) {
    return this.request("/species", { page });
  }

  /** Fetch detailed species data. */
  async getSpecies(id) {
    const data = await this.request(`/species/${id}`);
    return data?.data ?? null;
  }

  /** Search plants by query. */
  async search(query, page = 1) {
    return this.request("/plants/search", { q: query, page });
  }
}
