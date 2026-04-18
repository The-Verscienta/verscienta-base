/**
 * Cloudflare Images API client.
 * Port of CloudflareApiClient.php.
 */

const API_BASE = "https://api.cloudflare.com/client/v4";
const DELIVERY_BASE = "https://imagedelivery.net";

export class CloudflareImagesClient {
  constructor(token, accountId, accountHash, logger) {
    this.token = token;
    this.accountId = accountId;
    this.accountHash = accountHash;
    this.logger = logger;
  }

  /** Build the delivery URL for an image. */
  deliveryUrl(imageId) {
    return `${DELIVERY_BASE}/${this.accountHash}/${imageId}`;
  }

  /**
   * Upload an image to Cloudflare Images.
   * @param {Buffer} buffer - Image data.
   * @param {string} filename - Original filename.
   * @param {object} metadata - Key-value metadata.
   * @returns {object} - { id, deliveryUrl }
   */
  async upload(buffer, filename, metadata = {}) {
    const formData = new FormData();
    formData.append("file", new Blob([buffer]), filename);

    if (Object.keys(metadata).length > 0) {
      formData.append("metadata", JSON.stringify(metadata));
    }

    const res = await fetch(
      `${API_BASE}/accounts/${this.accountId}/images/v1`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}` },
        body: formData,
        signal: AbortSignal.timeout(60_000),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Cloudflare upload failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const data = await res.json();
    const imageId = data.result?.id;
    if (!imageId) throw new Error("Cloudflare upload returned no image ID");

    return {
      id: imageId,
      deliveryUrl: this.deliveryUrl(imageId),
    };
  }

  /**
   * Delete an image from Cloudflare Images.
   * @param {string} imageId - Cloudflare image ID.
   */
  async delete(imageId) {
    const res = await fetch(
      `${API_BASE}/accounts/${this.accountId}/images/v1/${imageId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.token}` },
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => "");
      throw new Error(`Cloudflare delete failed (${res.status}): ${text.slice(0, 200)}`);
    }
  }
}
