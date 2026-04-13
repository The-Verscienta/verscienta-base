<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Form;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Queue\QueueFactory;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\file\FileRepositoryInterface;
use Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Bulk upload form for Cloudflare Media Offload.
 */
class BulkUploadForm extends FormBase {

  /**
   * The entity type manager.
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * The file repository.
   */
  protected FileRepositoryInterface $fileRepository;

  /**
   * The Cloudflare API client.
   */
  protected CloudflareApiClientInterface $apiClient;

  /**
   * The queue factory.
   */
  protected QueueFactory $queueFactory;

  /**
   * The current user.
   */
  protected AccountInterface $currentUser;

  /**
   * Constructs a new BulkUploadForm.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\file\FileRepositoryInterface $fileRepository
   *   The file repository.
   * @param \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient
   *   The Cloudflare API client.
   * @param \Drupal\Core\Queue\QueueFactory $queueFactory
   *   The queue factory.
   * @param \Drupal\Core\Session\AccountInterface $currentUser
   *   The current user.
   */
  public function __construct(
    protected ConfigFactoryInterface $configFactory,
    EntityTypeManagerInterface $entityTypeManager,
    FileRepositoryInterface $fileRepository,
    CloudflareApiClientInterface $apiClient,
    QueueFactory $queueFactory,
    AccountInterface $currentUser,
  ) {
    $this->entityTypeManager = $entityTypeManager;
    $this->fileRepository = $fileRepository;
    $this->apiClient = $apiClient;
    $this->queueFactory = $queueFactory;
    $this->currentUser = $currentUser;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('config.factory'),
      $container->get('entity_type.manager'),
      $container->get('file.repository'),
      $container->get('cloudflare_media_offload.api_client'),
      $container->get('queue'),
      $container->get('current_user')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'cloudflare_media_offload_bulk_upload_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    
    if (!$config->get('bulk_upload_enabled')) {
      $form['disabled'] = [
        '#type' => 'markup',
        '#markup' => '<p>' . $this->t('Bulk upload is currently disabled. Please contact an administrator to enable this feature.') . '</p>',
      ];
      return $form;
    }

    $form['#attributes']['enctype'] = 'multipart/form-data';
    $form['#attached']['library'][] = 'cloudflare_media_offload/bulk_upload';

    $form['description'] = [
      '#type' => 'markup',
      '#markup' => '<p>' . $this->t('Upload multiple images to Cloudflare Images. You can drag and drop files or use the browse button.') . '</p>',
    ];

    $form['upload_area'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'bulk-upload-area',
        'class' => ['bulk-upload-dropzone'],
      ],
    ];

    $form['upload_area']['files'] = [
      '#type' => 'file',
      '#title' => $this->t('Select files'),
      '#multiple' => TRUE,
      '#attributes' => [
        'accept' => $this->getAcceptedFormats(),
        'id' => 'bulk-upload-files',
      ],
    ];

    $form['upload_area']['dropzone_text'] = [
      '#type' => 'markup',
      '#markup' => '<div class="dropzone-text">' . $this->t('Drag files here or click to browse') . '</div>',
    ];

    $form['media_bundle'] = [
      '#type' => 'select',
      '#title' => $this->t('Media Bundle'),
      '#description' => $this->t('Select the media bundle for uploaded files.'),
      '#options' => $this->getMediaBundleOptions(),
      '#required' => TRUE,
    ];

