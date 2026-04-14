# Algolia Search Setup Guide

This guide explains how to set up Algolia search for Verscienta Health.

## Prerequisites

1. **Algolia Account**: Sign up at https://www.algolia.com/
2. **Get API Credentials**:
   - Application ID
   - Admin API Key (for indexing)
   - Search-Only API Key (for frontend)

## 1. Environment Variables

Add to `frontend/.env.local`:

```bash
# Algolia Search
NEXT_PUBLIC_ALGOLIA_APP_ID=your-app-id
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your-search-only-api-key
ALGOLIA_ADMIN_API_KEY=your-admin-api-key

# Index names (optional, will use defaults)
NEXT_PUBLIC_ALGOLIA_INDEX_HERBS=verscienta_herbs
NEXT_PUBLIC_ALGOLIA_INDEX_MODALITIES=verscienta_modalities
NEXT_PUBLIC_ALGOLIA_INDEX_CONDITIONS=verscienta_conditions
NEXT_PUBLIC_ALGOLIA_INDEX_PRACTITIONERS=verscienta_practitioners
NEXT_PUBLIC_ALGOLIA_INDEX_ALL=verscienta_all
```

## 2. Install Algolia Dependencies

Already added to package.json:

```bash
cd frontend
npm install
```

Installs:
- `algoliasearch` v5.0.0 - Algolia JavaScript client
- `react-instantsearch` v7.0.0 - React components for search UI

## 3. Create Algolia Indices

### Option A: Via Algolia Dashboard
1. Go to https://www.algolia.com/apps/[YOUR_APP_ID]/indices
2. Create indices:
   - `verscienta_herbs`
   - `verscienta_modalities`
   - `verscienta_conditions`
   - `verscienta_practitioners`
   - `verscienta_all` (combined index)

### Option B: Via API (Programmatic)
Run the initialization script:

```bash
cd frontend
npm run algolia:init
```

## 4. Configure Index Settings

### Searchable Attributes (Priority)

**Herbs Index:**
```json
{
  "searchableAttributes": [
    "title",
    "scientific_name",
    "common_names",
    "therapeutic_uses",
    "contraindications"
  ]
}
```

**Modalities Index:**
```json
{
  "searchableAttributes": [
    "title",
    "excels_at",
    "benefits",
    "description"
  ]
}
```

**Practitioners Index:**
```json
{
  "searchableAttributes": [
    "name",
    "modalities",
    "location",
    "practice_type"
  ]
}
```

### Facets for Filtering

**All Indices:**
```json
{
  "attributesForFaceting": [
    "type",
    "searchable(common_names)",
    "searchable(modalities)",
    "practice_type",
    "severity"
  ]
}
```

### Geo-Search (Practitioners)

```json
{
  "_geoloc": {
    "lat": "latitude",
    "lng": "longitude"
  }
}
```

## 5. Drupal Integration (Backend)

### Install Drupal Search API Algolia Module

```bash
cd backend
composer require drupal/search_api_algolia
ddev exec drush en search_api search_api_algolia -y
```

### Configure Search API

1. Go to `/admin/config/search/search-api`
2. Add Server:
   - **Name**: Algolia
   - **Backend**: Algolia
   - **Application ID**: [Your App ID]
   - **Admin API Key**: [Your Admin Key]

3. Create Indexes:
   - Herbs Index → `verscienta_herbs`
   - Modalities Index → `verscienta_modalities`
   - Conditions Index → `verscienta_conditions`
   - Practitioners Index → `verscienta_practitioners`

4. Configure Fields to Index:
   - Select which fields to send to Algolia
   - Map field names to Algolia attributes

### Alternative: Custom Module Hook

If not using Search API module, create custom hook in `holistic_hub` module:

