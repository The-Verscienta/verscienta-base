import { AuthTokens, DrupalUser } from './drupal';

const DRUPAL_BASE_URL = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || '';
const CLIENT_ID = process.env.DRUPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.DRUPAL_CLIENT_SECRET || '';

// Warn at startup if OAuth credentials are missing (auth features will fail)
if (typeof window === 'undefined' && (!CLIENT_ID || !CLIENT_SECRET)) {
  console.warn('[auth] DRUPAL_CLIENT_ID or DRUPAL_CLIENT_SECRET not set — OAuth disabled');
}

/**
 * Authenticate user with Drupal OAuth
 * @param username - Drupal username or email
 * @param password - User password
 * @returns Authentication tokens
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<AuthTokens> {
  const response = await fetch(`${DRUPAL_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Authentication failed');
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - The refresh token
 * @returns New authentication tokens
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<AuthTokens> {
  const response = await fetch(`${DRUPAL_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
}

/**
 * Get current user information
 * @param accessToken - Valid access token
 * @returns User data
 */
export async function getCurrentUser(
  accessToken: string
): Promise<DrupalUser> {
  const response = await fetch(`${DRUPAL_BASE_URL}/jsonapi/current_user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/vnd.api+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Logout user (revoke tokens)
 * @param accessToken - Access token to revoke
 */
export async function logoutUser(accessToken: string): Promise<void> {
  // Drupal Simple OAuth doesn't have a revoke endpoint by default
  // Tokens will expire naturally based on their lifetime
  // You can implement token blacklisting on the Drupal side if needed

  // For now, we just clear client-side session
  // The token will expire based on its TTL
}

/**
 * Register new user
 * @param userData - User registration data
 * @returns Created user data
 */
export async function registerUser(userData: {
  name: string;
  mail: string;
  pass: string;
  field_first_name?: string;
  field_last_name?: string;
}): Promise<DrupalUser> {
  const response = await fetch(`${DRUPAL_BASE_URL}/jsonapi/user/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'user--user',
        attributes: {
          name: userData.name,
          mail: userData.mail,
          pass: userData.pass,
          field_first_name: userData.field_first_name,
          field_last_name: userData.field_last_name,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.detail || 'Registration failed');
  }

  const data = await response.json();
  return data.data;
}
