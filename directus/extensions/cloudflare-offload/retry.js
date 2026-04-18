/**
 * Retry with exponential backoff.
 */
export async function withRetry(fn, { maxAttempts = 3, logger } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        if (logger) logger.warn(`Retry ${attempt}/${maxAttempts} in ${delay}ms: ${e.message}`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
