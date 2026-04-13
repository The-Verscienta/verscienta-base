<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Service;

use Drupal\file\FileInterface;

/**
 * Interface for image validation service.
 */
interface ImageValidatorInterface {

  /**
   * Validate an image file for Cloudflare upload.
   *
   * @param \Drupal\file\FileInterface $file
   *   The file to validate.
   *
   * @return array
   *   Array of validation results with 'valid' boolean and 'errors' array.
   */
  public function validateImage(FileInterface $file): array;

  /**
   * Get human-readable error messages for validation errors.
   *
   * @param array $errors
   *   Array of error codes.
   *
   * @return array
   *   Array of translated error messages.
   */
  public function getErrorMessages(array $errors): array;

  /**
   * Check if a file format is supported.
   *
   * @param string $mimeType
   *   The MIME type to check.
   * @param string $extension
   *   The file extension to check.
   *
   * @return bool
   *   TRUE if the format is supported.
   */
  public function isSupportedFormat(string $mimeType, string $extension): bool;

  /**
   * Get maximum allowed file size in bytes.
   *
   * @return int
   *   The maximum file size in bytes.
   */
  public function getMaxFileSize(): int;

  /**
   * Get list of supported formats.
   *
   * @return array
   *   Array of supported format information.
   */
  public function getSupportedFormats(): array;

}