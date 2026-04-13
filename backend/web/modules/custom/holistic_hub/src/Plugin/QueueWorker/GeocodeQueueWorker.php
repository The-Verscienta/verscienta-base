<?php

declare(strict_types=1);

namespace Drupal\holistic_hub\Plugin\QueueWorker;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Queue\QueueWorkerBase;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Processes geocoding requests for practitioner and clinic entities.
 *
 * @QueueWorker(
 *   id = "holistic_hub_geocode",
 *   title = @Translation("Holistic Hub Geocode"),
 *   cron = {"time" = 30}
 * )
 */
class GeocodeQueueWorker extends QueueWorkerBase implements ContainerFactoryPluginInterface {

  /**
   * Constructs a GeocodeQueueWorker object.
   *
   * @param array $configuration
   *   Plugin configuration.
   * @param string $plugin_id
   *   The plugin ID.
   * @param mixed $plugin_definition
   *   The plugin definition.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected EntityTypeManagerInterface $entityTypeManager,
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
      $container->get('logger.factory')->get('holistic_hub'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function processItem($data): void {
    $entity_type = $data['entity_type'] ?? 'node';
    $entity_id = $data['entity_id'] ?? NULL;

    if (!$entity_id) {
      return;
    }

    $entity = $this->entityTypeManager->getStorage($entity_type)->load($entity_id);
    if (!$entity) {
      $this->logger->warning('Geocode queue: entity @type/@id not found.', [
        '@type' => $entity_type,
        '@id' => $entity_id,
      ]);
      return;
    }

    if (!$entity->hasField('field_address') || $entity->get('field_address')->isEmpty()) {
      return;
    }

    // Build the address string.
    $parts = [];
    $parts[] = $entity->get('field_address')->value;
    if ($entity->hasField('field_city') && !$entity->get('field_city')->isEmpty()) {
      $parts[] = $entity->get('field_city')->value;
    }
    if ($entity->hasField('field_state') && !$entity->get('field_state')->isEmpty()) {
      $parts[] = $entity->get('field_state')->value;
    }
    if ($entity->hasField('field_zip') && !$entity->get('field_zip')->isEmpty()) {
      $parts[] = $entity->get('field_zip')->value;
    }
    $address = implode(', ', $parts);

    $coordinates = holistic_hub_geocode_address($address);

    if ($coordinates && $entity->hasField('field_latitude') && $entity->hasField('field_longitude')) {
      $entity->set('field_latitude', $coordinates['lat']);
      $entity->set('field_longitude', $coordinates['lon']);
      $entity->save();

      $this->logger->info('Geocoded @type/@id successfully.', [
        '@type' => $entity_type,
        '@id' => $entity_id,
      ]);
    }
  }

}