    $form['progress'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'upload-progress',
        'style' => 'display: none;',
      ],
    ];

    $form['results'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'upload-results',
      ],
    ];

    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['upload'] = [
      '#type' => 'submit',
      '#value' => $this->t('Upload Files'),
      '#attributes' => [
        'id' => 'bulk-upload-submit',
        'disabled' => 'disabled',
      ],
      '#ajax' => [
        'callback' => '::ajaxUploadFiles',
        'wrapper' => 'upload-results',
        'progress' => [
          'type' => 'fullscreen',
          'message' => $this->t('Uploading files to Cloudflare...'),
        ],
      ],
    ];

    return $form;
  }

  /**
   * Get accepted file formats for the file input.
   *
   * @return string
   *   The accept attribute value.
   */
  protected function getAcceptedFormats(): string {
    $config = $this->config('cloudflare_media_offload.settings');
    $supported_formats = $config->get('upload_limits.supported_formats') ?? [];
    
    $mime_types = [];
    foreach ($supported_formats as $format) {
      switch (strtolower($format)) {
        case 'jpeg':
        case 'jpg':
          $mime_types[] = 'image/jpeg';
          break;
        case 'png':
          $mime_types[] = 'image/png';
          break;
        case 'gif':
          $mime_types[] = 'image/gif';
          break;
        case 'webp':
          $mime_types[] = 'image/webp';
          break;
      }
    }
    
    return implode(',', array_unique($mime_types));
  }

  /**
   * Get media bundle options.
   *
   * @return array
   *   Array of media bundle options.
   */
  protected function getMediaBundleOptions(): array {
    $config = $this->config('cloudflare_media_offload.settings');
    $enabled_bundles = $config->get('enabled_bundles') ?? [];
    
    $bundle_info = $this->entityTypeManager->getBundleInfo('media');
    $options = [];
    
    foreach ($enabled_bundles as $bundle_id) {
      if (isset($bundle_info[$bundle_id])) {
        $options[$bundle_id] = $bundle_info[$bundle_id]['label'];
      }
    }
    
    return $options;
  }

  /**
   * Ajax callback for file uploads.
   */
  public function ajaxUploadFiles(array &$form, FormStateInterface $form_state): array {
    $results = [];
    
    $files = $this->getRequest()->files->get('files');
    if (!$files || !is_array($files['files'])) {
      $results['error'] = $this->t('No files uploaded.');
      return $this->buildResultsElement($results);
    }

    $bundle = $form_state->getValue('media_bundle');
    $uploaded_files = $files['files'];
    
    $success_count = 0;
    $error_count = 0;
    $errors = [];

    foreach ($uploaded_files as $uploaded_file) {
      if ($uploaded_file->isValid()) {
        try {
          $this->processUploadedFile($uploaded_file, $bundle);
          $success_count++;
        }
        catch (\Exception $e) {
          $error_count++;
          $errors[] = $this->t('Error uploading @filename: @error', [
            '@filename' => $uploaded_file->getClientOriginalName(),
            '@error' => $e->getMessage(),
          ]);
        }
      }
      else {
        $error_count++;
        $errors[] = $this->t('Invalid file: @filename', [
          '@filename' => $uploaded_file->getClientOriginalName(),
        ]);
      }
    }

    $results = [
      'success_count' => $success_count,
      'error_count' => $error_count,
      'errors' => $errors,
    ];

    return $this->buildResultsElement($results);
  }

  /**
   * Process a single uploaded file.
   *
   * @param \Symfony\Component\HttpFoundation\File\UploadedFile $uploaded_file
   *   The uploaded file.
   * @param string $bundle
   *   The media bundle.
   *
   * @throws \Exception
   *   When processing fails.
   */
  protected function processUploadedFile($uploaded_file, string $bundle): void {
    $file = $this->fileRepository->writeData(
      file_get_contents($uploaded_file->getPathname()),
      'temporary://' . $uploaded_file->getClientOriginalName(),
      FileSystemInterface::EXISTS_RENAME
    );

    $media_storage = $this->entityTypeManager->getStorage('media');
    $media_type = $this->entityTypeManager->getStorage('media_type')->load($bundle);
    
    if (!$media_type) {
      throw new \Exception('Invalid media bundle: ' . $bundle);
    }

    $source_field = $media_type->getSource()->getConfiguration()['source_field'];
    
    $media = $media_storage->create([
      'bundle' => $bundle,
      'name' => $uploaded_file->getClientOriginalName(),
      $source_field => $file->id(),
      'uid' => $this->currentUser->id(),
      'status' => 1,
    ]);

    $media->save();
  }

  /**
   * Build results element for Ajax response.
   *
   * @param array $results
   *   The results array.
   *
   * @return array
   *   The render array.
   */
  protected function buildResultsElement(array $results): array {
    $element = [
      '#type' => 'container',
      '#attributes' => ['id' => 'upload-results'],
    ];

    if (isset($results['error'])) {
      $element['error'] = [
        '#type' => 'markup',
        '#markup' => '<div class="messages messages--error">' . $results['error'] . '</div>',
      ];
    }
    else {
      $element['summary'] = [
        '#type' => 'markup',
        '#markup' => '<div class="messages messages--status">' . 
          $this->t('Upload complete: @success successful, @errors errors', [
            '@success' => $results['success_count'],
            '@errors' => $results['error_count'],
          ]) . '</div>',
      ];

      if (!empty($results['errors'])) {
        $element['errors'] = [
          '#type' => 'markup',
          '#markup' => '<div class="messages messages--warning"><ul><li>' . 
            implode('</li><li>', $results['errors']) . '</li></ul></div>',
        ];
      }
    }

    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    parent::validateForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
  }

}