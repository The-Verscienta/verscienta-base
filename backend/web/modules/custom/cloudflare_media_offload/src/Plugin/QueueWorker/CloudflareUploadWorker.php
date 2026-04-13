<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Plugin\QueueWorker;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Queue\QueueWorkerBase;
use Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Queue worker for Cloudflare uploads.
 *
 * @QueueWorker(
 *   id = "cloudflare_media_offload_queue",
 *   title = @Translation("Cloudflare Media Upload Queue"),
 *   cron = {"time" = 60}
 * )
 */
class CloudflareUploadWorker extends QueueWorkerBase implements ContainerFactoryPluginInterface {

  /**
   * Constructs a new CloudflareUploadWorker.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient
   *   The Cloudflare API client.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected CloudflareApiClientInterface $apiClient,
    protected LoggerInterface $logger,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): self {
    return new self(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('entity_type.manager'),
      $container->get('cloudflare_media_offload.api_client'),
      $container->get('logger.channel.cloudflare_media_offload')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function processItem($data): void {
    if (!isset($data['file_id']) || !isset($data['media_id']) || !isset($data['operation'])) {
      throw new \InvalidArgumentException('Invalid queue item data');
    }

    $file_storage = $this->entityTypeManager->getStorage('file');
    $media_storage = $this->entityTypeManager->getStorage('media');

    $file = $file_storage->load($data['file_id']);
    $media = $media_storage->load($data['media_id']);

    if (!$file || !$media) {
      $this->logger->error('File or media entity not found for queue item: file_id=@file_id, media_id=@media_id', [
        '@file_id' => $data['file_id'],
        '@media_id' => $data['media_id'],
      ]);
      return;
    }

    switch ($data['operation']) {
      case 'upload':
        $this->processUpload($file, $media, $data);
        break;

      case 'delete':
        $this->processDelete($file, $data);
        break;

      default:
        throw new \InvalidArgumentException('Unknown operation: ' . $data['operation']);
    }
  }

  /**
   * Process file upload to Cloudflare.
   *
   * @param \Drupal\file\FileInterface $file
   *   The file entity.
   * @param \Drupal\media\MediaInterface $media
   *   The media entity.
   * @param array $data
   *   The queue item data.
   *
   * @throws \Exception
   *   When upload fails.
   */
  protected function processUpload($file, $media, array $data): void {
    $file_uri = $file->getFileUri();
    
    if (str_starts_with($file_uri, 'cloudflare://')) {
      $this->logger->info('File @fid already uploaded to Cloudflare', [
        '@fid' => $file->id(),
      ]);
      return;
    }

    $file_contents = file_get_contents($file_uri);
    
    if ($file_contents === FALSE) {
      throw new \Exception('Unable to read file contents for file ID: ' . $file->id());
    }

    $cloudflare_id = $this->generateCloudflareId($file, $media);
    
    $metadata = [
      'drupal_fid' => $file->id(),
      'drupal_media_id' => $media->id(),
      'original_filename' => $file->getFilename(),
      'retry_count' => $data['retry_count'] ?? 0,
    ];

    $result = $this->apiClient->uploadImage($file_contents, $cloudflare_id, $metadata);
    
    $file->setFileUri('cloudflare://' . $result['id']);
    $file->save();

    $this->logger->info('Successfully uploaded file @fid to Cloudflare as @id via queue', [
      '@fid' => $file->id(),
      '@id' => $result['id'],
    ]);
  }

  /**
   * Process file deletion from Cloudflare.
   *
   * @param \Drupal\file\FileInterface $file
   *   The file entity.
   * @param array $data
   *   The queue item data.
   *
   * @throws \Exception
   *   When deletion fails.
   */
  protected function processDelete($file, array $data): void {
    $file_uri = $file->getFileUri();
    
    if (!str_starts_with($file_uri, 'cloudflare://')) {
      $this->logger->warning('Attempted to delete non-Cloudflare file @fid', [
        '@fid' => $file->id(),
      ]);
      return;
    }

    $cloudflare_id = str_replace('cloudflare://', '', $file_uri);
    
    $this->apiClient->deleteImage($cloudflare_id);

    $this->logger->info('Successfully deleted file @id from Cloudflare via queue', [
      '@id' => $cloudflare_id,
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
  protected function generateCloudflareId($file, $media): string {
    $base = $media->uuid() . '_' . $file->getFilename();
    return preg_replace('/[^a-zA-Z0-9_-]/', '_', $base);
  }

}