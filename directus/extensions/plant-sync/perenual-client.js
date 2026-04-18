/**
 * Perenual.com API client with daily rate limiting.
 * Rate limit: 100 requests per day (free tier).
 */

const API_BASE = "https://perenual.com/api/v2";
const DAILY_LIMIT = 100;

export class PerenualClient {
  constructor(apiKey, logger) {
    this.apiKey = apiKey;
    this.logger = logger;
    this.requestCount = 0;
    this.requestDate = new Date().toISOString().slice(0, 10);
  }

  /** Reset counter if day has changed. */
  checkDayReset() {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.requestDate) {
      this.requestCount = 0;
      this.requestDate = today;
    }
  }

  /** Load persisted counter from import_logs. */
  loadCounter(count, date) {
    this.requestCount = count || 0;
    this.requestDate = date || new Date().toISOString().slice(0, 10);
  }

  canRequest() {
    this.checkDayReset();
    return this.requestCount < DAILY_LIMIT;
  }

  getRemainingRequests() {
    this.checkDayReset();
    return DAILY_LIMIT - this.requestCount;
  }

  async request(endpoint, params = {}) {
    if (!this.canRequest()) {
      this.logger.warn("Perenual daily limit reached, skipping enrichment");
      return null;
    }

    const url = new URL(API_BASE + endpoint);
    url.searchParams.set("key", this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }

    this.requestCount++;

    const res = await fetch(url.href, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Perenual ${endpoint} returned ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json();
  }

  /** Search species by scientific name. */
  async searchByName(scientificName) {
    return this.request("/species-list", { q: scientificName });
  }

  /** Get detailed species data. */
  async getSpecies(id) {
    return this.request(`/species/details/${id}`);
  }
}
