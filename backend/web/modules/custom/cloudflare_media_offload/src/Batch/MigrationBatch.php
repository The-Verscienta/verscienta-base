<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Batch;

use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * Batch operations for Cloudflare media migration.
 */
class MigrationBatch {

  use StringTranslationTrait;

  /**
   * Process a batch of media entities.
   *
   * @param array $entity_ids
   *   Array of media entity IDs to process.
   * @param string $bundle
   *   The media bundle.
   * @param bool $skip_errors
   *   Whether to skip errors and continue.
   * @param array $context
   *   The batch context.
   */
  public static function processBatch(array $entity_ids, string $bundle, bool $skip_errors, array &$context): void {
    $media_storage = \Drupal::entityTypeManager()->getStorage('media');
    $apiClient = \Drupal::service('cloudflare_media_offload.api_client');
    $logger = \Drupal::logger('cloudflare_media_offload');

    // Initialize results
    if (!isset($context['results']['processed'])) {
      $context['results']['processed'] = 0;
      $context['results']['success'] = 0;
      $context['results']['errors'] = 0;
      $context['results']['skipped'] = 0;
      $context['results']['error_messages'] = [];
    }

    foreach ($entity_ids as $entity_id) {
      try {
        $media = $media_storage->load($entity_id);

        if (!$media) {
          $context['results']['skipped']++;
          continue;
        }

        $source_field = $media->getSource()->getConfiguration()['source_field'];

        if (!$media->hasField($source_field) || $media->get($source_field)->isEmpty()) {
          $context['results']['skipped']++;
          continue;
        }

        $file = $media->get($source_field)->entity;

        if (!$file) {
          $context['results']['skipped']++;
          continue;
        }

        $file_uri = $file->getFileUri();

        // Skip if already on Cloudflare
        if (str_starts_with($file_uri, 'cloudflare://')) {
          $context['results']['skipped']++;
          continue;
        }

        // Read file contents
        $file_contents = file_get_contents($file_uri);

        if ($file_contents === FALSE) {
          throw new \Exception('Unable to read file contents');
        }

        // Generate Cloudflare ID
        $cloudflare_id = $media->uuid() . '_' . $file->getFilename();
        $cloudflare_id = preg_replace('/[^a-zA-Z0-9_-]/', '_', $cloudflare_id);

        // Prepare metadata
        $metadata = [
          'drupal_fid' => $file->id(),
          'drupal_media_id' => $media->id(),
          'original_filename' => $file->getFilename(),
          'bundle' => $bundle,
        ];

        // Upload to Cloudflare
        $result = $apiClient->uploadImage($file_contents, $cloudflare_id, $metadata);

        // Update file URI
        $file->setFileUri('cloudflare://' . $result['id']);
        $file->save();

        $context['results']['success']++;

        $logger->info('Successfully migrated media @id (@label) to Cloudflare', [
          '@id' => $media->id(),
          '@label' => $media->label(),
        ]);
      }
      catch (\Exception $e) {
        $context['results']['errors']++;

        $error_message = t('Failed to migrate media @id: @error', [
          '@id' => $entity_id,
          '@error' => $e->getMessage(),
        ]);

        $context['results']['error_messages'][] = $error_message;

        $logger->error('Migration error for media @id: @message', [
          '@id' => $entity_id,
          '@message' => $e->getMessage(),
        ]);

        if (!$skip_errors) {
          $context['results']['error'] = $error_message;
          return;
        }
      }

      $context['results']['processed']++;
    }

    // Update progress message
    $context['message'] = t('Processed @processed items. @success successful, @errors errors, @skipped skipped.', [
      '@processed' => $context['results']['processed'],
      '@success' => $context['results']['success'],
      '@errors' => $context['results']['errors'],
      '@skipped' => $context['results']['skipped'],
    ]);
  }

  /**
   * Batch finished callback.
   *
   * @param bool $success
   *   Whether the batch completed successfully.
   * @param array $results
   *   The results array.
   * @param array $operations
   *   The operations that were processed.
   */
  public static function finishBatch(bool $success, array $results, array $operations): void {
    $messenger = \Drupal::messenger();

    if ($success) {
      $message = t('Migration completed successfully!');
      $message .= '<br/>' . t('Processed: @processed', ['@processed' => $results['processed']]);
      $message .= '<br/>' . t('Successful: @success', ['@success' => $results['success']]);
      $message .= '<br/>' . t('Errors: @errors', ['@errors' => $results['errors']]);
      $message .= '<br/>' . t('Skipped: @skipped', ['@skipped' => $results['skipped']]);

      $messenger->addStatus($message);

      if (!empty($results['error_messages'])) {
        $messenger->addWarning(t('Some items failed to migrate:'));
        foreach ($results['error_messages'] as $error) {
          $messenger->addWarning($error);
        }
      }
    }
    else {
      $messenger->addError(t('Migration failed with errors.'));

      if (isset($results['error'])) {
        $messenger->addError($results['error']);
      }
    }
  }

}