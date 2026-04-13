<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Form;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\TypedConfigManagerInterface;
use Drupal\Core\Entity\EntityTypeBundleInfoInterface;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\key\KeyRepositoryInterface;
use Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configuration form for Cloudflare Media Offload settings.
 */
class CloudflareMediaOffloadSettingsForm extends ConfigFormBase {

  /**
   * The key repository.
   */
  protected KeyRepositoryInterface $keyRepository;

  /**
   * The bundle info service.
   */
  protected EntityTypeBundleInfoInterface $bundleInfo;

  /**
   * The Cloudflare API client.
   */
  protected CloudflareApiClientInterface $apiClient;

  /**
   * Constructs a new CloudflareMediaOffloadSettingsForm.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Config\TypedConfigManagerInterface $typed_config_manager
   *   The typed config manager.
   * @param \Drupal\key\KeyRepositoryInterface $keyRepository
   *   The key repository.
   * @param \Drupal\Core\Entity\EntityTypeBundleInfoInterface $bundleInfo
   *   The bundle info service.
   * @param \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface $apiClient
   *   The Cloudflare API client.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    TypedConfigManagerInterface $typed_config_manager,
    KeyRepositoryInterface $keyRepository,
    EntityTypeBundleInfoInterface $bundleInfo,
    CloudflareApiClientInterface $apiClient,
  ) {
    parent::__construct($config_factory, $typed_config_manager);
    $this->keyRepository = $keyRepository;
    $this->bundleInfo = $bundleInfo;
    $this->apiClient = $apiClient;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('config.factory'),
      $container->get('config.typed'),
      $container->get('key.repository'),
      $container->get('entity_type.bundle.info'),
      $container->get('cloudflare_media_offload.api_client')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'cloudflare_media_offload_settings_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['cloudflare_media_offload.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('cloudflare_media_offload.settings');
    
    // Add helpful setup instructions
    $form['setup_info'] = [
      '#type' => 'markup',
      '#markup' => '<div class="messages messages--info">' . 
        $this->t('<strong>Setup Instructions:</strong><br/>
        1. First, create Keys for your Cloudflare API Token and Account ID at <a href="/admin/config/system/keys">Administration > Configuration > System > Keys</a><br/>
        2. Then return here to select those keys and configure the module<br/>
        3. Save the form before testing the connection') . 
        '</div>',
      '#weight' => -10,
    ];
    
    $form['credentials'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('API Credentials'),
      '#description' => $this->t('Configure your Cloudflare API credentials using the Key module for secure storage. <strong>You must save this form after selecting your API keys before the "Test Connection" button will work.</strong>'),
    ];

    $keyOptions = ['' => $this->t('- Select a key -')];
    foreach ($this->keyRepository->getKeys() as $key) {
      $keyOptions[$key->id()] = $key->label();
    }

    $form['credentials']['api_key'] = [
      '#type' => 'select',
      '#title' => $this->t('API Token Key'),
      '#description' => $this->t('Select the key containing your Cloudflare API token.'),
      '#options' => $keyOptions,
      '#default_value' => $config->get('api_key'),
      '#required' => TRUE,
    ];

    $form['credentials']['account_id'] = [
      '#type' => 'select',
      '#title' => $this->t('Account ID Key'),
      '#description' => $this->t('Select the key containing your Cloudflare Account ID (used for API calls).'),
      '#options' => $keyOptions,
      '#default_value' => $config->get('account_id'),
      '#required' => TRUE,
    ];

    $form['credentials']['account_hash'] = [
      '#type' => 'select',
      '#title' => $this->t('Account Hash Key (Optional)'),
      '#description' => $this->t('Select the key containing your Cloudflare Account Hash for image delivery URLs. If not provided, Account ID will be used. The Account Hash is the short identifier (8-12 characters) found in your image delivery URLs.'),
      '#options' => $keyOptions,
      '#default_value' => $config->get('account_hash'),
      '#required' => FALSE,
    ];

    $form['credentials']['test_connection'] = [
      '#type' => 'button',
      '#value' => $this->t('Test Connection'),
      '#ajax' => [
        'callback' => '::testConnectionAjax',
        'wrapper' => 'connection-test-result',
      ],
    ];

    $form['credentials']['connection_result'] = [
      '#type' => 'markup',
      '#prefix' => '<div id="connection-test-result">',
      '#suffix' => '</div>',
    ];

    $form['media_settings'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Media Settings'),
    ];

    $mediaBundles = $this->bundleInfo->getBundleInfo('media');
    $bundleOptions = [];
    foreach ($mediaBundles as $bundleId => $bundleInfo) {
      $bundleOptions[$bundleId] = $bundleInfo['label'];
    }

    $form['media_settings']['enabled_bundles'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Enabled Media Bundles'),
      '#description' => $this->t('Select which media bundles should be offloaded to Cloudflare.'),
      '#options' => $bundleOptions,
      '#default_value' => $config->get('enabled_bundles') ?? [],
    ];

    $form['upload_settings'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Upload Settings'),
    ];

    $form['upload_settings']['upload_limits'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Upload Limits'),
    ];

    $form['upload_settings']['upload_limits']['max_file_size'] = [
      '#type' => 'number',
      '#title' => $this->t('Maximum File Size (MB)'),
      '#description' => $this->t('Maximum file size allowed for uploads. Cloudflare limit is 10MB.'),
      '#default_value' => $config->get('upload_limits.max_file_size') ?? 10,
      '#min' => 1,
      '#max' => 10,
      '#required' => TRUE,
    ];

    $form['upload_settings']['upload_limits']['supported_formats'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Supported Image Formats'),
      '#description' => $this->t('Select which image formats are supported for upload.'),
      '#options' => [
        'jpeg' => 'JPEG',
        'jpg' => 'JPG',
        'png' => 'PNG',
        'gif' => 'GIF',
        'webp' => 'WebP',
      ],
      '#default_value' => $config->get('upload_limits.supported_formats') ?? ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    ];

    $form['features'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Features'),
    ];

    $form['features']['auto_optimization'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable Auto Optimization'),
      '#description' => $this->t('Automatically apply Cloudflare image optimization.'),
      '#default_value' => $config->get('auto_optimization') ?? TRUE,
    ];

    $form['features']['bulk_upload_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable Bulk Upload'),
      '#description' => $this->t('Enable bulk upload functionality.'),
      '#default_value' => $config->get('bulk_upload_enabled') ?? TRUE,
    ];

    $form['reliability'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Reliability Settings'),
    ];

    $form['reliability']['fallback_to_local'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Fallback to Local Storage'),
      '#description' => $this->t('If Cloudflare is unavailable, store files locally and queue for later upload.'),
      '#default_value' => $config->get('fallback_to_local') ?? TRUE,
    ];

    $form['reliability']['retry_attempts'] = [
      '#type' => 'number',
      '#title' => $this->t('Retry Attempts'),
      '#description' => $this->t('Number of retry attempts for failed uploads.'),
      '#default_value' => $config->get('retry_attempts') ?? 3,
      '#min' => 1,
      '#max' => 10,
    ];

    $form['advanced'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Advanced Settings'),
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
    ];

    $form['advanced']['webhook_secret'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Webhook Secret'),
      '#description' => $this->t('Secret for validating Cloudflare webhook requests.'),
      '#default_value' => $config->get('webhook_secret'),
    ];

    $form['advanced']['cache_ttl'] = [
      '#type' => 'number',
      '#title' => $this->t('Cache TTL (seconds)'),
      '#description' => $this->t('Time-to-live for cached Cloudflare URLs.'),
      '#default_value' => $config->get('cache_ttl') ?? 86400,
      '#min' => 300,
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * Ajax callback for testing API connection.
   */
  public function testConnectionAjax(array &$form, FormStateInterface $form_state): array {
    // Get the selected key values from form state
    $apiKeyId = $form_state->getValue('api_key');
    $accountIdKeyId = $form_state->getValue('account_id');
    
    // Check if keys are selected
    if (empty($apiKeyId) || empty($accountIdKeyId)) {
      $message = [
        '#type' => 'markup',
        '#markup' => '<div class="messages messages--error">' . 
          $this->t('Please select both API Token Key and Account ID Key before testing.') . 
          '</div>',
      ];
    }
    else {
      // Check if keys exist and have values
      $apiKey = $this->keyRepository->getKey($apiKeyId);
      $accountIdKey = $this->keyRepository->getKey($accountIdKeyId);
      
      if (!$apiKey || !$accountIdKey) {
        $message = [
          '#type' => 'markup',
          '#markup' => '<div class="messages messages--error">' . 
            $this->t('Selected keys do not exist in the Key module.') . 
            '</div>',
        ];
      }
      elseif (empty($apiKey->getKeyValue()) || empty($accountIdKey->getKeyValue())) {
        $message = [
          '#type' => 'markup',
          '#markup' => '<div class="messages messages--error">' . 
            $this->t('Selected keys are empty. Please add values to your keys.') . 
            '</div>',
        ];
      }
      else {
        try {
          if ($this->apiClient->testConnection()) {
            $message = [
              '#type' => 'markup',
              '#markup' => '<div class="messages messages--status">' . 
                $this->t('✓ Connection successful! Your Cloudflare credentials are working.') . 
                '</div>',
            ];
          }
          else {
            $message = [
              '#type' => 'markup',
              '#markup' => '<div class="messages messages--error">' . 
                $this->t('✗ Connection failed. The API returned an error. Please verify:') . 
                '<ul><li>' . $this->t('API token has Cloudflare Images permissions') . '</li>' .
                '<li>' . $this->t('Account ID is correct (32-character hex string)') . '</li>' .
                '<li>' . $this->t('Cloudflare Images is enabled on your account') . '</li></ul>' .
                '</div>',
            ];
          }
        }
        catch (\Exception $e) {
          $message = [
            '#type' => 'markup',
            '#markup' => '<div class="messages messages--error">' . 
              $this->t('✗ Connection error: @message', ['@message' => $e->getMessage()]) . 
              '<br/><strong>Common solutions:</strong>' .
              '<ul><li>' . $this->t('Check your API token is not expired') . '</li>' .
              '<li>' . $this->t('Verify Account ID matches your Cloudflare account') . '</li>' .
              '<li>' . $this->t('Ensure network connectivity to api.cloudflare.com') . '</li></ul>' .
              '</div>',
          ];
        }
      }
    }

    $form['credentials']['connection_result'] = $message;
    return $form['credentials']['connection_result'];
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    // Validate max file size
    $maxFileSize = $form_state->getValue('max_file_size');
    if ($maxFileSize && is_numeric($maxFileSize) && $maxFileSize > 10) {
      $form_state->setErrorByName('upload_limits][max_file_size', $this->t('Maximum file size cannot exceed 10MB due to Cloudflare limitations.'));
    }

    // Validate supported formats
    $supportedFormatsValue = $form_state->getValue('supported_formats');
    $supportedFormats = is_array($supportedFormatsValue) ? array_filter($supportedFormatsValue) : [];

    if (empty($supportedFormats)) {
      $form_state->setErrorByName('upload_limits][supported_formats', $this->t('At least one image format must be selected.'));
    }

    parent::validateForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $config = $this->config('cloudflare_media_offload.settings');
    
    // Get enabled bundles and filter them safely - use simple array_filter
    $enabledBundlesValue = $form_state->getValue('enabled_bundles');
    $enabledBundles = is_array($enabledBundlesValue) ? array_filter($enabledBundlesValue) : [];
    
    // Get supported formats and filter them safely - form values are flattened at root level
    $supportedFormatsValue = $form_state->getValue('supported_formats');
    $supportedFormats = is_array($supportedFormatsValue) ? array_filter($supportedFormatsValue) : [];
    
    $config->set('api_key', $form_state->getValue('api_key') ?: '')
      ->set('account_id', $form_state->getValue('account_id') ?: '')
      ->set('account_hash', $form_state->getValue('account_hash') ?: '')
      ->set('enabled_bundles', $enabledBundles)
      ->set('upload_limits.max_file_size', $form_state->getValue('max_file_size') ?: 10)
      ->set('upload_limits.supported_formats', $supportedFormats)
      ->set('auto_optimization', (bool) $form_state->getValue('auto_optimization'))
      ->set('bulk_upload_enabled', (bool) $form_state->getValue('bulk_upload_enabled'))
      ->set('fallback_to_local', (bool) $form_state->getValue('fallback_to_local'))
      ->set('retry_attempts', $form_state->getValue('retry_attempts') ?: 3)
      ->set('webhook_secret', $form_state->getValue('webhook_secret') ?: '')
      ->set('cache_ttl', $form_state->getValue('cache_ttl') ?: 86400)
      ->save();

    parent::submitForm($form, $form_state);
  }

}