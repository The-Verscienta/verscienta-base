<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Flysystem;

use Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface;
use League\Flysystem\Config;
use League\Flysystem\FileAttributes;
use League\Flysystem\FilesystemAdapter;
use League\Flysystem\UnableToReadFile;
use League\Flysystem\UnableToWriteFile;
use League\Flysystem\UnableToDeleteFile;
use League\Flysystem\UnableToRetrieveMetadata;
use League\Flysystem\UnableToCheckFileExistence;
use Psr\Log\LoggerInterface;

/**
 * Flysystem adapter for Cloudflare Images API.
 */
class CloudflareAdapter implements FilesystemAdapter {

  /**
   * Constructs a new CloudflareAdapter.
   *
   * @param \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient
   *   The Cloudflare API client service.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger service.
   */
  public function __construct(
    protected CloudflareApiClientInterface $apiClient,
    protected LoggerInterface $logger,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function fileExists(string $path): bool {
    try {
      $this->apiClient->getImageMetadata($path);
      return TRUE;
    }
    catch (\Exception $e) {
      $this->logger->debug('File existence check failed for @path: @message', [
        '@path' => $path,
        '@message' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function directoryExists(string $path): bool {
    return TRUE;
  }

  /**
   * {@inheritdoc}
   */
  public function write(string $path, string $contents, Config $config): void {
    try {
      $metadata = $this->apiClient->uploadImage($contents, $path);
      $this->logger->info('Successfully uploaded image to Cloudflare: @path', [
        '@path' => $path,
      ]);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to upload image to Cloudflare: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw UnableToWriteFile::atLocation($path, $e->getMessage(), $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function writeStream(string $path, $contents, Config $config): void {
    $stringContents = stream_get_contents($contents);
    if ($stringContents === FALSE) {
      throw UnableToWriteFile::atLocation($path, 'Unable to read from stream');
    }
    $this->write($path, $stringContents, $config);
  }

  /**
   * {@inheritdoc}
   */
  public function read(string $path): string {
    try {
      return $this->apiClient->downloadImage($path);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to read image from Cloudflare: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw UnableToReadFile::fromLocation($path, $e->getMessage(), $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function readStream(string $path) {
    $content = $this->read($path);
    $stream = fopen('php://temp', 'r+');
    if ($stream === FALSE) {
      throw UnableToReadFile::fromLocation($path, 'Unable to create temporary stream');
    }
    fwrite($stream, $content);
    rewind($stream);
    return $stream;
  }

  /**
   * {@inheritdoc}
   */
  public function delete(string $path): void {
    try {
      $this->apiClient->deleteImage($path);
      $this->logger->info('Successfully deleted image from Cloudflare: @path', [
        '@path' => $path,
      ]);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to delete image from Cloudflare: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw UnableToDeleteFile::atLocation($path, $e->getMessage(), $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function deleteDirectory(string $path): void {
    return;
  }

  /**
   * {@inheritdoc}
   */
  public function createDirectory(string $path, Config $config): void {
    return;
  }

  /**
   * {@inheritdoc}
   */
  public function setVisibility(string $path, string $visibility): void {
    return;
  }

  /**
   * {@inheritdoc}
   */
  public function visibility(string $path): FileAttributes {
    return new FileAttributes($path, null, 'public');
  }

  /**
   * {@inheritdoc}
   */
  public function mimeType(string $path): FileAttributes {
    try {
      $metadata = $this->apiClient->getImageMetadata($path);
      $mimeType = $metadata['mime_type'] ?? 'application/octet-stream';
      return new FileAttributes($path, null, null, null, $mimeType);
    }
    catch (\Exception $e) {
      throw UnableToRetrieveMetadata::mimeType($path, $e->getMessage(), $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function lastModified(string $path): FileAttributes {
    try {
      $metadata = $this->apiClient->getImageMetadata($path);
      $timestamp = strtotime($metadata['uploaded'] ?? 'now');
      return new FileAttributes($path, null, null, $timestamp);
    }
    catch (\Exception $e) {
      throw UnableToRetrieveMetadata::lastModified($path, $e->getMessage(), $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function fileSize(string $path): FileAttributes {
    try {
      $metadata = $this->apiClient->getImageMetadata($path);
      $size = $metadata['size'] ?? 0;
      return new FileAttributes($path, $size);
    }
    catch (\Exception $e) {
      throw UnableToRetrieveMetadata::fileSize($path, $e->getMessage(), $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function listContents(string $path, bool $deep): iterable {
    try {
      $images = $this->apiClient->listImages();
      foreach ($images as $image) {
        yield new FileAttributes(
          $image['id'],
          $image['size'] ?? null,
          'public',
          strtotime($image['uploaded'] ?? 'now')
        );
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to list images from Cloudflare: @message', [
        '@message' => $e->getMessage(),
      ]);
      return [];
    }
  }

  /**
   * {@inheritdoc}
   */
  public function move(string $source, string $destination, Config $config): void {
    throw new \LogicException('Move operation is not supported by Cloudflare Images');
  }

  /**
   * {@inheritdoc}
   */
  public function copy(string $source, string $destination, Config $config): void {
    throw new \LogicException('Copy operation is not supported by Cloudflare Images');
  }

  /**
   * Gets the public URL for a Cloudflare image.
   *
   * @param string $path
   *   The image path/ID.
   *
   * @return string
   *   The public URL.
   */
  public function getUrl(string $path): string {
    return $this->apiClient->getImageUrl($path);
  }

  /**
   * Gets a variant URL for a Cloudflare image.
   *
   * @param string $path
   *   The image path/ID.
   * @param string $variant
   *   The variant name or transformation parameters.
   *
   * @return string
   *   The variant URL.
   */
  public function getVariantUrl(string $path, string $variant): string {
    return $this->apiClient->getImageVariantUrl($path, $variant);
  }

}