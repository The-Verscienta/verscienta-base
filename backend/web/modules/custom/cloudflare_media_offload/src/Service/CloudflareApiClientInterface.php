<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Service;

/**
 * Interface for Cloudflare Images API client.
 */
interface CloudflareApiClientInterface {

  /**
   * Upload an image to Cloudflare Images.
   *
   * @param string $imageData
   *   The image data as a string.
   * @param string $id
   *   Optional custom ID for the image.
   * @param array $metadata
   *   Optional metadata for the image.
   *
   * @return array
   *   The response data from Cloudflare API.
   *
   * @throws \Exception
   *   When the upload fails.
   */
  public function uploadImage(string $imageData, string $id = '', array $metadata = []): array;

  /**
   * Download an image from Cloudflare Images.
   *
   * @param string $id
   *   The image ID.
   *
   * @return string
   *   The image data as a string.
   *
   * @throws \Exception
   *   When the download fails.
   */
  public function downloadImage(string $id): string;

  /**
   * Delete an image from Cloudflare Images.
   *
   * @param string $id
   *   The image ID.
   *
   * @return bool
   *   TRUE if successful.
   *
   * @throws \Exception
   *   When the deletion fails.
   */
  public function deleteImage(string $id): bool;

  /**
   * Get image metadata from Cloudflare Images.
   *
   * @param string $id
   *   The image ID.
   *
   * @return array
   *   The image metadata.
   *
   * @throws \Exception
   *   When the metadata retrieval fails.
   */
  public function getImageMetadata(string $id): array;

  /**
   * List images from Cloudflare Images.
   *
   * @param int $page
   *   The page number for pagination.
   * @param int $perPage
   *   Number of images per page.
   *
   * @return array
   *   Array of image metadata.
   *
   * @throws \Exception
   *   When the listing fails.
   */
  public function listImages(int $page = 1, int $perPage = 100): array;

  /**
   * Get the public URL for an image.
   *
   * @param string $id
   *   The image ID.
   *
   * @return string
   *   The public URL.
   */
  public function getImageUrl(string $id): string;

  /**
   * Get a variant URL for an image with transformations.
   *
   * @param string $id
   *   The image ID.
   * @param string $variant
   *   The variant name or transformation parameters.
   *
   * @return string
   *   The variant URL.
   */
  public function getImageVariantUrl(string $id, string $variant): string;

  /**
   * Get a transformed image URL with specific parameters.
   *
   * @param string $id
   *   The image ID.
   * @param array $transformations
   *   Array of transformation parameters (width, height, fit, quality, format, gravity).
   *
   * @return string
   *   The transformed image URL.
   */
  public function getTransformedImageUrl(string $id, array $transformations = []): string;

  /**
   * Test the API connection.
   *
   * @return bool
   *   TRUE if the connection is successful.
   */
  public function testConnection(): bool;

  /**
   * Purge cache for an image.
   *
   * @param string $id
   *   The image ID.
   *
   * @return bool
   *   TRUE if successful.
   *
   * @throws \Exception
   *   When the purge fails.
   */
  public function purgeCache(string $id): bool;

}