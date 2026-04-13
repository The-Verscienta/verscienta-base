<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Form;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeBundleInfoInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for batch migrating media to Cloudflare.
 */
class MigrationForm extends FormBase {

  /**
   * Constructs a new MigrationForm.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient
   *   The Cloudflare API client.
   */
  public function __construct(
    protected ConfigFactoryInterface $configFactory,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected CloudflareApiClientInterface $apiClient,
    protected EntityTypeBundleInfoInterface $bundleInfo,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('config.factory'),
      $container->get('entity_type.manager'),
      $container->get('cloudflare_media_offload.api_client'),
      $container->get('entity_type.bundle.info')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'cloudflare_media_offload_migration_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $enabled_bundles = $config->get('enabled_bundles') ?? [];

    if (empty($enabled_bundles)) {
      $form['no_bundles'] = [
        '#type' => 'markup',
        '#markup' => '<p>' . $this->t('No media bundles are enabled for Cloudflare offload. Please <a href="@url">configure settings</a> first.', [
          '@url' => \Drupal\Core\Url::fromRoute('cloudflare_media_offload.settings')->toString(),
        ]) . '</p>',
      ];
      return $form;
    }

    $form['description'] = [
      '#type' => 'markup',
      '#markup' => '<p>' . $this->t('This form will migrate existing local media files to Cloudflare Images using batch processing. This may take some time for large media libraries.') . '</p>',
    ];

    // Get statistics about media to migrate
    $stats = $this->getMigrationStats();

    $form['statistics'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Migration Statistics'),
    ];

    $form['statistics']['info'] = [
      '#type' => 'table',
      '#header' => [$this->t('Bundle'), $this->t('Total'), $this->t('Local'), $this->t('Cloudflare')],
      '#rows' => $stats['rows'],
      '#empty' => $this->t('No media entities found.'),
    ];

    $form['statistics']['summary'] = [
      '#type' => 'markup',
      '#markup' => '<p><strong>' . $this->t('Total items to migrate: @count', ['@count' => $stats['total_local']]) . '</strong></p>',
    ];

    if ($stats['total_local'] == 0) {
      $form['no_migration'] = [
        '#type' => 'markup',
        '#markup' => '<div class="messages messages--status">' . $this->t('All media has already been migrated to Cloudflare!') . '</div>',
      ];
      return $form;
    }

    $form['options'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Migration Options'),
    ];

    $bundle_options = [];
    foreach ($enabled_bundles as $bundle_id) {
      $bundle_info = $this->bundleInfo->getBundleInfo('media');
      if (isset($bundle_info[$bundle_id])) {
        $bundle_options[$bundle_id] = $bundle_info[$bundle_id]['label'];
      }
    }

    $form['options']['bundles'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Media Bundles to Migrate'),
      '#description' => $this->t('Select which media bundles to migrate.'),
      '#options' => $bundle_options,
      '#default_value' => $enabled_bundles,
      '#required' => TRUE,
    ];

    $form['options']['batch_size'] = [
      '#type' => 'number',
      '#title' => $this->t('Batch Size'),
      '#description' => $this->t('Number of items to process in each batch operation.'),
      '#default_value' => 10,
      '#min' => 1,
      '#max' => 100,
      '#required' => TRUE,
    ];

    $form['options']['skip_errors'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Skip Errors'),
      '#description' => $this->t('Continue migration even if some items fail. Failed items will be logged.'),
      '#default_value' => TRUE,
    ];

    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Start Migration'),
      '#button_type' => 'primary',
    ];

    return $form;
  }

  /**
   * Get migration statistics.
   *
   * @return array
   *   Array with statistics.
   */
  protected function getMigrationStats(): array {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $enabled_bundles = $config->get('enabled_bundles') ?? [];
    $media_storage = $this->entityTypeManager->getStorage('media');

    $rows = [];
    $total_local = 0;

    foreach ($enabled_bundles as $bundle) {
      $query = $media_storage->getQuery()
        ->condition('bundle', $bundle)
        ->accessCheck(FALSE);

      $total = $query->count()->execute();

      $cloudflare_count = 0;
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
          continue;
        }
      }

      $local_count = $total - $cloudflare_count;
      $total_local += $local_count;

      $bundle_info = $this->bundleInfo->getBundleInfo('media');
      $bundle_label = $bundle_info[$bundle]['label'] ?? $bundle;

      $rows[] = [
        $bundle_label,
        $total,
        $local_count,
        $cloudflare_count,
      ];
    }

    return [
      'rows' => $rows,
      'total_local' => $total_local,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    $bundles = array_filter($form_state->getValue('bundles'));
    if (empty($bundles)) {
      $form_state->setErrorByName('bundles', $this->t('Please select at least one media bundle to migrate.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $bundles = array_filter($form_state->getValue('bundles'));
    $batch_size = (int) $form_state->getValue('batch_size');
    $skip_errors = (bool) $form_state->getValue('skip_errors');

    // Build batch operations
    $operations = [];
    $media_storage = $this->entityTypeManager->getStorage('media');

    foreach ($bundles as $bundle) {
      $query = $media_storage->getQuery()
        ->condition('bundle', $bundle)
        ->accessCheck(FALSE);

      $entity_ids = $query->execute();

      // Split into chunks for batch processing
      $chunks = array_chunk($entity_ids, $batch_size);

      foreach ($chunks as $chunk) {
        $operations[] = [
          '\Drupal\cloudflare_media_offload\Batch\MigrationBatch::processBatch',
          [$chunk, $bundle, $skip_errors],
        ];
      }
    }

    $batch = [
      'title' => $this->t('Migrating media to Cloudflare...'),
      'operations' => $operations,
      'finished' => '\Drupal\cloudflare_media_offload\Batch\MigrationBatch::finishBatch',
      'progress_message' => $this->t('Processed @current of @total batches.'),
      'error_message' => $this->t('The migration process has encountered an error.'),
    ];

    batch_set($batch);
  }

}