```php
<?php
// backend/web/modules/custom/holistic_hub/holistic_hub.module

use Algolia\AlgoliaSearch\SearchClient;

/**
 * Implements hook_entity_insert().
 */
function holistic_hub_entity_insert(EntityInterface $entity) {
  holistic_hub_sync_to_algolia($entity);
}

/**
 * Implements hook_entity_update().
 */
function holistic_hub_entity_update(EntityInterface $entity) {
  holistic_hub_sync_to_algolia($entity);
}

/**
 * Implements hook_entity_delete().
 */
function holistic_hub_entity_delete(EntityInterface $entity) {
  holistic_hub_delete_from_algolia($entity);
}

/**
 * Sync entity to Algolia.
 */
function holistic_hub_sync_to_algolia(EntityInterface $entity) {
  // Only sync supported content types
  $supported_types = ['herb', 'modality', 'condition', 'practitioner'];

  if (!in_array($entity->bundle(), $supported_types)) {
    return;
  }

  $config = \Drupal::config('holistic_hub.settings');
  $app_id = $config->get('algolia_app_id');
  $admin_key = $config->get('algolia_admin_key');

  if (empty($app_id) || empty($admin_key)) {
    \Drupal::logger('holistic_hub')->warning('Algolia credentials not configured.');
    return;
  }

  try {
    $client = SearchClient::create($app_id, $admin_key);

    // Get appropriate index
    $index_name = 'verscienta_' . $entity->bundle() . 's';
    $index = $client->initIndex($index_name);

    // Build record
    $record = [
      'objectID' => $entity->uuid(),
      'title' => $entity->label(),
      'type' => $entity->bundle(),
      'url' => $entity->toUrl()->setAbsolute()->toString(),
    ];

    // Add type-specific fields
    switch ($entity->bundle()) {
      case 'herb':
        if ($entity->hasField('field_scientific_name')) {
          $record['scientific_name'] = $entity->get('field_scientific_name')->value;
        }
        if ($entity->hasField('field_common_names')) {
          $record['common_names'] = array_column($entity->get('field_common_names')->getValue(), 'value');
        }
        break;

      case 'modality':
        if ($entity->hasField('field_excels_at')) {
          $record['excels_at'] = array_column($entity->get('field_excels_at')->getValue(), 'value');
        }
        break;

      case 'practitioner':
        if ($entity->hasField('field_practice_type')) {
          $record['practice_type'] = $entity->get('field_practice_type')->value;
        }
        if ($entity->hasField('field_latitude') && $entity->hasField('field_longitude')) {
          $record['_geoloc'] = [
            'lat' => (float) $entity->get('field_latitude')->value,
            'lng' => (float) $entity->get('field_longitude')->value,
          ];
        }
        break;
    }

    // Save to Algolia
    $index->saveObject($record);

    \Drupal::logger('holistic_hub')->info('Synced @type @title to Algolia', [
      '@type' => $entity->bundle(),
      '@title' => $entity->label(),
    ]);

  } catch (\Exception $e) {
    \Drupal::logger('holistic_hub')->error('Failed to sync to Algolia: @message', [
      '@message' => $e->getMessage(),
    ]);
  }
}

/**
 * Delete entity from Algolia.
 */
function holistic_hub_delete_from_algolia(EntityInterface $entity) {
  $supported_types = ['herb', 'modality', 'condition', 'practitioner'];

  if (!in_array($entity->bundle(), $supported_types)) {
    return;
  }

  $config = \Drupal::config('holistic_hub.settings');
  $app_id = $config->get('algolia_app_id');
  $admin_key = $config->get('algolia_admin_key');

  if (empty($app_id) || empty($admin_key)) {
    return;
  }

  try {
    $client = SearchClient::create($app_id, $admin_key);
    $index_name = 'verscienta_' . $entity->bundle() . 's';
    $index = $client->initIndex($index_name);
    $index->deleteObject($entity->uuid());
  } catch (\Exception $e) {
    \Drupal::logger('holistic_hub')->error('Failed to delete from Algolia: @message', [
      '@message' => $e->getMessage(),
    ]);
  }
}
```

Add Algolia PHP SDK to Drupal:

```bash
cd backend
composer require algolia/algoliasearch-client-php
```

## 6. Initial Data Import

### Option A: Bulk Import Script

Create `frontend/scripts/algolia-import.ts`:

```typescript
// Run with: npm run algolia:import
```

See implementation in next section.

### Option B: Manual Index via Drupal

```bash
ddev exec drush search-api:index
```

## 7. Test the Integration

### Test Search

```bash
curl -X POST \
  -H "X-Algolia-Application-Id: YOUR_APP_ID" \
  -H "X-Algolia-API-Key: YOUR_SEARCH_KEY" \
  "https://YOUR_APP_ID-dsn.algolia.net/1/indexes/verscienta_herbs/query" \
  -d '{"query":"turmeric"}'
```

### Test from Frontend

Navigate to http://localhost:3000/search and try searching.

## 8. Monitoring & Analytics

1. Go to Algolia Dashboard → Analytics
2. Monitor:
   - Search queries
   - Click-through rates
   - Conversion tracking
   - Performance metrics

## 9. Best Practices

### Replica Indices (for Sorting)

Create replicas for different sorting:
- `verscienta_herbs_name_asc`
- `verscienta_herbs_name_desc`
- `verscienta_practitioners_distance` (geo-sorted)

### Synonyms

Add common synonyms:
- "turmeric" → "curcuma longa"
- "acupuncture" → "needle therapy"

### Stop Words

Configure language-specific stop words for better relevance.

### Query Rules

Set up rules for:
- Featured results
- Banners
- Redirects
- Custom ranking

## Troubleshooting

**No results appearing:**
- Check API keys in .env
- Verify indices exist in Algolia dashboard
- Check browser console for errors

**Drupal not syncing:**
- Check Drupal logs: `ddev exec drush watchdog:show`
- Verify Algolia credentials in Drupal config
- Test manually with `drush search-api:index`

**Geo-search not working:**
- Ensure latitude/longitude fields exist
- Verify `_geoloc` format: `{lat: number, lng: number}`

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ⬜ Create Algolia indices
4. ⬜ Set up Drupal integration
5. ⬜ Import initial data
6. ⬜ Test search functionality
7. ⬜ Configure advanced features (synonyms, rules)
