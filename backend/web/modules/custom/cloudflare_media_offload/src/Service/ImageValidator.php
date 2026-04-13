<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\file\FileInterface;

/**
 * Image validation service for Cloudflare uploads.
 */
class ImageValidator implements ImageValidatorInterface {

  use StringTranslationTrait;

  // Error codes
  const ERROR_FILE_NOT_READABLE = 'file_not_readable';
  const ERROR_FORMAT_NOT_SUPPORTED = 'format_not_supported';
  const ERROR_FILE_TOO_LARGE = 'file_too_large';
  const ERROR_MIME_TYPE_MISMATCH = 'mime_type_mismatch';
  const ERROR_CORRUPTED_IMAGE = 'corrupted_image';
  const ERROR_DIMENSIONS_INVALID = 'dimensions_invalid';

  /**
   * Constructs a new ImageValidator.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   */
  public function __construct(
    protected ConfigFactoryInterface $configFactory,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function validateImage(FileInterface $file): array {
    $errors = [];

    // Check if file is readable
    $file_uri = $file->getFileUri();
    if (!file_exists($file_uri) || !is_readable($file_uri)) {
      $errors[] = self::ERROR_FILE_NOT_READABLE;
      return ['valid' => FALSE, 'errors' => $errors];
    }

    // Get file information
    $mime_type = $file->getMimeType();
    $extension = strtolower(pathinfo($file->getFilename(), PATHINFO_EXTENSION));
    $file_size = $file->getSize();

    // Validate format
    if (!$this->isSupportedFormat($mime_type, $extension)) {
      $errors[] = self::ERROR_FORMAT_NOT_SUPPORTED;
    }

    // Validate MIME type matches extension
    if (!$this->validateMimeTypeMatch($mime_type, $extension)) {
      $errors[] = self::ERROR_MIME_TYPE_MISMATCH;
    }

    // Validate file size
    $max_size = $this->getMaxFileSize();
    if ($file_size > $max_size) {
      $errors[] = self::ERROR_FILE_TOO_LARGE;
    }

    // Validate image integrity using getimagesize
    $image_info = @getimagesize($file_uri);
    if ($image_info === FALSE) {
      $errors[] = self::ERROR_CORRUPTED_IMAGE;
    }
    elseif ($image_info[0] <= 0 || $image_info[1] <= 0) {
      $errors[] = self::ERROR_DIMENSIONS_INVALID;
    }

    return [
      'valid' => empty($errors),
      'errors' => $errors,
      'info' => $image_info !== FALSE ? [
        'width' => $image_info[0],
        'height' => $image_info[1],
        'mime' => $image_info['mime'],
      ] : NULL,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getErrorMessages(array $errors): array {
    $messages = [];
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $max_size = $config->get('upload_limits.max_file_size') ?? 10;

    foreach ($errors as $error) {
      switch ($error) {
        case self::ERROR_FILE_NOT_READABLE:
          $messages[] = $this->t('The file could not be read from the file system.');
          break;

        case self::ERROR_FORMAT_NOT_SUPPORTED:
          $messages[] = $this->t('The image format is not supported. Supported formats: @formats', [
            '@formats' => implode(', ', $this->getSupportedFormatsList()),
          ]);
          break;

        case self::ERROR_FILE_TOO_LARGE:
          $messages[] = $this->t('The file size exceeds the maximum allowed size of @max MB.', [
            '@max' => $max_size,
          ]);
          break;

        case self::ERROR_MIME_TYPE_MISMATCH:
          $messages[] = $this->t('The file extension does not match the file content. The file may be corrupted or renamed incorrectly.');
          break;

        case self::ERROR_CORRUPTED_IMAGE:
          $messages[] = $this->t('The image file appears to be corrupted or is not a valid image.');
          break;

        case self::ERROR_DIMENSIONS_INVALID:
          $messages[] = $this->t('The image dimensions are invalid (width or height is 0).');
          break;

        default:
          $messages[] = $this->t('An unknown validation error occurred.');
      }
    }

    return $messages;
  }

  /**
   * {@inheritdoc}
   */
  public function isSupportedFormat(string $mimeType, string $extension): bool {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $supported_formats = $config->get('upload_limits.supported_formats') ?? [];

    $format_map = [
      'image/jpeg' => ['jpeg', 'jpg'],
      'image/png' => ['png'],
      'image/gif' => ['gif'],
      'image/webp' => ['webp'],
    ];

    // Check if MIME type is valid
    if (!isset($format_map[$mimeType])) {
      return FALSE;
    }

    // Check if extension matches MIME type
    if (!in_array($extension, $format_map[$mimeType])) {
      return FALSE;
    }

    // Check if format is enabled in config
    return in_array($extension, $supported_formats);
  }

  /**
   * {@inheritdoc}
   */
  public function getMaxFileSize(): int {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $max_size_mb = $config->get('upload_limits.max_file_size') ?? 10;
    return $max_size_mb * 1024 * 1024; // Convert MB to bytes
  }

  /**
   * {@inheritdoc}
   */
  public function getSupportedFormats(): array {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $supported_formats = $config->get('upload_limits.supported_formats') ?? [];

    $format_info = [
      'jpeg' => ['name' => 'JPEG', 'mime' => 'image/jpeg', 'extensions' => ['jpeg', 'jpg']],
      'jpg' => ['name' => 'JPG', 'mime' => 'image/jpeg', 'extensions' => ['jpg']],
      'png' => ['name' => 'PNG', 'mime' => 'image/png', 'extensions' => ['png']],
      'gif' => ['name' => 'GIF', 'mime' => 'image/gif', 'extensions' => ['gif']],
      'webp' => ['name' => 'WebP', 'mime' => 'image/webp', 'extensions' => ['webp']],
    ];

    $result = [];
    foreach ($supported_formats as $format) {
      if (isset($format_info[$format])) {
        $result[$format] = $format_info[$format];
      }
    }

    return $result;
  }

  /**
   * Get a simple list of supported format names.
   *
   * @return array
   *   Array of format names.
   */
  protected function getSupportedFormatsList(): array {
    $formats = $this->getSupportedFormats();
    return array_column($formats, 'name');
  }

  /**
   * Validate that MIME type matches file extension.
   *
   * @param string $mimeType
   *   The MIME type.
   * @param string $extension
   *   The file extension.
   *
   * @return bool
   *   TRUE if they match.
   */
  protected function validateMimeTypeMatch(string $mimeType, string $extension): bool {
    $mime_map = [
      'jpeg' => 'image/jpeg',
      'jpg' => 'image/jpeg',
      'png' => 'image/png',
      'gif' => 'image/gif',
      'webp' => 'image/webp',
    ];

    return isset($mime_map[$extension]) && $mime_map[$extension] === $mimeType;
  }

}