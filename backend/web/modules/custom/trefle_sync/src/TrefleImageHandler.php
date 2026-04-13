<?php

declare(strict_types=1);

namespace Drupal\trefle_sync;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\file\FileRepositoryInterface;
use Drupal\node\NodeInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Log\LoggerInterface;

/**
 * Handles downloading and attaching images from Trefle API.
 */
class TrefleImageHandler {

  /**
   * Maximum number of images to download per plant.
   */
  protected const MAX_IMAGES = 5;

  /**
   * Directory for storing Trefle images.
   */
  protected const IMAGE_DIRECTORY = 'public://trefle_images';

  /**
   * Image types to download in order of preference.
   */
  protected const IMAGE_TYPES = ['flower', 'leaf', 'habit', 'fruit', 'bark'];

  /**
   * The logger.
   *
   * @var \Psr\Log\LoggerInterface
   */
  protected LoggerInterface $logger;

  /**
   * Constructs a TrefleImageHandler object.
   *
   * @param \Drupal\Core\File\FileSystemInterface $fileSystem
   *   The file system service.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $loggerFactory
   *   The logger factory.
   * @param \Drupal\file\FileRepositoryInterface $fileRepository
   *   The file repository.
   */
  public function __construct(
    protected FileSystemInterface $fileSystem,
    protected EntityTypeManagerInterface $entityTypeManager,
    LoggerChannelFactoryInterface $loggerFactory,
    protected FileRepositoryInterface $fileRepository,
    protected ClientInterface $httpClient,
  ) {
    $this->logger = $loggerFactory->get('trefle_sync');
  }

  /**
   * Download and attach images to a node.
   *
   * @param array $plantData
   *   The plant data from Trefle API.
   * @param \Drupal\node\NodeInterface $node
   *   The node to attach images to.
   *
   * @return int
   *   The number of images successfully attached.
   */
  public function attachImages(array $plantData, NodeInterface $node): int {
    if (!$node->hasField('field_herb_images')) {
      $this->logger->warning('Node type does not have field_herb_images field.');
      return 0;
    }

    // Ensure the directory exists.
    if (!$this->prepareDirectory()) {
      return 0;
    }

    $imageUrls = $this->extractImageUrls($plantData);
    if (empty($imageUrls)) {
      return 0;
    }

    $attached = 0;
    $fileEntities = [];

    foreach ($imageUrls as $imageData) {
      if ($attached >= self::MAX_IMAGES) {
        break;
      }

      $file = $this->downloadImage(
        $imageData['url'],
        $plantData['id'] ?? 0,
        $imageData['type']
      );

      if ($file) {
        $fileEntities[] = [
          'target_id' => $file->id(),
          'alt' => $this->buildAltText($plantData, $imageData['type']),
          'title' => $this->buildTitleText($plantData, $imageData['type']),
        ];
        $attached++;
      }
    }

    if (!empty($fileEntities)) {
      // Append to existing images or set new ones.
      $existingImages = $node->get('field_herb_images')->getValue();
      $node->set('field_herb_images', array_merge($existingImages, $fileEntities));
    }

    return $attached;
  }

