/**
 * Image Download Handler with SSRF Protection
 *
 * Ported from TrefleImageHandler.php.
 * Downloads plant images from allowed hosts only.
 */

const ALLOWED_HOSTS = [
  "trefle.io",
  "bs.plantnet.org",
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "inaturalist-open-data.s3.amazonaws.com",
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

const BLOCKED_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /localhost/i,
  /metadata/i,
  /^::1$/,
  /^0\.0\.0\.0$/,
];

/**
 * Validate URL for SSRF safety
 */
function isUrlSafe(urlStr) {
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

/**
 * Download an image from a URL
 * @returns {{ buffer: Buffer, mimeType: string, extension: string }}
 */
export async function downloadImage(url) {
  if (!isUrlSafe(url)) {
    throw new Error(`Blocked URL: ${url}`);
  }

  const res = await fetch(url, {
    headers: { "User-Agent": "Verscienta Health Bot/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    throw new Error(`Image download failed: ${res.status} ${url}`);
  }

  const contentType = res.headers.get("content-type") || "";
  const mimeMap = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };

  const extension = mimeMap[contentType.split(";")[0].trim()] || guessExtension(url);
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(`Disallowed image type: ${contentType}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  // Basic magic byte validation
  if (!isValidImageBuffer(buffer)) {
    throw new Error("Downloaded file is not a valid image");
  }

  return { buffer, mimeType: contentType.split(";")[0].trim(), extension };
}

function guessExtension(url) {
  const match = url.match(/\.(\w+)(\?.*)?$/);
  if (match && ALLOWED_EXTENSIONS.includes(match[1].toLowerCase())) {
    return match[1].toLowerCase();
  }
  return "jpg"; // Default
}

function isValidImageBuffer(buffer) {
  if (buffer.length < 4) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true;
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer.length > 11 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  return false;
}
