/**
 * Email Verification Token Utilities
 *
 * Generates and validates HMAC-based verification tokens tied to a user ID.
 * Token format: <timestamp_hex>.<hmac_hex>
 *
 * The token is derived from a server-side secret, the user ID, and a timestamp,
 * ensuring tokens cannot be forged without the secret and expire after a set period.
 */

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  const secret = process.env.EMAIL_VERIFICATION_SECRET || process.env.DRUPAL_CLIENT_SECRET;
  if (!secret) {
    throw new Error('EMAIL_VERIFICATION_SECRET or DRUPAL_CLIENT_SECRET must be set');
  }
  return secret;
}

/**
 * Generate a verification token for a given user ID.
 * Returns a token string that should be included in the verification email link.
 */
export async function generateVerificationToken(uid: string): Promise<string> {
  const secret = getSecret();
  const timestamp = Date.now().toString(16);
  const data = `${uid}:${timestamp}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data)
  );

  const hmac = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
  return `${timestamp}.${hmac}`;
}

/**
 * Validate a verification token for a given user ID.
 * Checks that the HMAC matches and the token has not expired.
 */
export async function validateVerificationToken(
  token: string,
  uid: string
): Promise<{ valid: boolean; error?: string }> {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token' };
  }

  const [timestamp, providedHmac] = parts;

  // Check expiration
  const tokenTime = parseInt(timestamp, 16);
  if (isNaN(tokenTime)) {
    return { valid: false, error: 'Invalid token timestamp' };
  }

  if (Date.now() - tokenTime > TOKEN_EXPIRY_MS) {
    return { valid: false, error: 'Token has expired' };
  }

  // Recompute expected HMAC
  const secret = getSecret();
  const data = `${uid}:${timestamp}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data)
  );

  const expectedHmac = Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');

  // Constant-time comparison
  if (expectedHmac.length !== providedHmac.length) {
    return { valid: false, error: 'Invalid token' };
  }

  let mismatch = 0;
  for (let i = 0; i < expectedHmac.length; i++) {
    mismatch |= expectedHmac.charCodeAt(i) ^ providedHmac.charCodeAt(i);
  }

  if (mismatch !== 0) {
    return { valid: false, error: 'Invalid token' };
  }

  return { valid: true };
}
