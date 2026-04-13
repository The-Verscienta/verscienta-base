<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Commands;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Queue\QueueFactory;
use Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface;
use Drush\Commands\DrushCommands;
use Drush\Exceptions\UserAbortException;

/**
 * Drush commands for Cloudflare Media Offload.
 */
class CloudflareCommands extends DrushCommands {

  /**
   * Constructs a new CloudflareCommands.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient
   *   The Cloudflare API client.
   * @param \Drupal\Core\Queue\QueueFactory $queueFactory
   *   The queue factory.
   */
  public function __construct(
    protected ConfigFactoryInterface $configFactory,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected CloudflareApiClientInterface $apiClient,
    protected QueueFactory $queueFactory,
  ) {
    parent::__construct();
  }

  /**
   * Test connection to Cloudflare API.
   *
   * @command cloudflare:test-connection
   * @aliases cf:test
   * @usage cloudflare:test-connection
   *   Test the connection to Cloudflare Images API.
   */
  public function testConnection(): void {
    $this->output()->writeln('<comment>Testing connection to Cloudflare API...</comment>');
    $this->output()->writeln('');
    
    // First check configuration
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $apiKeyId = $config->get('api_key');
    $accountIdKeyId = $config->get('account_id');
    
    if (empty($apiKeyId) || empty($accountIdKeyId)) {
      $this->output()->writeln('<error>✗ API credentials not configured. Run `drush cf:debug` for details.</error>');
      return;
    }
    
    try {
      if ($this->apiClient->testConnection()) {
        $this->output()->writeln('<info>✓ Connection to Cloudflare API successful!</info>');
        $this->output()->writeln('<info>  Your credentials are working correctly.</info>');
      }
      else {
        $this->output()->writeln('<error>✗ Connection to Cloudflare API failed!</error>');
        $this->output()->writeln('<error>  The API returned success: false</error>');
        $this->output()->writeln('<comment>  Check the logs for more details: drush ws --tail</comment>');
      }
    }
    catch (\Exception $e) {
      $this->output()->writeln('<error>✗ Connection error: ' . $e->getMessage() . '</error>');
      $this->output()->writeln('<comment>Common issues:</comment>');
      $this->output()->writeln('  - Invalid API token (check it has Cloudflare Images permissions)');
      $this->output()->writeln('  - Incorrect Account ID (should be 32-character hex string)');
      $this->output()->writeln('  - Network connectivity issues');
      $this->output()->writeln('  - API token expired or revoked');
      $this->output()->writeln('');
      $this->output()->writeln('<comment>Run `drush cf:debug` to verify your configuration.</comment>');
    }
  }

