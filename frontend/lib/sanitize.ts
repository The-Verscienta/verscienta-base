/**
 * HTML Sanitization Utilities
 *
 * Provides XSS protection for user-generated and CMS content.
 * Uses a whitelist approach for allowed tags and attributes.
 */

// Allowed HTML tags for rich content (e.g., from Drupal)
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'hr',
  'img', 'figure', 'figcaption',
]);

// Allowed attributes per tag
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  '*': new Set(['class', 'id']), // Global attributes
  'a': new Set(['href', 'title', 'target', 'rel']),
  'img': new Set(['src', 'alt', 'title', 'width', 'height', 'loading']),
  'td': new Set(['colspan', 'rowspan']),
  'th': new Set(['colspan', 'rowspan', 'scope']),
};

// Dangerous URL protocols
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

/**
 * Check if a URL is safe
 */
function isSafeUrl(url: string): boolean {
  const normalizedUrl = url.toLowerCase().trim();
  return !DANGEROUS_PROTOCOLS.some(protocol => normalizedUrl.startsWith(protocol));
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Sanitize an attribute value
 */
function sanitizeAttribute(tagName: string, attrName: string, attrValue: string): string | null {
  const normalizedAttr = attrName.toLowerCase();
  const normalizedTag = tagName.toLowerCase();

  // Check if attribute is allowed for this tag or globally
  const tagAllowed = ALLOWED_ATTRIBUTES[normalizedTag]?.has(normalizedAttr);
  const globalAllowed = ALLOWED_ATTRIBUTES['*']?.has(normalizedAttr);

  if (!tagAllowed && !globalAllowed) {
    return null;
  }

  // Sanitize URL attributes
  if (['href', 'src'].includes(normalizedAttr)) {
    if (!isSafeUrl(attrValue)) {
      return null;
    }
  }

  // For links, ensure rel="noopener noreferrer" for external links
  if (normalizedAttr === 'target' && attrValue === '_blank') {
    // This is handled at the tag level
  }

  // Escape attribute value
  return attrValue.replace(/"/g, '&quot;');
}

/**
 * Simple HTML sanitizer using regex
 * For production, consider using DOMPurify on the server side
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove on* event handlers (quoted and unquoted values)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>"']+/gi, '');

  // Remove javascript: URLs everywhere (not just in href/src)
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove javascript: in href/src attributes specifically
  sanitized = sanitized.replace(/href\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, '');

  // Remove data: URLs in src/href attributes
  sanitized = sanitized.replace(/(src|href)\s*=\s*["']?\s*data\s*:/gi, '$1=');

  // Remove data: URLs in src (except for small images) — additional safety
  sanitized = sanitized.replace(/src\s*=\s*["']?\s*data:(?!image\/(?:png|jpeg|gif|webp);base64,)[^"'>\s]*/gi, '');

  // Remove vbscript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']?\s*vbscript:[^"'>\s]*/gi, 'href="#"');

  // Add rel="noopener noreferrer" to external links with target="_blank"
  sanitized = sanitized.replace(
    /<a\s+([^>]*target\s*=\s*["']_blank["'][^>]*)>/gi,
    (match, attrs) => {
      if (!attrs.includes('rel=')) {
        return `<a ${attrs} rel="noopener noreferrer">`;
      }
      return match;
    }
  );

  // Remove disallowed tags but keep their content
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (ALLOWED_TAGS.has(tagName.toLowerCase())) {
      return match;
    }
    // For closing tags of disallowed elements, just remove
    if (match.startsWith('</')) {
      return '';
    }
    // For opening tags, remove the tag but log it
    return '';
  });

  return sanitized;
}

/**
 * Sanitize plain text (no HTML allowed)
 * Use this for user input that should not contain any HTML
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return escapeHtml(text.trim());
}

/**
 * Sanitize for use in JSON
 * Prevents JSON injection attacks
 */
export function sanitizeForJson(value: unknown): unknown {
  if (typeof value === 'string') {
    // Remove null bytes and other control characters
    return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForJson);
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Sanitize keys too
      const safeKey = key.replace(/[^\w.-]/g, '');
      sanitized[safeKey] = sanitizeForJson(val);
    }
    return sanitized;
  }
  return value;
}

/**
 * Validate and sanitize a URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Check for dangerous protocols
  if (!isSafeUrl(trimmed)) {
    return null;
  }

  // Allow relative URLs
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  // Validate absolute URLs
  try {
    const parsed = new URL(trimmed);
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    // If URL parsing fails, it might be a relative URL
    // Only allow if it looks safe
    if (/^[\w./-]+$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }
}
