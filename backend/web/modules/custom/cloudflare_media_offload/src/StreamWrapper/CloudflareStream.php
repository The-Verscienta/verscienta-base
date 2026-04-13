<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\StreamWrapper;

use Drupal\Core\StreamWrapper\StreamWrapperInterface;

/**
 * Cloudflare stream wrapper implementation.
 *
 * Implements StreamWrapperInterface to provide a cloudflare:// streamwrapper
 * for Cloudflare Images. This stream wrapper allows Drupal to treat Cloudflare
 * as a remote file system.
 *
 * Note: This is a read-only stream wrapper. Write operations are not supported
 * as Cloudflare Images uses an API-based upload system.
 */
class CloudflareStream implements StreamWrapperInterface {

  /**
   * Instance URI (stream).
   */
  protected $uri;

  /**
   * A generic resource handle.
   */
  public $handle = NULL;

  /**
   * {@inheritdoc}
   */
  public function getName(): string {
    return 'Cloudflare Images';
  }

  /**
   * {@inheritdoc}
   */
  public function getDescription(): string {
    return 'Cloudflare Images remote storage.';
  }

  /**
   * {@inheritdoc}
   */
  public static function getType(): int {
    return StreamWrapperInterface::READ_VISIBLE;
  }

  /**
   * {@inheritdoc}
   */
  public function getExternalUrl(): string {
    $image_id = $this->getImageId();
    if (!$image_id) {
      return '';
    }

    try {
      /** @var \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient */
      $apiClient = \Drupal::service('cloudflare_media_offload.api_client');
      return $apiClient->getImageUrl($image_id);
    }
    catch (\Exception $e) {
      \Drupal::logger('cloudflare_media_offload')->error('Failed to get external URL for @uri: @message', [
        '@uri' => $this->uri,
        '@message' => $e->getMessage(),
      ]);
      return '';
    }
  }

  /**
   * {@inheritdoc}
   */
  public function setUri($uri): void {
    $this->uri = $uri;
  }

  /**
   * {@inheritdoc}
   */
  public function getUri(): string {
    return $this->uri;
  }