  /**
   * Debug Cloudflare configuration.
   *
   * @command cloudflare:debug-config
   * @aliases cf:debug
   */
  public function debugConfig(): void {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    
    $this->output()->writeln('<comment>Cloudflare Media Offload Configuration Debug:</comment>');
    $this->output()->writeln('');
    
    // Check configuration values
    $apiKeyId = $config->get('api_key');
    $accountIdKeyId = $config->get('account_id');
    $accountHashKeyId = $config->get('account_hash');
    
    $this->output()->writeln("API Key ID configured: " . ($apiKeyId ? "<info>YES ($apiKeyId)</info>" : "<error>NO</error>"));
    $this->output()->writeln("Account ID Key configured: " . ($accountIdKeyId ? "<info>YES ($accountIdKeyId)</info>" : "<error>NO</error>"));
    $this->output()->writeln("Account Hash Key configured: " . ($accountHashKeyId ? "<info>YES ($accountHashKeyId)</info>" : "<comment>NO (will use Account ID)</comment>"));
    
    // Check if keys exist in Key module
    if ($apiKeyId) {
      $apiKey = \Drupal::service('key.repository')->getKey($apiKeyId);
      $this->output()->writeln("API Key exists in Key module: " . ($apiKey ? "<info>YES</info>" : "<error>NO</error>"));
      if ($apiKey) {
        $tokenValue = $apiKey->getKeyValue();
        $this->output()->writeln("API Token length: " . strlen($tokenValue ?: '') . " characters");
      }
    }
    
    if ($accountIdKeyId) {
      $accountKey = \Drupal::service('key.repository')->getKey($accountIdKeyId);
      $this->output()->writeln("Account ID Key exists in Key module: " . ($accountKey ? "<info>YES</info>" : "<error>NO</error>"));
      if ($accountKey) {
        $accountValue = $accountKey->getKeyValue();
        $this->output()->writeln("Account ID length: " . strlen($accountValue ?: '') . " characters");
        if (strlen($accountValue ?: '') > 8) {
          $this->output()->writeln("Account ID preview: " . substr($accountValue, 0, 8) . "..." . substr($accountValue, -4));
        }
      }
    }
    
    if ($accountHashKeyId) {
      $hashKey = \Drupal::service('key.repository')->getKey($accountHashKeyId);
      $this->output()->writeln("Account Hash Key exists in Key module: " . ($hashKey ? "<info>YES</info>" : "<error>NO</error>"));
      if ($hashKey) {
        $hashValue = $hashKey->getKeyValue();
        $this->output()->writeln("Account Hash length: " . strlen($hashValue ?: '') . " characters");
        $this->output()->writeln("Account Hash value: " . ($hashValue ?: 'EMPTY'));
      }
    }
    
    // Other settings
    $enabledBundles = $config->get('enabled_bundles') ?: [];
    $this->output()->writeln("Enabled bundles: " . (count($enabledBundles) ? implode(', ', $enabledBundles) : 'None'));
    
    $this->output()->writeln('');
    $this->output()->writeln('<comment>If Account ID shows 0 characters, you need to:</comment>');
    $this->output()->writeln('1. Go to /admin/config/system/keys');
    $this->output()->writeln('2. Create or edit your Cloudflare Account ID key');
    $this->output()->writeln('3. Enter your Account ID (found in Cloudflare dashboard sidebar)');
    $this->output()->writeln('4. Save and return to /admin/config/media/cloudflare-media-offload');
    $this->output()->writeln('5. Re-select your Account ID key and save');
  }

  /**
   * Migrate existing media to Cloudflare.
   *
   * @param array $options
   *   An associative array of options whose values come from cli, aliases,
   *   config, etc.
   *
   * @option bundle
   *   Specific media bundle to migrate. If not specified, all enabled bundles will be migrated.
   * @option batch-size
   *   Number of items to process in each batch (default: 50).
   * @option dry-run
   *   Show what would be migrated without actually doing it.
   *
   * @command cloudflare:migrate
   * @aliases cf:migrate
   * @usage cloudflare:migrate
   *   Migrate all enabled media bundles to Cloudflare.
   * @usage cloudflare:migrate --bundle=image
   *   Migrate only the 'image' media bundle.
   * @usage cloudflare:migrate --dry-run
   *   Show what would be migrated without actually migrating.
   */
  public function migrate(array $options = [
    'bundle' => NULL,
    'batch-size' => 50,
    'dry-run' => FALSE,
  ]): void {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $enabled_bundles = $config->get('enabled_bundles') ?? [];
    
    if (empty($enabled_bundles)) {
      $this->output()->writeln('<error>No media bundles are enabled for Cloudflare offload.</error>');
      return;
    }

    $bundles_to_migrate = $options['bundle'] 
      ? [$options['bundle']] 
      : $enabled_bundles;

    $batch_size = (int) $options['batch-size'];
    $dry_run = (bool) $options['dry-run'];

    if ($dry_run) {
      $this->output()->writeln('<comment>DRY RUN - No actual migration will be performed</comment>');
    }

    foreach ($bundles_to_migrate as $bundle) {
      if (!in_array($bundle, $enabled_bundles)) {
        $this->output()->writeln("<error>Bundle '{$bundle}' is not enabled for Cloudflare offload.</error>");
        continue;
      }

      $this->migrateBundleMedia($bundle, $batch_size, $dry_run);
    }
  }

