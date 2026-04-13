<?php

declare(strict_types=1);

namespace Drupal\perenual_sync;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\State\StateInterface;
use Drupal\key\KeyRepositoryInterface;
use Drupal\node\NodeInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Log\LoggerInterface;

/**
 * Main service for syncing plant data from Perenual API.
 */
class PerenualSyncService implements PerenualSyncServiceInterface {

  /**
   * The logger.
   *
   * @var \Psr\Log\LoggerInterface
   */
  protected LoggerInterface $logger;

  /**
   * The configuration.
   *
   * @var \Drupal\Core\Config\ImmutableConfig
   */
  protected $config;

  /**
   * Constructs a PerenualSyncService object.
   */
  public function __construct(
    protected ClientInterface $httpClient,
    ConfigFactoryInterface $configFactory,
    protected EntityTypeManagerInterface $entityTypeManager,
    LoggerChannelFactoryInterface $loggerFactory,
    protected StateInterface $state,
    protected KeyRepositoryInterface $keyRepository,
    protected PerenualRateLimiter $rateLimiter,
    protected PerenualFieldMapper $fieldMapper,
    protected PerenualImageHandler $imageHandler,
  ) {
    $this->config = $configFactory->get('perenual_sync.settings');
    $this->logger = $loggerFactory->get('perenual_sync');
  }

  /**
   * {@inheritdoc}
   */
  public function searchPlants(string $query, int $page = 1, array $filters = []): array {
    $params = [
      'q' => $query,
      'page' => $page,
    ];

    // Add filters.
    if (!empty($filters['edible'])) {
      $params['edible'] = '1';
    }
    if (!empty($filters['indoor'])) {
      $params['indoor'] = '1';
    }
    if (!empty($filters['watering'])) {
      $params['watering'] = $filters['watering'];
    }
    if (!empty($filters['sunlight'])) {
      $params['sunlight'] = $filters['sunlight'];
    }

    return $this->request('/species-list', $params);
  }

