/**
 * Build an image URL, preferring Cloudflare delivery if available.
 */
const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL;

export function imageUrl(
  file: { cloudflare_url?: string; id?: string } | string,
  params: { width?: number; height?: number; fit?: string; format?: string } = {}
): string {
  const { width, height, fit = "cover", format = "webp" } = params;

  // If file is a string (just an ID), use Directus assets.
  if (typeof file === "string") {
    const qs = new URLSearchParams();
    if (width) qs.set("width", String(width));
    if (height) qs.set("height", String(height));
    qs.set("fit", fit);
    qs.set("format", format);
    return `${directusUrl}/assets/${file}?${qs}`;
  }

  // Prefer Cloudflare URL.
  if (file.cloudflare_url) {
    const parts = [];
    if (width) parts.push(`w=${width}`);
    if (height) parts.push(`h=${height}`);
    parts.push(`fit=${fit}`);
    parts.push(`format=${format}`);
    return `${file.cloudflare_url}/${parts.join(",")}`;
  }

  // Fallback to Directus assets.
  const id = file.id || "";
  const qs = new URLSearchParams();
  if (width) qs.set("width", String(width));
  if (height) qs.set("height", String(height));
  qs.set("fit", fit);
  qs.set("format", format);
  return `${directusUrl}/assets/${id}?${qs}`;
}
