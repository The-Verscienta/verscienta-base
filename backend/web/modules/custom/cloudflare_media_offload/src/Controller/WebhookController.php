<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Controller;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Queue\QueueFactory;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Handles Cloudflare webhook requests.
 */
class WebhookController extends ControllerBase {

  /**
   * Constructs a new WebhookController.
   *
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager.
   * @param \Drupal\Core\Queue\QueueFactory $queueFactory
   *   The queue factory.
   */
  public function __construct(
    protected LoggerInterface $logger,
    protected ConfigFactoryInterface $configFactory,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected QueueFactory $queueFactory,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('logger.channel.cloudflare_media_offload'),
      $container->get('config.factory'),
      $container->get('entity_type.manager'),
      $container->get('queue')
    );
  }

  /**
   * Handle incoming webhook requests from Cloudflare.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   The response.
   */
  public function handle(Request $request): JsonResponse {
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    $webhook_secret = $config->get('webhook_secret');
    
    // If no webhook secret is configured, reject the request
    if (empty($webhook_secret)) {
      $this->logger->warning('Webhook request received but no webhook secret configured');
      return new JsonResponse(['error' => 'Webhook not configured'], 400);
    }

    // Verify the webhook signature
    $signature = $request->headers->get('X-Cloudflare-Signature');
    if (!$signature) {
      $this->logger->warning('Webhook request received without signature');
      return new JsonResponse(['error' => 'Missing signature'], 400);
    }

    $payload = $request->getContent();
    $expected_signature = hash_hmac('sha256', $payload, $webhook_secret);

    if (!hash_equals($expected_signature, $signature)) {
      $this->logger->warning('Webhook request received with invalid signature');
      return new JsonResponse(['error' => 'Invalid signature'], 403);
    }

    // Parse the webhook payload
    $data = json_decode($payload, TRUE);
    if (!$data) {
      $this->logger->warning('Webhook request received with invalid JSON');
      return new JsonResponse(['error' => 'Invalid JSON'], 400);
    }

    // Handle test webhooks
    if (isset($data['test']) && $data['test'] === TRUE) {
      $this->logger->info('Test webhook received successfully');
      return new JsonResponse(['status' => 'success', 'message' => 'Test webhook processed']);
    }

    // Process the webhook event
    try {
      $this->processWebhookEvent($data);
      return new JsonResponse(['status' => 'success']);
    }
    catch (\Exception $e) {
      $this->logger->error('Webhook processing failed: @message', [
        '@message' => $e->getMessage(),
      ]);
      return new JsonResponse(['error' => 'Processing failed'], 500);
    }
  }

  /**
   * Process a webhook event.
   *
   * @param array $data
   *   The webhook event data.
   *
   * @throws \Exception
   *   When processing fails.
   */
  protected function processWebhookEvent(array $data): void {
    $event_type = $data['event'] ?? '';
    $image_id = $data['image_id'] ?? '';

    if (empty($event_type) || empty($image_id)) {
      throw new \Exception('Missing event type or image ID');
    }

    $this->logger->info('Processing webhook event @event for image @id', [
      '@event' => $event_type,
      '@id' => $image_id,
    ]);

    // Find media entities with this Cloudflare ID
    $media_storage = $this->entityTypeManager->getStorage('media');
    $query = $media_storage->getQuery()
      ->condition('status', 1)
      ->accessCheck(FALSE);

    // Search for media entities with file fields containing the Cloudflare URI
    $cloudflare_uri = 'cloudflare://' . $image_id;

    switch ($event_type) {
      case 'images.uploaded':
      case 'images.ready':
        // Image successfully processed - mark as confirmed
        $this->logger->info('Image @id successfully processed by Cloudflare', [
          '@id' => $image_id,
        ]);
        break;

      case 'images.failed':
        // Image processing failed - queue for retry
        $error_message = $data['error'] ?? 'Unknown error';
        $this->logger->error('Cloudflare reported processing failure for image @id: @error', [
          '@id' => $image_id,
          '@error' => $error_message,
        ]);
        
        // Add to retry queue
        $queue = $this->queueFactory->get('cloudflare_upload_retry');
        $queue->createItem([
          'image_id' => $image_id,
          'error' => $error_message,
          'timestamp' => time(),
        ]);
        break;

      case 'images.deleted':
        // Image was deleted from Cloudflare
        $this->logger->info('Image @id was deleted from Cloudflare', [
          '@id' => $image_id,
        ]);
        break;

      default:
        $this->logger->warning('Unknown webhook event type: @event', [
          '@event' => $event_type,
        ]);
    }
  }

}