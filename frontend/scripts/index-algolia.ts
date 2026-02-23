#!/usr/bin/env npx ts-node

/**
 * Algolia Indexing Script
 *
 * Fetches content from Drupal JSON:API and indexes it to Algolia.
 *
 * Usage: npm run index-algolia
 *
 * Required env vars:
 *   NEXT_PUBLIC_ALGOLIA_APP_ID
 *   ALGOLIA_ADMIN_API_KEY
 *   NEXT_PUBLIC_DRUPAL_BASE_URL (defaults to https://backend.ddev.site)
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY;
const DRUPAL_BASE_URL = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || 'https://backend.ddev.site';

// Index names
const INDICES = {
  herbs: 'verscienta_herbs',
  modalities: 'verscienta_modalities',
  conditions: 'verscienta_conditions',
  practitioners: 'verscienta_practitioners',
  formulas: 'verscienta_formulas',
  all: 'verscienta_all',
};

interface AlgoliaRecord {
  objectID: string;
  type: string;
  title: string;
  url: string;
  [key: string]: any;
}

// Validate environment
function validateEnv(): boolean {
  if (!ALGOLIA_APP_ID) {
    console.error('❌ Missing NEXT_PUBLIC_ALGOLIA_APP_ID in .env.local');
    return false;
  }
  if (!ALGOLIA_ADMIN_KEY) {
    console.error('❌ Missing ALGOLIA_ADMIN_API_KEY in .env.local');
    console.error('   (This is different from the search-only key)');
    return false;
  }
  return true;
}

// Fetch from Drupal JSON:API
async function fetchFromDrupal(endpoint: string): Promise<any[]> {
  const url = `${DRUPAL_BASE_URL}/jsonapi/${endpoint}?filter[status]=1&page[limit]=100`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      console.warn(`  ⚠️  Failed to fetch ${endpoint}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.warn(`  ⚠️  Error fetching ${endpoint}:`, error);
    return [];
  }
}

// Transform Drupal herb to Algolia record
function transformHerb(node: any): AlgoliaRecord {
  return {
    objectID: node.id,
    type: 'herb',
    title: node.attributes?.title || '',
    scientific_name: node.attributes?.field_scientific_name || '',
    common_names: node.attributes?.field_common_names?.split('\n').filter(Boolean) || [],
    description: node.attributes?.body?.summary || node.attributes?.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
    therapeutic_uses: node.attributes?.field_therapeutic_uses || '',
    contraindications: node.attributes?.field_contraindications || '',
    temperature: node.attributes?.field_temperature || '',
    flavor_profile: node.attributes?.field_flavor_profile || '',
    parts_used: node.attributes?.field_parts_used || '',
    url: `/herbs/${node.id}`,
    // TCM enrichment fields
    herb_latin_name: node.attributes?.field_herb_latin_name || '',
    herb_pinyin_name: node.attributes?.field_herb_pinyin_name || '',
    tcm_taste: node.attributes?.field_tcm_properties?.field_tcm_taste || [],
    tcm_temperature: node.attributes?.field_tcm_properties?.field_tcm_temperature || '',
    tcm_meridians: node.attributes?.field_tcm_properties?.field_tcm_meridians || [],
    source_dbs: node.attributes?.field_herb_source_dbs || [],
  };
}

// Transform Drupal modality to Algolia record
function transformModality(node: any): AlgoliaRecord {
  return {
    objectID: node.id,
    type: 'modality',
    title: node.attributes?.title || '',
    description: node.attributes?.body?.summary || node.attributes?.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
    excels_at: node.attributes?.field_excels_at || [],
    benefits: node.attributes?.field_key_benefits || '',
    origin: node.attributes?.field_origin_region || '',
    url: `/modalities/${node.id}`,
  };
}

// Transform Drupal condition to Algolia record
function transformCondition(node: any): AlgoliaRecord {
  return {
    objectID: node.id,
    type: 'condition',
    title: node.attributes?.title || '',
    description: node.attributes?.body?.summary || node.attributes?.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
    symptoms: node.attributes?.field_symptoms_list?.split('\n').filter(Boolean) || [],
    severity: node.attributes?.field_severity_level || '',
    duration: node.attributes?.field_condition_duration || '',
    url: `/conditions/${node.id}`,
  };
}

// Transform Drupal practitioner to Algolia record
function transformPractitioner(node: any): AlgoliaRecord {
  const city = node.attributes?.field_city || '';
  const state = node.attributes?.field_state || '';
  const location = [city, state].filter(Boolean).join(', ');

  return {
    objectID: node.id,
    type: 'practitioner',
    title: node.attributes?.title || '',
    name: node.attributes?.title || '',
    credentials: node.attributes?.field_credentials || '',
    practice_type: node.attributes?.field_practice_type || '',
    location: location,
    city: city,
    state: state,
    accepting_patients: node.attributes?.field_accepting_patients || false,
    offers_telehealth: node.attributes?.field_offers_telehealth || false,
    bio: node.attributes?.field_bio?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
    latitude: node.attributes?.field_latitude || null,
    longitude: node.attributes?.field_longitude || null,
    url: `/practitioners/${node.id}`,
  };
}

// Transform Drupal formula to Algolia record
function transformFormula(node: any): AlgoliaRecord {
  return {
    objectID: node.id,
    type: 'formula',
    title: node.attributes?.title || '',
    pinyin_name: node.attributes?.field_pinyin_name || '',
    chinese_name: node.attributes?.field_chinese_name || '',
    description: node.attributes?.body?.summary || node.attributes?.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 300) || '',
    actions: node.attributes?.field_formula_actions || '',
    indications: node.attributes?.field_formula_indications || '',
    classic_source: node.attributes?.field_classic_source || '',
    url: `/formulas/${node.id}`,
  };
}

// Push records to Algolia
async function pushToAlgolia(indexName: string, records: AlgoliaRecord[]): Promise<boolean> {
  if (records.length === 0) {
    console.log(`  ⏭️  No records to index for ${indexName}`);
    return true;
  }

  const url = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${indexName}/batch`;

  const body = {
    requests: records.map(record => ({
      action: 'updateObject',
      body: record,
    })),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_ADMIN_KEY!,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ Failed to index ${indexName}: ${error}`);
      return false;
    }

    console.log(`  ✅ Indexed ${records.length} records to ${indexName}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error indexing ${indexName}:`, error);
    return false;
  }
}

// Configure index settings
async function configureIndex(indexName: string, settings: any): Promise<void> {
  const url = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${indexName}/settings`;

  try {
    await fetch(url, {
      method: 'PUT',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_ADMIN_KEY!,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
  } catch (error) {
    console.warn(`  ⚠️  Could not configure ${indexName} settings`);
  }
}

// Main indexing function
async function indexAll(): Promise<void> {
  console.log('🔍 Algolia Indexing Script');
  console.log('==========================\n');

  if (!validateEnv()) {
    process.exit(1);
  }

  console.log(`📡 Drupal API: ${DRUPAL_BASE_URL}`);
  console.log(`🔎 Algolia App: ${ALGOLIA_APP_ID}\n`);

  const allRecords: AlgoliaRecord[] = [];

  // Index Herbs
  console.log('🌿 Indexing Herbs...');
  const herbs = await fetchFromDrupal('node/herb');
  const herbRecords = herbs.map(transformHerb);
  await pushToAlgolia(INDICES.herbs, herbRecords);
  allRecords.push(...herbRecords);

  // Index Modalities
  console.log('\n🧘 Indexing Modalities...');
  const modalities = await fetchFromDrupal('node/modality');
  const modalityRecords = modalities.map(transformModality);
  await pushToAlgolia(INDICES.modalities, modalityRecords);
  allRecords.push(...modalityRecords);

  // Index Conditions
  console.log('\n🩺 Indexing Conditions...');
  const conditions = await fetchFromDrupal('node/condition');
  const conditionRecords = conditions.map(transformCondition);
  await pushToAlgolia(INDICES.conditions, conditionRecords);
  allRecords.push(...conditionRecords);

  // Index Practitioners
  console.log('\n👨‍⚕️ Indexing Practitioners...');
  const practitioners = await fetchFromDrupal('node/practitioner');
  const practitionerRecords = practitioners.map(transformPractitioner);
  await pushToAlgolia(INDICES.practitioners, practitionerRecords);
  allRecords.push(...practitionerRecords);

  // Index Formulas
  console.log('\n📜 Indexing Formulas...');
  const formulas = await fetchFromDrupal('node/formula');
  const formulaRecords = formulas.map(transformFormula);
  await pushToAlgolia(INDICES.formulas, formulaRecords);
  allRecords.push(...formulaRecords);

  // Index All (combined)
  console.log('\n📚 Indexing Combined Index...');
  await pushToAlgolia(INDICES.all, allRecords);

  // Configure index settings
  console.log('\n⚙️  Configuring index settings...');

  const baseSettings = {
    searchableAttributes: ['title', 'name', 'description', 'scientific_name', 'common_names'],
    attributesForFaceting: [
      'type',
      'filterOnly(type)',
      'tcm_temperature',
      'tcm_taste',
      'tcm_meridians',
      'source_dbs',
    ],
    customRanking: ['desc(title)'],
  };

  await configureIndex(INDICES.all, {
    ...baseSettings,
    searchableAttributes: [
      'title', 'name', 'description', 'scientific_name',
      'common_names', 'symptoms', 'excels_at', 'actions',
      'indications', 'therapeutic_uses', 'credentials', 'location',
      'herb_latin_name', 'herb_pinyin_name', 'tcm_taste',
      'tcm_temperature', 'tcm_meridians',
    ],
  });

  console.log('\n✨ Indexing complete!');
  console.log(`   Total records indexed: ${allRecords.length}`);
}

// Run the script
indexAll().catch(console.error);
