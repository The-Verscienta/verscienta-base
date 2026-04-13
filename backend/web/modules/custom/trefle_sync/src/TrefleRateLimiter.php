<?php

declare(strict_types=1);

namespace Drupal\trefle_sync;

use Drupal\Core\State\StateInterface;

/**
 * Handles rate limiting for Trefle API requests.
 *
 * Trefle allows 120 requests per minute. This service tracks request
 * timestamps and provides methods to check and enforce rate limits.
 */
class TrefleRateLimiter {

  /**
   * Maximum requests allowed per minute.
   */
  public const MAX_REQUESTS_PER_MINUTE = 120;

  /**
   * State key for storing request timestamps.
   */
  protected const STATE_KEY = 'trefle_sync.request_timestamps';

  /**
   * Constructs a TrefleRateLimiter object.
   *
   * @param \Drupal\Core\State\StateInterface $state
   *   The state service.
   */
  public function __construct(
    protected StateInterface $state,
  ) {}

  /**
   * Check if we can make another request.
   *
   * @return bool
   *   TRUE if a request can be made, FALSE if rate limited.
   */
  public function canMakeRequest(): bool {
    $this->cleanOldTimestamps();
    $timestamps = $this->getTimestamps();
    return count($timestamps) < self::MAX_REQUESTS_PER_MINUTE;
  }

  /**
   * Record a request timestamp.
   */
  public function recordRequest(): void {
    $timestamps = $this->getTimestamps();
    $timestamps[] = time();
    $this->state->set(self::STATE_KEY, $timestamps);
  }

  /**
   * Get the number of requests made in the current window.
   *
   * @return int
   *   The number of requests.
   */
  public function getRequestCount(): int {
    $this->cleanOldTimestamps();
    return count($this->getTimestamps());
  }

  /**
   * Get the number of remaining requests.
   *
   * @return int
   *   The number of remaining requests.
   */
  public function getRemainingRequests(): int {
    return max(0, self::MAX_REQUESTS_PER_MINUTE - $this->getRequestCount());
  }

  /**
   * Get seconds until the rate limit resets.
   *
   * @return int
   *   Seconds until the oldest timestamp expires from the window.
   */
  public function getSecondsUntilReset(): int {
    $timestamps = $this->getTimestamps();
    if (empty($timestamps)) {
      return 0;
    }

    $oldest = min($timestamps);
    $expiresAt = $oldest + 60;
    return max(0, $expiresAt - time());
  }

  /**
   * Wait until a request can be made.
   *
   * @param int $maxWait
   *   Maximum seconds to wait (default 60).
   *
   * @return bool
   *   TRUE if a request can be made, FALSE if max wait exceeded.
   */
  public function waitForAvailability(int $maxWait = 60): bool {
    $waited = 0;
    while (!$this->canMakeRequest() && $waited < $maxWait) {
      $sleepTime = max(1, $this->getSecondsUntilReset());
      sleep($sleepTime);
      $waited += $sleepTime;
    }

    return $this->canMakeRequest();
  }

  /**
   * Get stored timestamps.
   *
   * @return array
   *   Array of Unix timestamps.
   */
  protected function getTimestamps(): array {
    return $this->state->get(self::STATE_KEY, []);
  }

  /**
   * Remove timestamps older than 60 seconds.
   */
  protected function cleanOldTimestamps(): void {
    $timestamps = $this->getTimestamps();
    $cutoff = time() - 60;
    $timestamps = array_filter($timestamps, fn($ts) => $ts > $cutoff);
    $this->state->set(self::STATE_KEY, array_values($timestamps));
  }

}
