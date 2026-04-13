import { z } from 'zod';

/**
 * Environment variable validation schema
 *
 * This validates environment variables at build/runtime to fail fast
 * if required configuration is missing or invalid.
 */

// Server-side environment variables (not exposed to browser)
const serverEnvSchema = z.object({
  // Drupal backend configuration
  DRUPAL_CLIENT_ID: z.string().min(1).optional(),
  DRUPAL_CLIENT_SECRET: z.string().min(1).optional(),

  // AI API configuration
  XAI_API_KEY: z.string().min(1).optional(),

  // Caching
  REDIS_URL: z.string().url().optional(),

  // Cloudflare Turnstile (CAPTCHA)
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),

  // CSRF Protection
  CSRF_SECRET: z.string().min(1).optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Client-side environment variables (exposed to browser via NEXT_PUBLIC_ prefix)
const clientEnvSchema = z.object({
  // Algolia search
  NEXT_PUBLIC_ALGOLIA_APP_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: z.string().min(1).optional(),

  // Turnstile site key (public)
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),

  // Public Drupal URL for images
  NEXT_PUBLIC_DRUPAL_BASE_URL: z.string().url().optional(),
});

// Combined schema for full validation
const envSchema = serverEnvSchema.merge(clientEnvSchema);

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Validate server environment variables
 * Call this during app initialization to fail fast on misconfiguration
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid server environment variables:');
    console.error(result.error.flatten().fieldErrors);

    // In development, warn but don't crash
    if (process.env.NODE_ENV === 'development') {
      console.warn('Continuing with default values in development mode');
      return serverEnvSchema.parse({});
    }

    throw new Error('Invalid server environment configuration');
  }

  return result.data;
}

/**
 * Validate client environment variables
 */
export function validateClientEnv(): ClientEnv {
  const clientEnvValues = {
    NEXT_PUBLIC_ALGOLIA_APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_DRUPAL_BASE_URL: process.env.NEXT_PUBLIC_DRUPAL_BASE_URL,
  };

  const result = clientEnvSchema.safeParse(clientEnvValues);

  if (!result.success) {
    console.error('Invalid client environment variables:');
    console.error(result.error.flatten().fieldErrors);

    if (process.env.NODE_ENV === 'development') {
      console.warn('Continuing with default values in development mode');
      return clientEnvSchema.parse({});
    }

    throw new Error('Invalid client environment configuration');
  }

  return result.data;
}

/**
 * Get validated server environment
 * Caches the result to avoid re-validation
 */
let cachedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    cachedServerEnv = validateServerEnv();
  }
  return cachedServerEnv;
}

/**
 * Get validated client environment
 */
let cachedClientEnv: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (!cachedClientEnv) {
    cachedClientEnv = validateClientEnv();
  }
  return cachedClientEnv;
}

/**
 * Check if a specific feature is configured
 */
export const featureFlags = {
  hasAlgolia: () => {
    const env = getClientEnv();
    return !!(env.NEXT_PUBLIC_ALGOLIA_APP_ID && env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY);
  },

  hasTurnstile: () => {
    const env = getClientEnv();
    return !!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  },

  hasAI: () => {
    const env = getServerEnv();
    return !!env.XAI_API_KEY;
  },

  hasRedis: () => {
    const env = getServerEnv();
    return !!env.REDIS_URL;
  },
};

/**
 * Log environment configuration summary (safe - doesn't log secrets)
 */
export function logEnvSummary(): void {
  const server = getServerEnv();

  console.log('Environment Configuration:');
  console.log(`  NODE_ENV: ${server.NODE_ENV}`);
  console.log(`  DRUPAL_BASE_URL: ${process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || 'Not configured'}`);
  console.log(`  Drupal OAuth: ${server.DRUPAL_CLIENT_ID ? 'Configured' : 'Not configured'}`);
  console.log(`  xAI API: ${server.XAI_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`  Redis: ${server.REDIS_URL ? 'Configured' : 'Not configured'}`);
  console.log(`  Algolia: ${featureFlags.hasAlgolia() ? 'Configured' : 'Not configured'}`);
  console.log(`  Turnstile: ${featureFlags.hasTurnstile() ? 'Configured' : 'Not configured'}`);
}