  /**
   * Extract image URLs from plant data.
   *
   * @param array $plantData
   *   The plant data.
   *
   * @return array
   *   Array of image data with 'url' and 'type' keys.
   */
  protected function extractImageUrls(array $plantData): array {
    $images = [];

    // Check for images array in the data.
    $imageData = $plantData['images'] ?? [];

    foreach (self::IMAGE_TYPES as $type) {
      if (!empty($imageData[$type])) {
        $typeImages = is_array($imageData[$type]) ? $imageData[$type] : [$imageData[$type]];
        foreach ($typeImages as $image) {
          $url = is_array($image) ? ($image['image_url'] ?? $image['url'] ?? NULL) : $image;
          if ($url) {
            $images[] = [
              'url' => $url,
              'type' => $type,
            ];
          }
        }
      }
    }

    // Also check main_species images if available.
    $mainSpecies = $plantData['main_species'] ?? [];
    $mainSpeciesImages = $mainSpecies['images'] ?? [];
    foreach (self::IMAGE_TYPES as $type) {
      if (!empty($mainSpeciesImages[$type])) {
        $typeImages = is_array($mainSpeciesImages[$type]) ? $mainSpeciesImages[$type] : [$mainSpeciesImages[$type]];
        foreach ($typeImages as $image) {
          $url = is_array($image) ? ($image['image_url'] ?? $image['url'] ?? NULL) : $image;
          if ($url && !$this->urlExists($images, $url)) {
            $images[] = [
              'url' => $url,
              'type' => $type,
            ];
          }
        }
      }
    }

    // Check for default image if no other images found.
    if (empty($images) && !empty($plantData['image_url'])) {
      $images[] = [
        'url' => $plantData['image_url'],
        'type' => 'default',
      ];
    }

    return array_slice($images, 0, self::MAX_IMAGES);
  }

  /**
   * Check if a URL already exists in the images array.
   *
   * @param array $images
   *   The existing images array.
   * @param string $url
   *   The URL to check.
   *
   * @return bool
   *   TRUE if URL exists, FALSE otherwise.
   */
  protected function urlExists(array $images, string $url): bool {
    foreach ($images as $image) {
      if ($image['url'] === $url) {
        return TRUE;
      }
    }
    return FALSE;
  }

  /**
   * Allowed image file extensions.
   */
  protected const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  /**
   * Allowed image hosts (empty means allow trefle.io and common CDNs).
   */
  protected const ALLOWED_HOSTS = [
    'trefle.io',
    'bs.plantnet.org',
    'upload.wikimedia.org',
    'commons.wikimedia.org',
    'inaturalist-open-data.s3.amazonaws.com',
  ];

  /**
   * Download an image and create a file entity.
   *
   * @param string $url
   *   The image URL.
   * @param int $trefleId
   *   The Trefle plant ID.
   * @param string $type
   *   The image type.
   *
   * @return \Drupal\file\FileInterface|null
   *   The file entity or NULL on failure.
   */
  protected function downloadImage(string $url, int $trefleId, string $type): ?\Drupal\file\FileInterface {
    try {
      // Validate URL format and protocol (SSRF protection).
      if (!$this->isValidImageUrl($url)) {
        $this->logger->warning('Invalid or blocked image URL: @url', ['@url' => $url]);
        return NULL;
      }

      // Get the file extension from URL and validate.
      $pathInfo = pathinfo(parse_url($url, PHP_URL_PATH) ?: '');
      $extension = strtolower($pathInfo['extension'] ?? 'jpg');

      // Validate extension against allowlist.
      if (!in_array($extension, self::ALLOWED_EXTENSIONS, TRUE)) {
        $extension = 'jpg'; // Default to safe extension.
      }

      // Create a unique filename.
      $filename = sprintf('trefle_%d_%s_%s.%s',
        $trefleId,
        $type,
        substr(md5($url), 0, 8),
        $extension
      );
      $destination = self::IMAGE_DIRECTORY . '/' . $filename;

      // Check if file already exists.
      $existingFiles = $this->entityTypeManager->getStorage('file')
        ->loadByProperties(['uri' => $destination]);

      if (!empty($existingFiles)) {
        return reset($existingFiles);
      }

      // Download the image.
      $response = $this->httpClient->get($url, [
        'timeout' => 30,
        'headers' => [
          'User-Agent' => 'Drupal Trefle Sync Module',
        ],
      ]);

      $imageData = $response->getBody()->getContents();

      // Validate that it's actually an image.
      $finfo = new \finfo(FILEINFO_MIME_TYPE);
      $mimeType = $finfo->buffer($imageData);
      if (!str_starts_with($mimeType, 'image/')) {
        $this->logger->warning('Downloaded file is not an image: @url (@mime)', [
          '@url' => $url,
          '@mime' => $mimeType,
        ]);
        return NULL;
      }

      // Save the file.
      $file = $this->fileRepository->writeData($imageData, $destination, FileSystemInterface::EXISTS_REPLACE);

      if ($file) {
        $file->setPermanent();
        $file->save();
        $this->logger->info('Downloaded image from @url', ['@url' => $url]);
        return $file;
      }
    }
    catch (GuzzleException $e) {
      $this->logger->warning('Failed to download image from @url: @message', [
        '@url' => $url,
        '@message' => $e->getMessage(),
      ]);
    }
    catch (\Exception $e) {
      $this->logger->error('Error processing image from @url: @message', [
        '@url' => $url,
        '@message' => $e->getMessage(),
      ]);
    }

    return NULL;
  }

