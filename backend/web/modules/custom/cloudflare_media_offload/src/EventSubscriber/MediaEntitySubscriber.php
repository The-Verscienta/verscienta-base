<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\EventSubscriber;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Queue\QueueFactory;
use Drupal\media\MediaInterface;
use Drupal\file\FileInterface;
use Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Event subscriber for media entity operations.
 */
class MediaEntitySubscriber implements EventSubscriberInterface {

  /**
   * Constructs a new MediaEntitySubscriber.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient
   *   The Cloudflare API client.
   * @param \Drupal\Core\Queue\QueueFactory $queueFactory
   *   The queue factory.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   * @param \Drupal\cloudflare_media_offload\Service\ImageValidatorInterface $imageValidator
   *   The image validator.
   */
  public function __construct(
    protected ConfigFactoryInterface $configFactory,
    protected CloudflareApiClientInterface $apiClient,
    protected QueueFactory $queueFactory,
    protected LoggerInterface $logger,
    protected \Drupal\cloudflare_media_offload\Service\ImageValidatorInterface $imageValidator,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    return [];
  }

  /**
   * Handle media entity presave.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity.
   */
  public function onMediaPresave(MediaInterface $media): void {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $enabled_bundles = $config->get('enabled_bundles') ?? [];
    
    if (!in_array($media->bundle(), $enabled_bundles)) {
      return;
    }

    $source_field = $media->getSource()->getConfiguration()['source_field'];
    
    if (!$media->hasField($source_field) || $media->get($source_field)->isEmpty()) {
      return;
    }

    /** @var \Drupal\file\FileInterface $file */
    $file = $media->get($source_field)->entity;
    
    if (!$file instanceof FileInterface) {
      return;
    }

    $file_uri = $file->getFileUri();
    
    if (str_starts_with($file_uri, 'cloudflare://')) {
      return;
    }

    // Validate the image file
    $validation = $this->imageValidator->validateImage($file);
    if (!$validation['valid']) {
      $error_messages = $this->imageValidator->getErrorMessages($validation['errors']);
      $this->logger->warning('Image validation failed for media @id: @errors', [
        '@id' => $media->id(),
        '@errors' => implode(', ', $error_messages),
      ]);

      // Don't upload invalid images
      return;
    }

    try {
      $this->uploadToCloudflare($file, $media);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to upload media @id to Cloudflare: @message', [
        '@id' => $media->id(),
        '@message' => $e->getMessage(),
      ]);

      if ($config->get('fallback_to_local')) {
        $this->queueForLaterUpload($file, $media);
      }
      else {
        throw $e;
      }
    }
  }

  /**
   * Upload file to Cloudflare.
   *
   * @param \Drupal\file\FileInterface $file
   *   The file to upload.
   * @param \Drupal\media\MediaInterface $media
   *   The media entity.
   *
   * @throws \Exception
   *   When upload fails.
   */
  protected function uploadToCloudflare(FileInterface $file, MediaInterface $media): void {
    $file_contents = file_get_contents($file->getFileUri());
    
    if ($file_contents === FALSE) {
      throw new \Exception('Unable to read file contents');
    }

    $cloudflare_id = $this->generateCloudflareId($file, $media);
    
    $metadata = [
      'drupal_fid' => $file->id(),
      'drupal_media_id' => $media->id(),
      'original_filename' => $file->getFilename(),
    ];

    $result = $this->apiClient->uploadImage($file_contents, $cloudflare_id, $metadata);
    
    $file->setFileUri('cloudflare://' . $result['id']);
    $file->save();

    $this->logger->info('Successfully uploaded file @fid to Cloudflare as @id', [
      '@fid' => $file->id(),
      '@id' => $result['id'],
    ]);
  }

  /**
   * Queue file for later upload.
   *
   * @param \Drupal\file\FileInterface $file
   *   The file to queue.
   * @param \Drupal\media\MediaInterface $media
   *   The media entity.
   */
  protected function queueForLaterUpload(FileInterface $file, MediaInterface $media): void {
    $queue = $this->queueFactory->get('cloudflare_media_offload_queue');
    
    $queue->createItem([
      'file_id' => $file->id(),
      'media_id' => $media->id(),
      'operation' => 'upload',
      'retry_count' => 0,
    ]);

    $this->logger->info('Queued file @fid for later upload to Cloudflare', [
      '@fid' => $file->id(),
    ]);
  }

  /**
   * Generate a Cloudflare ID for the file.
   *
   * @param \Drupal\file\FileInterface $file
   *   The file.
   * @param \Drupal\media\MediaInterface $media
   *   The media entity.
   *
   * @return string
   *   The Cloudflare ID.
   */
  protected function generateCloudflareId(FileInterface $file, MediaInterface $media): string {
    $base = $media->uuid() . '_' . $file->getFilename();
    return preg_replace('/[^a-zA-Z0-9_-]/', '_', $base);
  }


}