<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\file\Plugin\Field\FieldWidget\FileWidget;

/**
 * Plugin implementation of the 'cloudflare_image' widget.
 *
 * @FieldWidget(
 *   id = "cloudflare_image",
 *   label = @Translation("Cloudflare Image"),
 *   field_types = {
 *     "image"
 *   }
 * )
 */
class CloudflareImageWidget extends FileWidget {

  /**
   * {@inheritdoc}
   */
  public function formElement(FieldItemListInterface $items, $delta, array $element, array &$form, FormStateInterface $form_state): array {
    $element = parent::formElement($items, $delta, $element, $form, $form_state);
    
    $element['#upload_location'] = 'cloudflare://';
    $element['#process'][] = [static::class, 'processCloudflareUpload'];
    
    return $element;
  }

  /**
   * Process callback for Cloudflare upload elements.
   */
  public static function processCloudflareUpload(array $element, FormStateInterface $form_state, array $form): array {
    $element['#attached']['library'][] = 'cloudflare_media_offload/cloudflare_upload';
    
    if (!empty($element['#files'])) {
      foreach ($element['#files'] as $file) {
        if ($file->getFileUri() && str_starts_with($file->getFileUri(), 'cloudflare://')) {
          $element['cloudflare_url'] = [
            '#type' => 'hidden',
            '#value' => $file->getFileUri(),
          ];
        }
      }
    }
    
    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings(): array {
    return [
      'progress_indicator' => 'throbber',
      'preview_image_style' => 'thumbnail',
      'cloudflare_variant' => 'public',
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
      '#description' => $this->t('The Cloudflare image variant to use for display.'),
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
    
    return $summary;
  }

}