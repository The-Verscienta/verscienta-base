<?php

declare(strict_types=1);

namespace Drupal\cloudflare_media_offload\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\key\KeyRepositoryInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\RequestOptions;
use Psr\Log\LoggerInterface;

/**
 * Cloudflare Images API client service.
 */
class CloudflareApiClient implements CloudflareApiClientInterface {

  const API_BASE_URL = 'https://api.cloudflare.com/client/v4';
  const DELIVERY_BASE_URL = 'https://imagedelivery.net';

  protected ?string $apiToken = null;
  protected ?string $accountId = null;
  protected ?string $accountHash = null;
  protected ?string $zoneId = null;
  protected bool $credentialsInitialized = false;

  /**
   * Constructs a new CloudflareApiClient.
   *
   * @param \GuzzleHttp\ClientInterface $httpClient
   *   The HTTP client.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Drupal\key\KeyRepositoryInterface $keyRepository
   *   The key repository.
   * @param \Psr\Log\LoggerInterface $logger
   *   The logger.
   */
  public function __construct(
    protected ClientInterface $httpClient,
    protected ConfigFactoryInterface $configFactory,
    protected KeyRepositoryInterface $keyRepository,
    protected LoggerInterface $logger,
  ) {
    // Don't initialize credentials in constructor to avoid errors during module installation
  }

  /**
   * Initialize API credentials from Key module.
   */
  protected function initializeCredentials(): void {
    if ($this->credentialsInitialized) {
      return;
    }
    
    $config = $this->configFactory->get('cloudflare_media_offload.settings');
    
    $apiKeyId = $config->get('api_key');
    $accountIdKeyId = $config->get('account_id');
    $accountHashKeyId = $config->get('account_hash');
    
    $this->logger->debug('Initializing credentials - API key ID: @api_key_id, Account ID key ID: @account_id_key_id, Account Hash key ID: @account_hash_key_id', [
      '@api_key_id' => $apiKeyId ?: 'EMPTY',
      '@account_id_key_id' => $accountIdKeyId ?: 'EMPTY',
      '@account_hash_key_id' => $accountHashKeyId ?: 'EMPTY',
    ]);
    
    if (empty($apiKeyId) || empty($accountIdKeyId)) {
      throw new \InvalidArgumentException('Cloudflare API credentials not configured. Please configure keys at /admin/config/media/cloudflare-media-offload');
    }
    
    $apiKey = $this->keyRepository->getKey($apiKeyId);
    $accountIdKey = $this->keyRepository->getKey($accountIdKeyId);
    $accountHashKey = $accountHashKeyId ? $this->keyRepository->getKey($accountHashKeyId) : null;
    
    if (!$apiKey || !$accountIdKey) {
      $this->logger->error('Key retrieval failed - API key exists: @api_key_exists, Account ID key exists: @account_key_exists', [
        '@api_key_exists' => $apiKey ? 'YES' : 'NO',
        '@account_key_exists' => $accountIdKey ? 'YES' : 'NO',
      ]);
      throw new \InvalidArgumentException('Unable to retrieve Cloudflare API credentials from Key module. Check that the selected keys exist.');
    }
    
    $apiTokenValue = $apiKey->getKeyValue();
    $accountIdValue = $accountIdKey->getKeyValue();
    $accountHashValue = $accountHashKey ? $accountHashKey->getKeyValue() : null;
    
    // If no separate account hash is provided, use the account ID for delivery URLs
    if (empty($accountHashValue)) {
      $accountHashValue = $accountIdValue;
    }
    
    $this->logger->debug('Key values retrieved - API token length: @api_token_length, Account ID length: @account_id_length, Account Hash length: @account_hash_length', [
      '@api_token_length' => strlen($apiTokenValue ?: ''),
      '@account_id_length' => strlen($accountIdValue ?: ''),
      '@account_hash_length' => strlen($accountHashValue ?: ''),
    ]);
    
    if (empty($apiTokenValue) || empty($accountIdValue)) {
      throw new \InvalidArgumentException('Cloudflare API credentials are empty. Please check that your keys contain valid values.');
    }
    
    $this->apiToken = $apiTokenValue;
    $this->accountId = $accountIdValue;
    $this->accountHash = $accountHashValue;

    $zoneIdKeyId = $config->get('cloudflare_zone_id');
    if ($zoneIdKeyId) {
      $zoneIdKey = $this->keyRepository->getKey($zoneIdKeyId);
      $this->zoneId = $zoneIdKey ? $zoneIdKey->getKeyValue() : null;
    }

    $this->credentialsInitialized = true;
    
    $this->logger->info('Cloudflare credentials initialized successfully');
  }

