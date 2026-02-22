/**
 * Analytics stub for A/B testing and event tracking.
 *
 * In production, replace the track() implementation with PostHog, Segment,
 * or your preferred analytics provider.
 */

export type AnalyticsEvent =
  | { event: 'symbolic_verify_visible'; herbId: string; variant: 'control' | 'treatment' }
  | { event: 'symbolic_verify_click'; herbId: string }
  | { event: 'symbolic_verify_result'; herbId: string; withinLimits: boolean; cached: boolean }
  | { event: 'symbolic_verify_feedback'; herbId: string; rating: 'up' | 'down' };

/**
 * Get the A/B test variant for a given experiment.
 * Returns 'treatment' if feature is enabled, 'control' otherwise.
 * In production, replace with PostHog feature flag or similar.
 */
export function getVariant(experiment: string): 'control' | 'treatment' {
  if (experiment === 'symbolic_verify') {
    return process.env.NEXT_PUBLIC_SYMBOLIC_FEATURE === 'true' ? 'treatment' : 'control';
  }
  return 'control';
}

/**
 * Track an analytics event.
 * Stub implementation logs to console in development.
 * Replace with PostHog/Segment in production.
 */
export function track(payload: AnalyticsEvent): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', payload.event, payload);
  }

  // PostHog stub — uncomment when PostHog is integrated:
  // if (typeof window !== 'undefined' && (window as any).posthog) {
  //   (window as any).posthog.capture(payload.event, payload);
  // }
}
