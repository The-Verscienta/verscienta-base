/**
 * Image Download Handler for Perenual
 * Stricter host allowlist than Trefle.
 * Ported from PerenualImageHandler.php.
 */

const ALLOWED_HOSTS = [
  "perenual.com",
  "www.perenual.com",
  "perenual-images.s3.amazonaws.com",
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

const BLOCKED_PATTERNS = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /localhost/i, /metadata/i, /^::1$/, /^0\.0\.0\.0$/,
];

export function isUrlSafe(urlStr) {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_PATTERNS.some((p) => p.test(hostname))) return false;
    if (!ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))) return false;
    return true;
  } catch {
    return false;
  }
}

export async function downloadImage(url) {
  if (!isUrlSafe(url)) throw new Error(`Blocked URL: ${url}`);

  const res = await fetch(url, {
    headers: { "User-Agent": "Verscienta Health Bot/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`Image download failed: ${res.status}`);

  const contentType = res.headers.get("content-type") || "";
  const mimeMap = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };
  const extension = mimeMap[contentType.split(";")[0].trim()] || guessExtension(url);

  if (!ALLOWED_EXTENSIONS.includes(extension)) throw new Error(`Disallowed image type: ${contentType}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, mimeType: contentType.split(";")[0].trim(), extension };
}

function guessExtension(url) {
  const match = url.match(/\.(\w+)(\?.*)?$/);
  return match && ALLOWED_EXTENSIONS.includes(match[1].toLowerCase()) ? match[1].toLowerCase() : "jpg";
}
