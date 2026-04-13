<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Controller;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\Core\Entity\EntityTypeBundleInfoInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Queue\QueueFactory;
use Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Status dashboard controller for Cloudflare Media Offload.
 */
class StatusController extends ControllerBase {

  /**
   * Constructs a new StatusController.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\Core\Queue\QueueFactory $queueFactory
   *   The queue factory.
   * @param \Drupal\Core\Database\Connection $database
   *   The database connection.
   * @param \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient
   *   The Cloudflare API client.
   */
  public function __construct(
    ConfigFactoryInterface $configFactory,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected QueueFactory $queueFactory,
    protected Connection $database,
    protected CloudflareApiClientInterface $apiClient,
    protected EntityTypeBundleInfoInterface $bundleInfo,
  ) {
    $this->configFactory = $configFactory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('config.factory'),
      $container->get('entity_type.manager'),
      $container->get('queue'),
      $container->get('database'),
      $container->get('cloudflare_media_offload.api_client'),
      $container->get('entity_type.bundle.info')
    );
  }

  /**
   * Display the status dashboard.
   *
   * @return array
   *   The render array.
   */
  public function dashboard(): array {
    $config = $this->config('cloudflare_media_offload.settings');

    $build = [];

    $build['#attached']['library'][] = 'cloudflare_media_offload/status_dashboard';

    // Connection status
    $build['connection'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Connection Status'),
    ];

    try {
      $connection_ok = $this->apiClient->testConnection();
      $build['connection']['status'] = [
        '#type' => 'markup',
        '#markup' => $connection_ok
          ? '<div class="messages messages--status">' . $this->t('✓ Connected to Cloudflare Images API') . '</div>'
          : '<div class="messages messages--error">' . $this->t('✗ Unable to connect to Cloudflare Images API') . '</div>',
      ];
    }
    catch (\Exception $e) {
      $build['connection']['status'] = [
        '#type' => 'markup',
        '#markup' => '<div class="messages messages--error">' .
          $this->t('✗ Connection error: @error', ['@error' => $e->getMessage()]) .
          '</div>',
      ];
    }

    // Statistics
    $stats = $this->getStatistics();
    $build['statistics'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Statistics'),
    ];

    $build['statistics']['table'] = [
      '#type' => 'table',
      '#header' => [$this->t('Metric'), $this->t('Value')],
      '#rows' => [
        [$this->t('Total Media Entities'), $stats['total_media']],
        [$this->t('Cloudflare-hosted Images'), $stats['cloudflare_count']],
        [$this->t('Local Images'), $stats['local_count']],
        [$this->t('Migration Progress'), $stats['migration_percentage'] . '%'],
        [$this->t('Queue Items Pending'), $stats['queue_count']],
      ],
    ];

    // Recent activity
    $build['activity'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Recent Activity'),
    ];

    $recent_logs = $this->getRecentLogs(10);
    if (!empty($recent_logs)) {
      $rows = [];
      foreach ($recent_logs as $log) {
        $status_class = $log->status === 'success' ? 'color-success' : 'color-error';
        $rows[] = [
          date('Y-m-d H:i:s', $log->timestamp),
          $log->operation,
          ['data' => ['#markup' => '<span class="' . $status_class . '">' . $log->status . '</span>']],
          $log->message ?? '',
        ];
      }

      $build['activity']['table'] = [
        '#type' => 'table',
        '#header' => [
          $this->t('Time'),
          $this->t('Operation'),
          $this->t('Status'),
          $this->t('Message'),
        ],
        '#rows' => $rows,
      ];
    }
    else {
      $build['activity']['empty'] = [
        '#type' => 'markup',
        '#markup' => '<p>' . $this->t('No recent activity.') . '</p>',
      ];
    }

    // Enabled bundles
    $enabled_bundles = $config->get('enabled_bundles') ?? [];
    $build['bundles'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Enabled Media Bundles'),
    ];

    if (!empty($enabled_bundles)) {
      $bundle_info = $this->bundleInfo->getBundleInfo('media');
      $items = [];
      foreach ($enabled_bundles as $bundle_id) {
        $items[] = $bundle_info[$bundle_id]['label'] ?? $bundle_id;
      }

      $build['bundles']['list'] = [
        '#theme' => 'item_list',
        '#items' => $items,
      ];
    }
    else {
      $build['bundles']['empty'] = [
        '#type' => 'markup',
        '#markup' => '<p>' . $this->t('No media bundles are enabled for Cloudflare offload.') . '</p>',
      ];
    }

    // Quick actions
    $build['actions'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Quick Actions'),
    ];

    $build['actions']['links'] = [
      '#theme' => 'item_list',
      '#items' => [
        [
          '#type' => 'link',
          '#title' => $this->t('Configure Settings'),
          '#url' => \Drupal\Core\Url::fromRoute('cloudflare_media_offload.settings'),
        ],
        [
          '#type' => 'link',
          '#title' => $this->t('Bulk Upload'),
          '#url' => \Drupal\Core\Url::fromRoute('cloudflare_media_offload.bulk_upload'),
        ],
        [
          '#type' => 'link',
          '#title' => $this->t('View Logs'),
          '#url' => \Drupal\Core\Url::fromRoute('dblog.overview'),
        ],
      ],
    ];

    return $build;
  }

  /**
   * Get statistics about media entities.
   *
   * @return array
   *   Array of statistics.
   */
  protected function getStatistics(): array {
    $config = $this->config('cloudflare_media_offload.settings');
    $enabled_bundles = $config->get('enabled_bundles') ?? [];

    if (empty($enabled_bundles)) {
      return [
        'total_media' => 0,
        'cloudflare_count' => 0,
        'local_count' => 0,
        'migration_percentage' => 0,
        'queue_count' => 0,
      ];
    }

    $media_storage = $this->entityTypeManager->getStorage('media');

    $total_media = 0;
    $cloudflare_count = 0;

    foreach ($enabled_bundles as $bundle) {
      $query = $media_storage->getQuery()
        ->condition('bundle', $bundle)
        ->accessCheck(FALSE);

      $total = $query->count()->execute();
      $total_media += $total;

      $media_entities = $media_storage->loadByProperties(['bundle' => $bundle]);

      foreach ($media_entities as $media) {
        try {
          $source_field = $media->getSource()->getConfiguration()['source_field'];

          if ($media->hasField($source_field) && !$media->get($source_field)->isEmpty()) {
            $file = $media->get($source_field)->entity;

            if ($file && str_starts_with($file->getFileUri(), 'cloudflare://')) {
              $cloudflare_count++;
            }
          }
        }
        catch (\Exception $e) {
          // Skip entities with errors
          continue;
        }
      }
    }

    $local_count = $total_media - $cloudflare_count;
    $migration_percentage = $total_media > 0
      ? round(($cloudflare_count / $total_media) * 100, 1)
      : 0;

    $queue = $this->queueFactory->get('cloudflare_media_offload_queue');
    $queue_count = $queue->numberOfItems();

    return [
      'total_media' => $total_media,
      'cloudflare_count' => $cloudflare_count,
      'local_count' => $local_count,
      'migration_percentage' => $migration_percentage,
      'queue_count' => $queue_count,
    ];
  }

  /**
   * Get recent log entries.
   *
   * @param int $limit
   *   The number of logs to retrieve.
   *
   * @return array
   *   Array of log entries.
   */
  protected function getRecentLogs(int $limit = 10): array {
    if (!$this->database->schema()->tableExists('cloudflare_media_offload_log')) {
      return [];
    }

    $query = $this->database->select('cloudflare_media_offload_log', 'l')
      ->fields('l')
      ->orderBy('timestamp', 'DESC')
      ->range(0, $limit);

    return $query->execute()->fetchAll();
  }

}