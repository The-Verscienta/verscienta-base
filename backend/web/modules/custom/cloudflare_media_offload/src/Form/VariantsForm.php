<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configuration form for Cloudflare image variants.
 */
class VariantsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'cloudflare_media_offload_variants_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['cloudflare_media_offload.variants'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('cloudflare_media_offload.variants');
    $variants = $config->get('variants') ?? [];

    $form['description'] = [
      '#type' => 'markup',
      '#markup' => '<p>' . $this->t('Define custom Cloudflare image variants for on-the-fly image transformations. Each variant specifies dimensions and transformation options.') . '</p>',
    ];

    $form['variants'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Image Variants'),
      '#tree' => TRUE,
    ];

    // Add existing variants
    foreach ($variants as $key => $variant) {
      $form['variants'][$key] = $this->buildVariantFieldset($variant, $key);
    }

    // Add empty variant for new entries
    $num_new = $form_state->get('num_new') ?? 1;
    for ($i = 0; $i < $num_new; $i++) {
      $new_key = 'new_' . $i;
      $form['variants'][$new_key] = $this->buildVariantFieldset([], $new_key, TRUE);
    }

    $form['add_more'] = [
      '#type' => 'submit',
      '#value' => $this->t('Add another variant'),
      '#submit' => ['::addMoreVariants'],
      '#ajax' => [
        'callback' => '::addMoreCallback',
        'wrapper' => 'variants-wrapper',
      ],
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * Build a variant fieldset.
   *
   * @param array $variant
   *   The variant data.
   * @param string $key
   *   The variant key.
   * @param bool $is_new
   *   Whether this is a new variant.
   *
   * @return array
   *   The fieldset render array.
   */
  protected function buildVariantFieldset(array $variant, string $key, bool $is_new = FALSE): array {
    $fieldset = [
      '#type' => 'fieldset',
      '#title' => $is_new ? $this->t('New Variant') : ($variant['label'] ?? $key),
      '#collapsible' => TRUE,
      '#collapsed' => FALSE,
    ];

    $fieldset['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enabled'),
      '#default_value' => $variant['enabled'] ?? TRUE,
    ];

    $fieldset['machine_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Machine Name'),
      '#description' => $this->t('Machine name for this variant (lowercase, underscores only).'),
      '#default_value' => $variant['machine_name'] ?? '',
      '#required' => FALSE,
      '#pattern' => '[a-z0-9_]+',
    ];

    $fieldset['label'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Label'),
      '#description' => $this->t('Human-readable label for this variant.'),
      '#default_value' => $variant['label'] ?? '',
      '#required' => FALSE,
    ];

    $fieldset['width'] = [
      '#type' => 'number',
      '#title' => $this->t('Width'),
      '#description' => $this->t('Image width in pixels.'),
      '#default_value' => $variant['width'] ?? '',
      '#min' => 1,
    ];

    $fieldset['height'] = [
      '#type' => 'number',
      '#title' => $this->t('Height'),
      '#description' => $this->t('Image height in pixels.'),
      '#default_value' => $variant['height'] ?? '',
      '#min' => 1,
    ];

    $fieldset['fit'] = [
      '#type' => 'select',
      '#title' => $this->t('Fit Mode'),
      '#description' => $this->t('How the image should be resized to fit the dimensions.'),
      '#options' => [
        'scale-down' => $this->t('Scale Down - Never enlarge, only shrink'),
        'contain' => $this->t('Contain - Preserve aspect ratio, may add padding'),
        'cover' => $this->t('Cover - Fill entire area, may crop'),
        'crop' => $this->t('Crop - Crop to exact dimensions'),
        'pad' => $this->t('Pad - Resize and pad to exact dimensions'),
      ],
      '#default_value' => $variant['fit'] ?? 'scale-down',
    ];

    $fieldset['gravity'] = [
      '#type' => 'select',
      '#title' => $this->t('Gravity'),
      '#description' => $this->t('Crop/resize anchor point.'),
      '#options' => [
        'auto' => $this->t('Auto (smart crop)'),
        'center' => $this->t('Center'),
        'top' => $this->t('Top'),
        'right' => $this->t('Right'),
        'bottom' => $this->t('Bottom'),
        'left' => $this->t('Left'),
        'top-left' => $this->t('Top Left'),
        'top-right' => $this->t('Top Right'),
        'bottom-left' => $this->t('Bottom Left'),
        'bottom-right' => $this->t('Bottom Right'),
      ],
      '#default_value' => $variant['gravity'] ?? 'auto',
      '#states' => [
        'visible' => [
          ':input[name="variants[' . $key . '][fit]"]' => ['value' => 'crop'],
        ],
      ],
    ];

    $fieldset['quality'] = [
      '#type' => 'number',
      '#title' => $this->t('Quality'),
      '#description' => $this->t('JPEG/WebP quality (1-100). Lower values = smaller files.'),
      '#default_value' => $variant['quality'] ?? 85,
      '#min' => 1,
      '#max' => 100,
    ];

    $fieldset['format'] = [
      '#type' => 'select',
      '#title' => $this->t('Format'),
      '#description' => $this->t('Output image format.'),
      '#options' => [
        'auto' => $this->t('Auto (based on content negotiation)'),
        'jpeg' => $this->t('JPEG'),
        'png' => $this->t('PNG'),
        'webp' => $this->t('WebP'),
        'avif' => $this->t('AVIF'),
      ],
      '#default_value' => $variant['format'] ?? 'auto',
    ];

    if (!$is_new) {
      $fieldset['delete'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Delete this variant'),
        '#default_value' => FALSE,
      ];
    }

    return $fieldset;
  }

  /**
   * Submit handler to add more variants.
   */
  public function addMoreVariants(array &$form, FormStateInterface $form_state): void {
    $num_new = $form_state->get('num_new') ?? 1;
    $form_state->set('num_new', $num_new + 1);
    $form_state->setRebuild();
  }

  /**
   * Ajax callback for adding more variants.
   */
  public function addMoreCallback(array &$form, FormStateInterface $form_state): array {
    return $form['variants'];
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    $variants_value = $form_state->getValue('variants');

    $machine_names = [];
    foreach ($variants_value as $key => $variant) {
      // Skip empty new variants
      if (strpos($key, 'new_') === 0 && empty($variant['machine_name'])) {
        continue;
      }

      // Skip variants marked for deletion
      if (!empty($variant['delete'])) {
        continue;
      }

      $machine_name = $variant['machine_name'];

      // Validate machine name format
      if (!empty($machine_name) && !preg_match('/^[a-z0-9_]+$/', $machine_name)) {
        $form_state->setErrorByName("variants][$key][machine_name", $this->t('Machine name must contain only lowercase letters, numbers, and underscores.'));
      }

      // Check for duplicate machine names
      if (!empty($machine_name)) {
        if (isset($machine_names[$machine_name])) {
          $form_state->setErrorByName("variants][$key][machine_name", $this->t('Duplicate machine name: @name', ['@name' => $machine_name]));
        }
        $machine_names[$machine_name] = TRUE;
      }

      // Validate that at least width or height is specified
      if (empty($variant['width']) && empty($variant['height'])) {
        $form_state->setErrorByName("variants][$key][width", $this->t('At least one of width or height must be specified.'));
      }
    }

    parent::validateForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $variants_value = $form_state->getValue('variants');
    $variants = [];

    foreach ($variants_value as $key => $variant) {
      // Skip empty new variants
      if (strpos($key, 'new_') === 0 && empty($variant['machine_name'])) {
        continue;
      }

      // Skip variants marked for deletion
      if (!empty($variant['delete'])) {
        continue;
      }

      $machine_name = $variant['machine_name'];
      if (!empty($machine_name)) {
        unset($variant['delete']);
        $variants[$machine_name] = $variant;
      }
    }

    $this->config('cloudflare_media_offload.variants')
      ->set('variants', $variants)
      ->save();

    parent::submitForm($form, $form_state);
  }

}