  /**
   * Prepare the image directory.
   *
   * @return bool
   *   TRUE if directory is ready, FALSE otherwise.
   */
  protected function prepareDirectory(): bool {
    $directory = self::IMAGE_DIRECTORY;

    if (!$this->fileSystem->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS)) {
      $this->logger->error('Failed to create image directory: @dir', ['@dir' => $directory]);
      return FALSE;
    }

    return TRUE;
  }

  /**
   * Build alt text for an image.
   *
   * @param array $plantData
   *   The plant data.
   * @param string $type
   *   The image type.
   *
   * @return string
   *   The alt text.
   */
  protected function buildAltText(array $plantData, string $type): string {
    $name = $plantData['common_name'] ?? $plantData['scientific_name'] ?? 'Plant';
    return sprintf('%s %s', ucfirst($type), strtolower($name));
  }

  /**
   * Build title text for an image.
   *
   * @param array $plantData
   *   The plant data.
   * @param string $type
   *   The image type.
   *
   * @return string
   *   The title text.
   */
  protected function buildTitleText(array $plantData, string $type): string {
    $name = $plantData['common_name'] ?? $plantData['scientific_name'] ?? 'Plant';
    $scientific = $plantData['scientific_name'] ?? '';

    if ($scientific && $scientific !== $name) {
      return sprintf('%s of %s (%s)', ucfirst($type), $name, $scientific);
    }

    return sprintf('%s of %s', ucfirst($type), $name);
  }

  /**
   * Validate image URL for security (SSRF protection).
   *
   * @param string $url
   *   The URL to validate.
   *
   * @return bool
   *   TRUE if URL is safe to fetch, FALSE otherwise.
   */
  protected function isValidImageUrl(string $url): bool {
    // Must be a valid URL.
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
      return FALSE;
    }

    // Parse URL components.
    $parsed = parse_url($url);
    if (!$parsed || empty($parsed['host'])) {
      return FALSE;
    }

    // Must be HTTP or HTTPS.
    $scheme = strtolower($parsed['scheme'] ?? '');
    if (!in_array($scheme, ['http', 'https'], TRUE)) {
      return FALSE;
    }

    $host = strtolower($parsed['host']);

    // Block localhost and loopback addresses.
    if (in_array($host, ['localhost', '127.0.0.1', '::1'], TRUE)) {
      return FALSE;
    }

    // Block private IP ranges.
    $ip = gethostbyname($host);
    if ($ip !== $host) {
      // Successfully resolved to IP.
      if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === FALSE) {
        return FALSE;
      }
    }

    // Block cloud metadata endpoints.
    if (str_contains($host, '169.254') || str_contains($host, 'metadata')) {
      return FALSE;
    }

    // If we have an allowlist, check against it.
    if (!empty(self::ALLOWED_HOSTS)) {
      $hostAllowed = FALSE;
      foreach (self::ALLOWED_HOSTS as $allowedHost) {
        if ($host === $allowedHost || str_ends_with($host, '.' . $allowedHost)) {
          $hostAllowed = TRUE;
          break;
        }
      }
      if (!$hostAllowed) {
        $this->logger->notice('Image host not in allowlist: @host', ['@host' => $host]);
        // Allow but log - could return FALSE for stricter security.
      }
    }

    return TRUE;
  }

}