  /**
   * Migrate media for a specific bundle.
   *
   * @param string $bundle
   *   The media bundle ID.
   * @param int $batch_size
   *   Batch size for processing.
   * @param bool $dry_run
   *   Whether this is a dry run.
   */
  protected function migrateBundleMedia(string $bundle, int $batch_size, bool $dry_run): void {
    $this->output()->writeln("Processing bundle: {$bundle}");

    $media_storage = $this->entityTypeManager->getStorage('media');
    
    $query = $media_storage->getQuery()
      ->condition('bundle', $bundle)
      ->accessCheck(FALSE);

    $total = $query->count()->execute();
    
    if ($total == 0) {
      $this->output()->writeln("<info>No media entities found for bundle '{$bundle}'.</info>");
      return;
    }

    $this->output()->writeln("Found {$total} media entities to process.");

    if ($dry_run) {
      $this->output()->writeln("<comment>Would migrate {$total} entities from bundle '{$bundle}'</comment>");
      return;
    }

    if (!$this->confirm("Migrate {$total} media entities from bundle '{$bundle}' to Cloudflare?")) {
      throw new UserAbortException();
    }

    $processed = 0;
    $errors = 0;

    for ($offset = 0; $offset < $total; $offset += $batch_size) {
      $query = $media_storage->getQuery()
        ->condition('bundle', $bundle)
        ->range($offset, $batch_size)
        ->accessCheck(FALSE);

      $entity_ids = $query->execute();
      $entities = $media_storage->loadMultiple($entity_ids);

      foreach ($entities as $media) {
        try {
          $this->migrateMediaEntity($media);
          $processed++;
          $this->output()->writeln("Migrated: {$media->label()} ({$media->id()})");
        }
        catch (\Exception $e) {
          $errors++;
          $this->output()->writeln("<error>Failed to migrate {$media->label()} ({$media->id()}): {$e->getMessage()}</error>");
        }
      }

      $this->output()->writeln("Progress: {$processed}/{$total} processed, {$errors} errors");
    }

    $this->output()->writeln("<info>Migration complete for bundle '{$bundle}': {$processed} migrated, {$errors} errors.</info>");
  }

  /**
   * Migrate a single media entity.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity.
   *
   * @throws \Exception
   *   When migration fails.
   */
  protected function migrateMediaEntity($media): void {
    $source_field = $media->getSource()->getConfiguration()['source_field'];
    
    if (!$media->hasField($source_field) || $media->get($source_field)->isEmpty()) {
      throw new \Exception('No source file found');
    }

    $file = $media->get($source_field)->entity;
    
    if (!$file) {
      throw new \Exception('File entity not found');
    }

    $file_uri = $file->getFileUri();
    
    if (str_starts_with($file_uri, 'cloudflare://')) {
      throw new \Exception('Already migrated to Cloudflare');
    }

    $file_contents = file_get_contents($file_uri);
    
    if ($file_contents === FALSE) {
      throw new \Exception('Unable to read file contents');
    }

    $cloudflare_id = $media->uuid() . '_' . $file->getFilename();
    $cloudflare_id = preg_replace('/[^a-zA-Z0-9_-]/', '_', $cloudflare_id);
    
    $metadata = [
      'drupal_fid' => $file->id(),
      'drupal_media_id' => $media->id(),
      'original_filename' => $file->getFilename(),
    ];

    $result = $this->apiClient->uploadImage($file_contents, $cloudflare_id, $metadata);
    
    $file->setFileUri('cloudflare://' . $result['id']);
    $file->save();
  }

