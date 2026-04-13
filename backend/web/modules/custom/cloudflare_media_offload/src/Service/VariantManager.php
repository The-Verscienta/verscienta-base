<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Service;

use Drupal\Core\Config\ConfigFactoryInterface;

/**
 * Service for managing Cloudflare image variants.
 */
class VariantManager {

  /**
   * Constructs a new VariantManager.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient
   *   The Cloudflare API client.
   */
  public function __construct(
    protected ConfigFactoryInterface $configFactory,
    protected CloudflareApiClientInterface $apiClient,
  ) {}

  /**
   * Get all configured variants.
   *
   * @return array
   *   Array of variant configurations.
   */
  public function getAllVariants(): array {
    $config = $this->configFactory->get('cloudflare_media_offload.variants');
    return $config->get('variants') ?? [];
  }

  /**
   * Get enabled variants only.
   *
   * @return array
   *   Array of enabled variant configurations.
   */
  public function getEnabledVariants(): array {
    $variants = $this->getAllVariants();
    return array_filter($variants, fn($variant) => !empty($variant['enabled']));
  }

  /**
   * Get a specific variant by machine name.
   *
   * @param string $machine_name
   *   The variant machine name.
   *
   * @return array|null
   *   The variant configuration or NULL if not found.
   */
  public function getVariant(string $machine_name): ?array {
    $variants = $this->getAllVariants();
    return $variants[$machine_name] ?? NULL;
  }

  /**
   * Get the URL for an image with a specific variant applied.
   *
   * @param string $image_id
   *   The Cloudflare image ID.
   * @param string $variant_name
   *   The variant machine name.
   *
   * @return string|null
   *   The variant URL or NULL if variant doesn't exist.
   */
  public function getVariantUrl(string $image_id, string $variant_name): ?string {
    $variant = $this->getVariant($variant_name);

    if (!$variant || empty($variant['enabled'])) {
      return NULL;
    }

    $transformations = $this->variantToTransformations($variant);
    return $this->apiClient->getTransformedImageUrl($image_id, $transformations);
  }

  /**
   * Convert a variant configuration to Cloudflare transformation parameters.
   *
   * @param array $variant
   *   The variant configuration.
   *
   * @return array
   *   Array of transformation parameters.
   */
  public function variantToTransformations(array $variant): array {
    $transformations = [];

    if (!empty($variant['width'])) {
      $transformations['width'] = (int) $variant['width'];
    }

    if (!empty($variant['height'])) {
      $transformations['height'] = (int) $variant['height'];
    }

    if (!empty($variant['fit'])) {
      $transformations['fit'] = $variant['fit'];
    }

    if (!empty($variant['gravity']) && $variant['gravity'] !== 'auto') {
      $transformations['gravity'] = $variant['gravity'];
    }

    if (!empty($variant['quality'])) {
      $transformations['quality'] = (int) $variant['quality'];
    }

    if (!empty($variant['format']) && $variant['format'] !== 'auto') {
      $transformations['format'] = $variant['format'];
    }

    return $transformations;
  }

  /**
   * Get variant options for form elements.
   *
   * @return array
   *   Array of variant options keyed by machine name.
   */
  public function getVariantOptions(): array {
    $variants = $this->getEnabledVariants();
    $options = [];

    foreach ($variants as $machine_name => $variant) {
      $label = $variant['label'] ?? $machine_name;
      $dimensions = [];

      if (!empty($variant['width'])) {
        $dimensions[] = $variant['width'] . 'w';
      }

      if (!empty($variant['height'])) {
        $dimensions[] = $variant['height'] . 'h';
      }

      $dimension_text = !empty($dimensions) ? ' (' . implode(' × ', $dimensions) . ')' : '';
      $options[$machine_name] = $label . $dimension_text;
    }

    return $options;
  }

  /**
   * Check if a variant exists.
   *
   * @param string $machine_name
   *   The variant machine name.
   *
   * @return bool
   *   TRUE if the variant exists.
   */
  public function variantExists(string $machine_name): bool {
    return $this->getVariant($machine_name) !== NULL;
  }

  /**
   * Check if a variant is enabled.
   *
   * @param string $machine_name
   *   The variant machine name.
   *
   * @return bool
   *   TRUE if the variant exists and is enabled.
   */
  public function isVariantEnabled(string $machine_name): bool {
    $variant = $this->getVariant($machine_name);
    return $variant && !empty($variant['enabled']);
  }

}