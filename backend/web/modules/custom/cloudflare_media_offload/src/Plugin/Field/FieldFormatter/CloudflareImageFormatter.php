<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Plugin\Field\FieldFormatter;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\image\Plugin\Field\FieldFormatter\ImageFormatter;
use Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Plugin implementation of the 'cloudflare_image' formatter.
 *
 * @FieldFormatter(
 *   id = "cloudflare_image",
 *   label = @Translation("Cloudflare Image"),
 *   field_types = {
 *     "image"
 *   }
 * )
 */
class CloudflareImageFormatter extends ImageFormatter {

  /**
   * The Cloudflare API client.
   *
   * @var \Drupal\cloudflare_media_offload\Service\CloudflareApiClientInterface
   */
  protected CloudflareApiClientInterface $apiClient;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): self {
    $instance = parent::create($container, $configuration, $plugin_id, $plugin_definition);
    $instance->apiClient = $container->get('cloudflare_media_offload.api_client');
    return $instance;
  }

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings(): array {
    return [
      'cloudflare_variant' => 'public',
      'responsive' => TRUE,
      'lazy_loading' => TRUE,
      'image_transformations' => '',
    ] + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state): array {
    $element = parent::settingsForm($form, $form_state);
    
    $element['cloudflare_variant'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Cloudflare Variant'),
      '#default_value' => $this->getSetting('cloudflare_variant'),
      '#description' => $this->t('The Cloudflare image variant to use for display. Use "public" for the original image.'),
    ];
    
    $element['responsive'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Responsive Images'),
      '#default_value' => $this->getSetting('responsive'),
      '#description' => $this->t('Generate responsive images using Cloudflare transformations.'),
    ];
    
    $element['lazy_loading'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Lazy Loading'),
      '#default_value' => $this->getSetting('lazy_loading'),
      '#description' => $this->t('Enable lazy loading for images.'),
    ];
    
    $element['image_transformations'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Image Transformations'),
      '#default_value' => $this->getSetting('image_transformations'),
      '#description' => $this->t('Custom Cloudflare image transformations (e.g., "width=800,format=webp"). Leave empty to use defaults.'),
    ];
    
    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary(): array {
    $summary = parent::settingsSummary();
    
    $summary[] = $this->t('Cloudflare variant: @variant', [
      '@variant' => $this->getSetting('cloudflare_variant'),
    ]);
    
    if ($this->getSetting('responsive')) {
      $summary[] = $this->t('Responsive images: Enabled');
    }
    
    if ($this->getSetting('lazy_loading')) {
      $summary[] = $this->t('Lazy loading: Enabled');
    }
    
    if ($transformations = $this->getSetting('image_transformations')) {
      $summary[] = $this->t('Transformations: @transformations', [
        '@transformations' => $transformations,
      ]);
    }
    
    return $summary;
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode): array {
    $elements = [];
    $files = $this->getEntitiesToView($items, $langcode);

    if (empty($files)) {
      return $elements;
    }

    $url = NULL;
    $image_link_setting = $this->getSetting('image_link');
    if ($image_link_setting == 'content') {
      $entity = $items->getEntity();
      if (!$entity->isNew()) {
        $url = $entity->toUrl();
      }
    }
    elseif ($image_link_setting == 'file') {
      $link_file = TRUE;
    }

    $image_style_setting = $this->getSetting('image_style');

    $cache_tags = [];
    if (!empty($image_style_setting)) {
      $image_style = $this->imageStyleStorage->load($image_style_setting);
      if ($image_style) {
        $cache_tags = $image_style->getCacheTags();
      }
    }

    foreach ($files as $delta => $file) {
      $cache_contexts = [];
      $cache_tags_item = Cache::mergeTags($cache_tags, $file->getCacheTags());

      $image_uri = $file->getFileUri();
      
      if (str_starts_with($image_uri, 'cloudflare://')) {
        $cloudflare_id = str_replace('cloudflare://', '', $image_uri);
        
        $variant = $this->getSetting('cloudflare_variant');
        $transformations = $this->getSetting('image_transformations');
        
        if ($transformations) {
          $image_url = $this->apiClient->getImageVariantUrl($cloudflare_id, $transformations);
        }
        elseif ($variant !== 'public') {
          $image_url = $this->apiClient->getImageVariantUrl($cloudflare_id, $variant);
        }
        else {
          $image_url = $this->apiClient->getImageUrl($cloudflare_id);
        }
      }
      else {
        $image_url = $this->imageStyleStorage->load($image_style_setting)
          ? $this->imageStyleStorage->load($image_style_setting)->buildUrl($image_uri)
          : \Drupal::service('file_url_generator')->generateString($image_uri);
      }

      $item = $items[$delta];
      $item_attributes = $item->_attributes ?? [];
      unset($item->_attributes);

      $elements[$delta] = [
        '#theme' => 'image_formatter',
        '#item' => $item,
        '#item_attributes' => $item_attributes,
        '#image_style' => $image_style_setting,
        '#url' => $url,
        '#cache' => [
          'tags' => $cache_tags_item,
          'contexts' => $cache_contexts,
        ],
      ];

      if (str_starts_with($image_uri, 'cloudflare://')) {
        $elements[$delta]['#item']->uri = $image_url;
        
        if ($this->getSetting('lazy_loading')) {
          $elements[$delta]['#item_attributes']['loading'] = 'lazy';
        }
        
        if ($this->getSetting('responsive')) {
          $elements[$delta]['#attached']['library'][] = 'cloudflare_media_offload/responsive_images';
        }
      }

      if (isset($link_file)) {
        $file_url = str_starts_with($image_uri, 'cloudflare://') 
          ? $image_url 
          : \Drupal::service('file_url_generator')->generateString($image_uri);
        $elements[$delta]['#url'] = $file_url;
      }
    }

    return $elements;
  }

}