  /**
   * {@inheritdoc}
   */
  public function getPlantDetails(int $perenualId): ?array {
    try {
      $response = $this->request('/species/details/' . $perenualId);
      return $response ?? NULL;
    }
    catch (\Exception $e) {
      $this->logger->warning('Failed to get plant details @id: @message', [
        '@id' => $perenualId,
        '@message' => $e->getMessage(),
      ]);
      return NULL;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function findByScientificName(string $scientificName): ?array {
    try {
      $response = $this->searchPlants($scientificName);
      $plants = $response['data'] ?? [];

      foreach ($plants as $plant) {
        $plantScientificNames = $plant['scientific_name'] ?? [];
        if (!is_array($plantScientificNames)) {
          $plantScientificNames = [$plantScientificNames];
        }

        foreach ($plantScientificNames as $name) {
          if (strcasecmp($name, $scientificName) === 0) {
            // Found a match, get full details.
            return $this->getPlantDetails($plant['id']);
          }
        }
      }

      // Try partial match.
      if (!empty($plants)) {
        return $this->getPlantDetails($plants[0]['id']);
      }

      return NULL;
    }
    catch (\Exception $e) {
      $this->logger->warning('Failed to find plant by scientific name @name: @message', [
        '@name' => $scientificName,
        '@message' => $e->getMessage(),
      ]);
      return NULL;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function importPlant(int $perenualId): ?NodeInterface {
    // Check for existing node by Perenual ID.
    $existingNode = $this->findExistingHerb($perenualId);

    if ($existingNode && !$this->config->get('update_existing')) {
      $this->log('Skipping existing plant @id (update disabled)', ['@id' => $perenualId]);
      return NULL;
    }

    // Fetch plant data from Perenual.
    $plantData = $this->getPlantDetails($perenualId);
    if (!$plantData) {
      $this->logger->error('Failed to fetch plant data for Perenual ID @id', ['@id' => $perenualId]);
      return NULL;
    }

    // Check if plant has nutritional/medicinal benefits.
    if (!$this->hasNutritionalOrMedicinalBenefits($plantData)) {
      $this->log('Skipping plant @id - no nutritional/medicinal benefits detected', [
        '@id' => $perenualId,
      ]);
      $this->incrementStat('skipped');
      return NULL;
    }

    // Check if herb already exists by name.
    if ($this->config->get('skip_existing_herbs') && !$existingNode) {
      $existingByName = $this->findExistingHerbByName($plantData);
      if ($existingByName) {
        $this->log('Skipping plant @id - herb "@name" already exists', [
          '@id' => $perenualId,
          '@name' => $existingByName->getTitle(),
        ]);
        $this->incrementStat('skipped');
        return NULL;
      }
    }

    try {
      $node = $this->fieldMapper->mapToNode($plantData, $existingNode);

      if ($this->config->get('sync_images')) {
        $imagesAttached = $this->imageHandler->attachImages($plantData, $node);
        $this->log('Attached @count images to plant @id', [
          '@count' => $imagesAttached,
          '@id' => $perenualId,
        ]);
      }

      $node->save();

      $this->incrementStat($existingNode ? 'updated' : 'imported');

      $this->log('Successfully @action plant: @title (Perenual ID: @id)', [
        '@action' => $existingNode ? 'updated' : 'imported',
        '@title' => $node->getTitle(),
        '@id' => $perenualId,
      ]);

      return $node;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to save plant @id: @message', [
        '@id' => $perenualId,
        '@message' => $e->getMessage(),
      ]);
      $this->incrementStat('failed');
      return NULL;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function enrichHerbNode(NodeInterface $node, ?array $perenualData = NULL): bool {
    // If no data provided, search for it.
    if ($perenualData === NULL) {
      // Try scientific name first.
      $scientificName = NULL;
      if ($node->hasField('field_scientific_name') && !$node->get('field_scientific_name')->isEmpty()) {
        $scientificName = $node->get('field_scientific_name')->value;
      }

      if ($scientificName) {
        $perenualData = $this->findByScientificName($scientificName);
      }

      // Fall back to title search.
      if (!$perenualData) {
        $response = $this->searchPlants($node->getTitle());
        $plants = $response['data'] ?? [];
        if (!empty($plants)) {
          $perenualData = $this->getPlantDetails($plants[0]['id']);
        }
      }
    }

    if (!$perenualData) {
      $this->log('No Perenual data found for herb: @title', ['@title' => $node->getTitle()]);
      return FALSE;
    }

    // Enrich the node with missing data.
    $updated = $this->fieldMapper->enrichNode($node, $perenualData);

    // Add images if needed.
    if ($this->config->get('sync_images')) {
      $imagesAdded = $this->imageHandler->attachImages($perenualData, $node, TRUE);
      if ($imagesAdded > 0) {
        $updated = TRUE;
        $this->log('Added @count images to herb: @title', [
          '@count' => $imagesAdded,
          '@title' => $node->getTitle(),
        ]);
      }
    }

    if ($updated) {
      $node->save();
      $this->incrementStat('enriched');
      $this->log('Enriched herb: @title with Perenual data', ['@title' => $node->getTitle()]);
    }

    return $updated;
  }

  /**
   * {@inheritdoc}
   */
  public function batchImport(int $pages = 1, ?callable $progressCallback = NULL): array {
    $stats = [
      'imported' => 0,
      'updated' => 0,
      'skipped' => 0,
      'failed' => 0,
    ];

    $params = ['page' => 1];

    // Add edible filter if configured.
    if ($this->config->get('filter_edible_only')) {
      $params['edible'] = '1';
    }

    for ($page = 1; $page <= $pages; $page++) {
      if (!$this->rateLimiter->canMakeRequest()) {
        $this->logger->warning('Rate limit reached, stopping batch import at page @page', ['@page' => $page]);
        break;
      }

      try {
        $params['page'] = $page;
        $response = $this->request('/species-list', $params);
        $plants = $response['data'] ?? [];

        foreach ($plants as $plant) {
          $perenualId = $plant['id'] ?? NULL;
          if (!$perenualId) {
            continue;
          }

          // Quick check for benefits.
          if (!$this->hasNutritionalOrMedicinalBenefits($plant)) {
            $stats['skipped']++;
            continue;
          }

          $existingNode = $this->findExistingHerb($perenualId);

          if ($existingNode && !$this->config->get('update_existing')) {
            $stats['skipped']++;
            continue;
          }

          // Check by name.
          if ($this->config->get('skip_existing_herbs') && !$existingNode) {
            $existingByName = $this->findExistingHerbByName($plant);
            if ($existingByName) {
              $stats['skipped']++;
              continue;
            }
          }

          $this->importPlant($perenualId);

          if ($progressCallback) {
            $progressCallback($this->getStats());
          }
        }
      }
      catch (\Exception $e) {
        $this->logger->error('Batch import error on page @page: @message', [
          '@page' => $page,
          '@message' => $e->getMessage(),
        ]);
      }
    }

    $this->state->set('perenual_sync.last_sync', time());

    return $this->getStats();
  }

  /**
   * {@inheritdoc}
   */
  public function testConnection(): bool {
    try {
      $response = $this->request('/species-list', ['page' => 1]);
      return isset($response['data']);
    }
    catch (\Exception $e) {
      $this->logger->error('API connection test failed: @message', [
        '@message' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getStats(): array {
    return [
      'total_synced' => $this->state->get('perenual_sync.stats.imported', 0) + $this->state->get('perenual_sync.stats.updated', 0),
      'imported' => $this->state->get('perenual_sync.stats.imported', 0),
      'updated' => $this->state->get('perenual_sync.stats.updated', 0),
      'enriched' => $this->state->get('perenual_sync.stats.enriched', 0),
      'skipped' => $this->state->get('perenual_sync.stats.skipped', 0),
      'failed' => $this->state->get('perenual_sync.stats.failed', 0),
      'last_sync' => $this->state->get('perenual_sync.last_sync'),
      'rate_limit_remaining' => $this->rateLimiter->getRemainingRequests(),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function hasNutritionalOrMedicinalBenefits(array $plantData): bool {
    // Check medicinal flag (Perenual has this!).
    if (!empty($plantData['medicinal']) && $plantData['medicinal'] === TRUE) {
      return TRUE;
    }

    // Check edible parts.
    if (!empty($plantData['edible_leaf']) && $plantData['edible_leaf'] === TRUE) {
      return TRUE;
    }
    if (!empty($plantData['edible_fruit']) && $plantData['edible_fruit'] === TRUE) {
      return TRUE;
    }

    // Check if not poisonous and is edible.
    if (empty($plantData['poisonous_to_humans']) || $plantData['poisonous_to_humans'] === FALSE) {
      // If explicitly marked as edible.
      if (!empty($plantData['edible']) && $plantData['edible'] === TRUE) {
        return TRUE;
      }
    }

    // Check for known medicinal plant families.
    $medicinalFamilies = [
      'Lamiaceae',
      'Asteraceae',
      'Apiaceae',
      'Zingiberaceae',
      'Fabaceae',
      'Rosaceae',
      'Valerianaceae',
      'Papaveraceae',
    ];

    $family = $plantData['family'] ?? NULL;
    if ($family && in_array($family, $medicinalFamilies, TRUE)) {
      return TRUE;
    }

    return FALSE;
  }

  /**
   * Find an existing herb by Perenual ID.
   *
   * @param int $perenualId
   *   The Perenual plant ID.
   *
   * @return \Drupal\node\NodeInterface|null
   *   The existing node or NULL if not found.
   */
  public function findExistingHerb(int $perenualId): ?NodeInterface {
    $nodeStorage = $this->entityTypeManager->getStorage('node');

    // First try by perenual_id field.
    if ($this->fieldExists('field_perenual_id')) {
      $nodes = $nodeStorage->loadByProperties([
        'type' => 'herb',
        'field_perenual_id' => $perenualId,
      ]);

      if (!empty($nodes)) {
        return reset($nodes);
      }
    }

    return NULL;
  }

  /**
   * Find an existing herb by scientific name or common name.
   *
   * @param array $plantData
   *   The plant data from Perenual API.
   *
   * @return \Drupal\node\NodeInterface|null
   *   The existing node or NULL if not found.
   */
  public function findExistingHerbByName(array $plantData): ?NodeInterface {
    $nodeStorage = $this->entityTypeManager->getStorage('node');

    // Check by scientific name.
    $scientificNames = $plantData['scientific_name'] ?? [];
    if (!is_array($scientificNames)) {
      $scientificNames = [$scientificNames];
    }

    foreach ($scientificNames as $scientificName) {
      if ($scientificName && $this->fieldExists('field_scientific_name')) {
        $nodes = $nodeStorage->loadByProperties([
          'type' => 'herb',
          'field_scientific_name' => $scientificName,
        ]);
        if (!empty($nodes)) {
          return reset($nodes);
        }
      }
    }

    // Check by common name (title).
    $commonName = $plantData['common_name'] ?? NULL;
    if ($commonName) {
      $nodes = $nodeStorage->loadByProperties([
        'type' => 'herb',
        'title' => $commonName,
      ]);
      if (!empty($nodes)) {
        return reset($nodes);
      }
    }

    return NULL;
  }

  /**
   * Check if a field exists on the herb content type.
   *
   * @param string $fieldName
   *   The field name.
   *
   * @return bool
   *   TRUE if the field exists, FALSE otherwise.
   */
  protected function fieldExists(string $fieldName): bool {
    // Try to load field config.
    $fieldConfig = $this->entityTypeManager
      ->getStorage('field_config')
      ->load('node.herb.' . $fieldName);

    return $fieldConfig !== NULL;
  }

  /**
   * Make an API request to Perenual.
   *
   * @param string $endpoint
   *   The API endpoint.
   * @param array $params
   *   Query parameters.
   *
   * @return array
   *   The response data.
   *
   * @throws \Exception
   *   If the request fails.
   */
  protected function request(string $endpoint, array $params = []): array {
    if (!$this->rateLimiter->canMakeRequest()) {
      throw new \Exception('Rate limit exceeded for today. Try again tomorrow or upgrade your API plan.');
    }

    $token = $this->getApiToken();
    if (!$token) {
      throw new \Exception('API key not configured. Please configure the Perenual API key.');
    }

    $params['key'] = $token;

    $url = self::API_BASE_URL . $endpoint;

    try {
      $response = $this->httpClient->request('GET', $url, [
        'query' => $params,
        'headers' => [
          'Accept' => 'application/json',
        ],
        'timeout' => 30,
      ]);

      $this->rateLimiter->recordRequest();

      $body = $response->getBody()->getContents();
      $data = json_decode($body, TRUE);

      if (json_last_error() !== JSON_ERROR_NONE) {
        throw new \Exception('Invalid JSON response from API');
      }

      return $data;
    }
    catch (GuzzleException $e) {
      $this->rateLimiter->recordRequest();
      throw new \Exception('API request failed: ' . $e->getMessage());
    }
  }

  /**
   * Get the API token from Key module.
   *
   * @return string|null
   *   The API token or NULL.
   */
  protected function getApiToken(): ?string {
    $keyId = $this->config->get('api_key_id');
    if (!$keyId) {
      return NULL;
    }

    $key = $this->keyRepository->getKey($keyId);
    if (!$key) {
      return NULL;
    }

    return $key->getKeyValue();
  }

  /**
   * Log a message if logging is enabled.
   */
  protected function log(string $message, array $context = []): void {
    if ($this->config->get('enable_logging')) {
      $this->logger->info($message, $context);
    }
  }

  /**
   * Increment a statistics counter.
   */
  protected function incrementStat(string $stat): void {
    $key = 'perenual_sync.stats.' . $stat;
    $current = $this->state->get($key, 0);
    $this->state->set($key, $current + 1);
  }

}
