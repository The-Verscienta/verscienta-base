/**
 * Sliding Window Rate Limiter
 *
 * Ported from TrefleRateLimiter.php.
 * 120 requests per 60-second window.
 */

export class RateLimiter {
  constructor(maxRequests = 120, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.timestamps = [];
  }

  /** Remove expired timestamps */
  _cleanup() {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }

  canMakeRequest() {
    this._cleanup();
    return this.timestamps.length < this.maxRequests;
  }

  recordRequest() {
    this.timestamps.push(Date.now());
  }

  getRemaining() {
    this._cleanup();
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  getSecondsUntilReset() {
    this._cleanup();
    if (this.timestamps.length === 0) return 0;
    const oldest = this.timestamps[0];
    return Math.max(0, Math.ceil((oldest + this.windowMs - Date.now()) / 1000));
  }

  async waitForAvailability(maxWaitSec = 120) {
    const deadline = Date.now() + maxWaitSec * 1000;
    while (!this.canMakeRequest()) {
      if (Date.now() > deadline) {
        throw new Error(`Rate limit: waited ${maxWaitSec}s, still at capacity`);
      }
      const waitMs = Math.min(1000, this.getSecondsUntilReset() * 1000 + 100);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}
