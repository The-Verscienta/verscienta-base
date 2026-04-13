<?php

namespace Drupal\verscienta_oidc_discovery\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Provides OIDC discovery and front-channel logout endpoints.
 */
class OidcDiscoveryController extends ControllerBase {

  /**
   * Returns the OpenID Connect discovery document.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The discovery document.
   */
  public function discovery(Request $request): JsonResponse {
    $base_url = $request->getSchemeAndHttpHost();

    $discovery = [
      'issuer' => $base_url,
      'authorization_endpoint' => $base_url . '/oauth/authorize',
      'token_endpoint' => $base_url . '/oauth/token',
      'userinfo_endpoint' => $base_url . '/oauth/userinfo',
      'jwks_uri' => $base_url . '/.well-known/jwks.json',
      'end_session_endpoint' => $base_url . '/oauth/logout',
      'response_types_supported' => ['code'],
      'subject_types_supported' => ['public'],
      'id_token_signing_alg_values_supported' => ['RS256'],
      'scopes_supported' => ['openid', 'email', 'profile'],
      'token_endpoint_auth_methods_supported' => [
        'client_secret_basic',
        'client_secret_post',
      ],
      'code_challenge_methods_supported' => ['S256'],
      'grant_types_supported' => [
        'authorization_code',
        'refresh_token',
      ],
      'claims_supported' => [
        'sub',
        'name',
        'preferred_username',
        'email',
        'email_verified',
        'locale',
        'profile',
        'updated_at',
        'zoneinfo',
        'roles',
      ],
    ];

    $response = new JsonResponse($discovery);
    $response->headers->set('Cache-Control', 'public, max-age=3600');
    $response->headers->set('Access-Control-Allow-Origin', '*');
    return $response;
  }

  /**
   * Front-channel logout endpoint.
   *
   * Destroys the Drupal session and redirects to the post_logout_redirect_uri.
   *
   * @return \Symfony\Component\HttpFoundation\RedirectResponse
   *   Redirect to the post-logout URI or the front page.
   */
  public function logout(Request $request): RedirectResponse {
    $redirect_uri = $request->query->get('post_logout_redirect_uri');

    // Destroy the current session.
    $session = $request->getSession();
    if ($session) {
      $session->invalidate();
    }

    // Validate redirect URI against allowed origins.
    if ($redirect_uri && $this->isAllowedRedirectUri($redirect_uri)) {
      return new RedirectResponse($redirect_uri);
    }

    // Default: redirect to the site front page.
    return new RedirectResponse('/');
  }

  /**
   * Validates that a redirect URI is from a trusted origin.
   *
   * @param string $uri
   *   The URI to validate.
   *
   * @return bool
   *   TRUE if the URI is from a trusted origin.
   */
  private function isAllowedRedirectUri(string $uri): bool {
    $parsed = parse_url($uri);
    if (!$parsed || empty($parsed['host'])) {
      return FALSE;
    }

    // Allow any verscienta.com subdomain and common dev origins.
    $host = $parsed['host'];
    $allowed_patterns = [
      '/\.verscienta\.com$/',
      '/^verscienta\.com$/',
      '/^localhost$/',
      '/^127\.0\.0\.1$/',
    ];

    foreach ($allowed_patterns as $pattern) {
      if (preg_match($pattern, $host)) {
        return TRUE;
      }
    }

    return FALSE;
  }

}