  /**
   * Ensure credentials are initialized before API calls.
   */
  protected function ensureCredentials(): void {
    if (!$this->credentialsInitialized) {
      $this->initializeCredentials();
    }
  }

  /**
   * {@inheritdoc}
   */
  public function uploadImage(string $imageData, string $id = '', array $metadata = []): array {
    $this->ensureCredentials();
    $url = self::API_BASE_URL . "/accounts/{$this->accountId}/images/v1";
    
    $multipart = [
      [
        'name' => 'file',
        'contents' => $imageData,
        'filename' => $id ?: 'upload.jpg',
      ],
    ];
    
    if ($id) {
      $multipart[] = [
        'name' => 'id',
        'contents' => $id,
      ];
    }
    
    if (!empty($metadata)) {
      $multipart[] = [
        'name' => 'metadata',
        'contents' => json_encode($metadata),
      ];
    }
    
    try {
      $response = $this->httpClient->request('POST', $url, [
        RequestOptions::HEADERS => [
          'Authorization' => 'Bearer ' . $this->apiToken,
        ],
        RequestOptions::MULTIPART => $multipart,
        RequestOptions::TIMEOUT => 30,
      ]);
      
      $responseData = json_decode($response->getBody()->getContents(), TRUE);
      
      if (!$responseData['success']) {
        throw new \Exception('Upload failed: ' . json_encode($responseData['errors']));
      }
      
      return $responseData['result'];
    }
    catch (GuzzleException $e) {
      $this->logger->error('Cloudflare API upload error: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw new \Exception('Failed to upload image to Cloudflare: ' . $e->getMessage(), 0, $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function downloadImage(string $id): string {
    $this->ensureCredentials();
    $url = self::API_BASE_URL . "/accounts/{$this->accountId}/images/v1/{$id}/blob";

    try {
      $response = $this->httpClient->request('GET', $url, [
        RequestOptions::HEADERS => [
          'Authorization' => 'Bearer ' . $this->apiToken,
        ],
        RequestOptions::TIMEOUT => 30,
      ]);

      return $response->getBody()->getContents();
    }
    catch (GuzzleException $e) {
      $this->logger->error('Cloudflare API download error: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw new \Exception('Failed to download image from Cloudflare: ' . $e->getMessage(), 0, $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function deleteImage(string $id): bool {
    $this->ensureCredentials();
    $url = self::API_BASE_URL . "/accounts/{$this->accountId}/images/v1/{$id}";
    
    try {
      $response = $this->httpClient->request('DELETE', $url, [
        RequestOptions::HEADERS => [
          'Authorization' => 'Bearer ' . $this->apiToken,
        ],
        RequestOptions::TIMEOUT => 10,
      ]);
      
      $responseData = json_decode($response->getBody()->getContents(), TRUE);
      
      return $responseData['success'] ?? FALSE;
    }
    catch (GuzzleException $e) {
      $this->logger->error('Cloudflare API delete error: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw new \Exception('Failed to delete image from Cloudflare: ' . $e->getMessage(), 0, $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getImageMetadata(string $id): array {
    $this->ensureCredentials();
    
    if (empty($this->accountId)) {
      throw new \Exception('Account ID is not configured or empty');
    }
    
    $url = self::API_BASE_URL . "/accounts/{$this->accountId}/images/v1/{$id}";
    
    try {
      $response = $this->httpClient->request('GET', $url, [
        RequestOptions::HEADERS => [
          'Authorization' => 'Bearer ' . $this->apiToken,
        ],
        RequestOptions::TIMEOUT => 10,
      ]);
      
      $responseData = json_decode($response->getBody()->getContents(), TRUE);
      
      if (!$responseData['success']) {
        throw new \Exception('Failed to get metadata: ' . json_encode($responseData['errors']));
      }
      
      return $responseData['result'];
    }
    catch (GuzzleException $e) {
      $this->logger->error('Cloudflare API metadata error for image @id: @message', [
        '@id' => $id,
        '@message' => $e->getMessage(),
      ]);
      throw new \Exception('Failed to get image metadata from Cloudflare: ' . $e->getMessage(), 0, $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function listImages(int $page = 1, int $perPage = 100): array {
    $this->ensureCredentials();
    $url = self::API_BASE_URL . "/accounts/{$this->accountId}/images/v1";
    
    try {
      $response = $this->httpClient->request('GET', $url, [
        RequestOptions::HEADERS => [
          'Authorization' => 'Bearer ' . $this->apiToken,
        ],
        RequestOptions::QUERY => [
          'page' => $page,
          'per_page' => $perPage,
        ],
        RequestOptions::TIMEOUT => 15,
      ]);
      
      $responseData = json_decode($response->getBody()->getContents(), TRUE);
      
      if (!$responseData['success']) {
        throw new \Exception('Failed to list images: ' . json_encode($responseData['errors']));
      }
      
      return $responseData['result']['images'] ?? [];
    }
    catch (GuzzleException $e) {
      $this->logger->error('Cloudflare API list error: @message', [
        '@message' => $e->getMessage(),
      ]);
      throw new \Exception('Failed to list images from Cloudflare: ' . $e->getMessage(), 0, $e);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getImageUrl(string $id): string {
    $this->ensureCredentials();
    return self::DELIVERY_BASE_URL . "/{$this->accountHash}/{$id}";
  }

  /**
   * {@inheritdoc}
   */
  public function getImageVariantUrl(string $id, string $variant): string {
    $this->ensureCredentials();
    return self::DELIVERY_BASE_URL . "/{$this->accountHash}/{$id}/{$variant}";
  }

  /**
   * {@inheritdoc}
   */
  public function getTransformedImageUrl(string $id, array $transformations = []): string {
    $this->ensureCredentials();
    $baseUrl = self::DELIVERY_BASE_URL . "/{$this->accountHash}/{$id}";
    
    if (empty($transformations)) {
      return $baseUrl;
    }
    
    $params = [];
    
    // Width and height
    if (isset($transformations['width'])) {
      $params['w'] = (int) $transformations['width'];
    }
    if (isset($transformations['height'])) {
      $params['h'] = (int) $transformations['height'];
    }
    
    // Fit mode (scale-down, contain, cover, crop, pad)
    if (isset($transformations['fit'])) {
      $params['fit'] = $transformations['fit'];
    }
    
    // Quality (1-100)
    if (isset($transformations['quality'])) {
      $params['quality'] = max(1, min(100, (int) $transformations['quality']));
    }
    
    // Format (auto, webp, avif, png, jpeg)
    if (isset($transformations['format'])) {
      $params['format'] = $transformations['format'];
    }
    
    // Gravity for cropping
    if (isset($transformations['gravity'])) {
      $params['gravity'] = $transformations['gravity'];
    }
    
    // Build query string
    if (!empty($params)) {
      $baseUrl .= '?' . http_build_query($params);
    }
    
    return $baseUrl;
  }

  /**
   * {@inheritdoc}
   */
  public function testConnection(): bool {
    try {
      $this->ensureCredentials();
      
      $this->logger->info('Testing Cloudflare connection with Account ID: @account_id', [
        '@account_id' => $this->accountId ? substr($this->accountId, 0, 8) . '...' : 'EMPTY',
      ]);
      
      $url = self::API_BASE_URL . "/accounts/{$this->accountId}";
      
      $response = $this->httpClient->request('GET', $url, [
        RequestOptions::HEADERS => [
          'Authorization' => 'Bearer ' . $this->apiToken,
        ],
        RequestOptions::TIMEOUT => 10,
      ]);
      
      $responseData = json_decode($response->getBody()->getContents(), TRUE);
      
      $this->logger->info('Cloudflare API response: @response', [
        '@response' => json_encode($responseData),
      ]);
      
      return $responseData['success'] ?? FALSE;
    }
    catch (\Exception $e) {
      $this->logger->error('Cloudflare API connection test failed: @message', [
        '@message' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function purgeCache(string $id): bool {
    $this->ensureCredentials();
    try {
      $url = self::API_BASE_URL . "/zones/{$this->zoneId}/purge_cache";
      
      $response = $this->httpClient->request('POST', $url, [
        RequestOptions::HEADERS => [
          'Authorization' => 'Bearer ' . $this->apiToken,
          'Content-Type' => 'application/json',
        ],
        RequestOptions::JSON => [
          'files' => [$this->getImageUrl($id)],
        ],
        RequestOptions::TIMEOUT => 10,
      ]);
      
      $responseData = json_decode($response->getBody()->getContents(), TRUE);
      
      return $responseData['success'] ?? FALSE;
    }
    catch (\Exception $e) {
      $this->logger->warning('Cloudflare cache purge failed for @id: @message', [
        '@id' => $id,
        '@message' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

}