  /**
   * Process the Cloudflare upload queue.
   *
   * @param array $options
   *   An associative array of options.
   *
   * @option limit
   *   Maximum number of queue items to process (default: 100).
   *
   * @command cloudflare:process-queue
   * @aliases cf:queue
   * @usage cloudflare:process-queue
   *   Process the Cloudflare upload queue.
   * @usage cloudflare:process-queue --limit=50
   *   Process up to 50 items from the queue.
   */
  public function processQueue(array $options = ['limit' => 100]): void {
    $limit = (int) $options['limit'];
    
    $queue = $this->queueFactory->get('cloudflare_media_offload_queue');
    $processed = 0;
    $errors = 0;

    $this->output()->writeln("Processing Cloudflare upload queue (limit: {$limit})...");

    while ($processed < $limit && ($item = $queue->claimItem())) {
      try {
        $this->processQueueItem($item->data);
        $queue->deleteItem($item);
        $processed++;
        $this->output()->writeln("Processed queue item: {$item->item_id}");
      }
      catch (\Exception $e) {
        $errors++;
        $queue->releaseItem($item);
        $this->output()->writeln("<error>Failed to process queue item {$item->item_id}: {$e->getMessage()}</error>");
      }
    }

    $this->output()->writeln("<info>Queue processing complete: {$processed} processed, {$errors} errors.</info>");
  }

  /**
   * Process a single queue item.
   *
   * @param array $data
   *   The queue item data.
   *
   * @throws \Exception
   *   When processing fails.
   */
  protected function processQueueItem(array $data): void {
    $file_storage = $this->entityTypeManager->getStorage('file');
    $media_storage = $this->entityTypeManager->getStorage('media');

    $file = $file_storage->load($data['file_id']);
    $media = $media_storage->load($data['media_id']);

    if (!$file || !$media) {
      throw new \Exception('File or media entity not found');
    }

    $this->migrateMediaEntity($media);
  }

  /**
   * Show Cloudflare media statistics.
   *
   * @command cloudflare:stats
   * @aliases cf:stats
   * @usage cloudflare:stats
   *   Show statistics about Cloudflare media usage.
   */
  public function stats(): void {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $enabled_bundles = $config->get('enabled_bundles') ?? [];

    $this->output()->writeln('<info>Cloudflare Media Offload Statistics</info>');
    $this->output()->writeln('=====================================');

    if (empty($enabled_bundles)) {
      $this->output()->writeln('<comment>No bundles enabled for Cloudflare offload.</comment>');
      return;
    }

    $media_storage = $this->entityTypeManager->getStorage('media');
    
    $total_local = 0;
    $total_cloudflare = 0;

    foreach ($enabled_bundles as $bundle) {
      $query_all = $media_storage->getQuery()
        ->condition('bundle', $bundle)
        ->accessCheck(FALSE);
      
      $total = $query_all->count()->execute();
      
      $media_entities = $media_storage->loadByProperties(['bundle' => $bundle]);
      $cloudflare_count = 0;
      
      foreach ($media_entities as $media) {
        $source_field = $media->getSource()->getConfiguration()['source_field'];
        
        if ($media->hasField($source_field) && !$media->get($source_field)->isEmpty()) {
          $file = $media->get($source_field)->entity;
          
          if ($file && str_starts_with($file->getFileUri(), 'cloudflare://')) {
            $cloudflare_count++;
          }
        }
      }
      
      $local_count = $total - $cloudflare_count;
      
      $this->output()->writeln("Bundle: {$bundle}");
      $this->output()->writeln("  Total: {$total}");
      $this->output()->writeln("  Cloudflare: {$cloudflare_count}");
      $this->output()->writeln("  Local: {$local_count}");
      
      $total_local += $local_count;
      $total_cloudflare += $cloudflare_count;
    }

    $this->output()->writeln('');
    $this->output()->writeln('<info>Overall totals:</info>');
    $this->output()->writeln("Total Cloudflare: {$total_cloudflare}");
    $this->output()->writeln("Total Local: {$total_local}");
    
    $queue = $this->queueFactory->get('cloudflare_media_offload_queue');
    $queue_count = $queue->numberOfItems();
    $this->output()->writeln("Queue items: {$queue_count}");
  }

}