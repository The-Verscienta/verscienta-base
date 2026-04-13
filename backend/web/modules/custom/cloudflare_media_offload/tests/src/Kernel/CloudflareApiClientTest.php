<?php

declare(strict_types=1);

namespace Drupal\Tests\cloudflare_media_offload\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface;

/**
 * Tests for the CloudflareApiClient service.
 *
 * @group cloudflare_media_offload
 * @coversDefaultClass \Drupal\cloudflare_media_offload\Service\CloudflareApiClient
 */
class CloudflareApiClientTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'key',
    'cloudflare_media_offload',
  ];

  /**
   * The Cloudflare API client.
   *
   * @var \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface
   */
  protected CloudflareApiClientInterface $apiClient;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installConfig(['cloudflare_media_offload']);
    $this->apiClient = $this->container->get('cloudflare_media_offload.api_client');
  }

  /**
   * Tests getImageUrl method.
   *
   * @covers ::getImageUrl
   */
  public function testGetImageUrl(): void {
    // Set up configuration
    $config = $this->config('cloudflare_media_offload.settings');
    $config->set('account_hash', 'test-hash-123')->save();

    // This will fail without credentials, but we can test the URL format
    $image_id = 'test-image-id';
    $url = $this->apiClient->getImageUrl($image_id);

    $expected_url = 'https://imagedelivery.net/test-hash-123/test-image-id';
    $this->assertEquals($expected_url, $url);
  }

  /**
   * Tests getTransformedImageUrl method.
   *
   * @covers ::getTransformedImageUrl
   */
  public function testGetTransformedImageUrl(): void {
    // Set up configuration
    $config = $this->config('cloudflare_media_offload.settings');
    $config->set('account_hash', 'test-hash-123')->save();

    $image_id = 'test-image-id';
    $transformations = [
      'width' => 800,
      'height' => 600,
      'fit' => 'crop',
      'quality' => 85,
    ];

    $url = $this->apiClient->getTransformedImageUrl($image_id, $transformations);

    $this->assertStringContainsString('w=800', $url);
    $this->assertStringContainsString('h=600', $url);
    $this->assertStringContainsString('fit=crop', $url);
    $this->assertStringContainsString('quality=85', $url);
  }

  /**
   * Tests getImageVariantUrl method.
   *
   * @covers ::getImageVariantUrl
   */
  public function testGetImageVariantUrl(): void {
    // Set up configuration
    $config = $this->config('cloudflare_media_offload.settings');
    $config->set('account_hash', 'test-hash-123')->save();

    $image_id = 'test-image-id';
    $variant = 'thumbnail';

    $url = $this->apiClient->getImageVariantUrl($image_id, $variant);

    $expected_url = 'https://imagedelivery.net/test-hash-123/test-image-id/thumbnail';
    $this->assertEquals($expected_url, $url);
  }

}