  /**
   * {@inheritdoc}
   */
  public function realpath(): string|bool {
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function dirname($uri = NULL): string {
    if (!isset($uri)) {
      $uri = $this->uri;
    }
    
    list($scheme) = explode('://', $uri, 2);
    return $scheme . '://';
  }

  /**
   * Extract the image ID from the stream URI.
   *
   * @return string|null
   *   The image ID, or NULL if invalid.
   */
  protected function getImageId(): ?string {
    if (!$this->uri) {
      return NULL;
    }

    $parts = explode('://', $this->uri, 2);
    if (count($parts) !== 2) {
      return NULL;
    }

    $path = $parts[1];
    
    // Handle image style paths like: styles/uncropped_960w_webp/cloudflare/actual-image-id.webp
    // We need to extract just the actual-image-id.webp part
    if (strpos($path, 'styles/') === 0) {
      // Split by / and get the last part (the actual image ID)
      $path_parts = explode('/', $path);
      if (count($path_parts) >= 4) {
        // Path structure: styles/STYLE_NAME/cloudflare/IMAGE_ID
        $image_id = end($path_parts);
        return $image_id ?: NULL;
      }
    }
    
    // For direct cloudflare:// URLs, just return the path as is
    return $path ?: NULL;
  }

  /**
   * {@inheritdoc}
   */
  public function stream_open($uri, $mode, $options, &$opened_path): bool {
    $this->setUri($uri);

    // Only support read operations - reject write, append, and create modes
    if (strpbrk($mode, 'wxa+')) {
      if ($options & STREAM_REPORT_ERRORS) {
        trigger_error('cloudflare:// stream wrapper is read-only. Use CloudflareApiClient::uploadImage() to upload images.', E_USER_WARNING);
      }
      return FALSE;
    }

    try {
      $image_id = $this->getImageId();
      if (!$image_id) {
        return FALSE;
      }

      /** @var \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient */
      $apiClient = \Drupal::service('cloudflare_media_offload.api_client');
      $data = $apiClient->downloadImage($image_id);
      
      $this->handle = fopen('php://memory', 'r+');
      fwrite($this->handle, $data);
      rewind($this->handle);
      
      return TRUE;
    }
    catch (\Exception $e) {
      \Drupal::logger('cloudflare_media_offload')->error('Failed to open stream for @uri: @message', [
        '@uri' => $uri,
        '@message' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function stream_close(): void {
    if ($this->handle) {
      fclose($this->handle);
      $this->handle = NULL;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function stream_read($count): string|false {
    if (!$this->handle) {
      return FALSE;
    }
    return fread($this->handle, $count);
  }

  /**
   * {@inheritdoc}
   */
  public function stream_eof(): bool {
    if (!$this->handle) {
      return TRUE;
    }
    return feof($this->handle);
  }

  /**
   * {@inheritdoc}
   */
  public function stream_tell(): int|false {
    if (!$this->handle) {
      return FALSE;
    }
    return ftell($this->handle);
  }

  /**
   * {@inheritdoc}
   */
  public function stream_seek($offset, $whence = SEEK_SET): bool {
    if (!$this->handle) {
      return FALSE;
    }
    return fseek($this->handle, $offset, $whence) === 0;
  }

  /**
   * {@inheritdoc}
   */
  public function url_stat($uri, $flags): array|false {
    $this->setUri($uri);
    
    try {
      $image_id = $this->getImageId();
      if (!$image_id) {
        return FALSE;
      }

      /** @var \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient */
      $apiClient = \Drupal::service('cloudflare_media_offload.api_client');
      
      // Try to get metadata, but don't fail if we can't
      $metadata = [];
      try {
        $metadata = $apiClient->getImageMetadata($image_id);
      }
      catch (\Exception $e) {
        \Drupal::logger('cloudflare_media_offload')->debug('Could not get metadata for @id: @message', [
          '@id' => $image_id,
          '@message' => $e->getMessage(),
        ]);
        // Continue with default stat values
      }
      
      // Create a stat array compatible with PHP's stat()
      // Use current time if we don't have metadata
      $current_time = time();
      $size = $metadata['size'] ?? 1024;
      $mtime = isset($metadata['uploaded']) ? strtotime($metadata['uploaded']) : $current_time;
      $stat = [
        0 => 0, 'dev' => 0,
        1 => 0, 'ino' => 0,
        2 => 0100644, 'mode' => 0100644,
        3 => 0, 'nlink' => 0,
        4 => 0, 'uid' => 0,
        5 => 0, 'gid' => 0,
        6 => 0, 'rdev' => 0,
        7 => $size, 'size' => $size,
        8 => $mtime, 'atime' => $mtime,
        9 => $mtime, 'mtime' => $mtime,
        10 => $mtime, 'ctime' => $mtime,
        11 => -1, 'blksize' => -1,
        12 => -1, 'blocks' => -1,
      ];

      return $stat;
    }
    catch (\Exception $e) {
      \Drupal::logger('cloudflare_media_offload')->warning('Failed to stat @uri: @message', [
        '@uri' => $uri,
        '@message' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   *
   * Write operations are not supported on Cloudflare streams.
   * Use the CloudflareApiClient service to upload images instead.
   */
  public function stream_write($data): int {
    trigger_error('stream_write() is not supported on cloudflare:// streams. Use CloudflareApiClient::uploadImage() instead.', E_USER_WARNING);
    return 0;
  }

  /**
   * {@inheritdoc}
   *
   * Flush operations are not supported on read-only streams.
   */
  public function stream_flush(): bool {
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function stream_stat(): array|false {
    return $this->url_stat($this->uri, 0);
  }

  /**
   * {@inheritdoc}
   */
  public function unlink($path): bool {
    // Cannot delete remote files
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function rename($path_from, $path_to): bool {
    // Cannot rename remote files
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function mkdir($path, $mode, $options): bool {
    // No directory structure in Cloudflare
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function rmdir($path, $options): bool {
    // No directory structure in Cloudflare
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function dir_opendir($path, $options): bool {
    // No directory listing supported
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function dir_readdir(): string|false {
    // No directory listing supported
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function dir_rewinddir(): bool {
    // No directory listing supported
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function dir_closedir(): bool {
    // No directory listing supported
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function stream_lock($operation): bool {
    // No locking support for remote files
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function stream_metadata($path, $option, $value): bool {
    // Cannot modify metadata of remote files
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function stream_set_option($option, $arg1, $arg2): bool {
    // No stream options supported
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function stream_truncate($new_size): bool {
    // Cannot truncate remote files
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function stream_cast($cast_as) {
    // Cannot cast remote streams to local resources
    return FALSE;
  }

}