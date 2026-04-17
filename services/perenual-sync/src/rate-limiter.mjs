/**
 * Daily Rate Limiter for Perenual API (100 req/day free tier)
 * Ported from PerenualRateLimiter.php.
 */

export class DailyRateLimiter {
  constructor(maxPerDay = 100) {
    this.maxPerDay = maxPerDay;
    this.count = 0;
    this.date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  _resetIfNewDay() {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.date) {
      this.count = 0;
      this.date = today;
    }
  }

  canMakeRequest() {
    this._resetIfNewDay();
    return this.count < this.maxPerDay;
  }

  recordRequest() {
    this._resetIfNewDay();
    this.count++;
  }

  getRequestCount() {
    this._resetIfNewDay();
    return this.count;
  }

  getRemaining() {
    this._resetIfNewDay();
    return Math.max(0, this.maxPerDay - this.count);
  }
}
