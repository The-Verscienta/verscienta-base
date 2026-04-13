import { algoliasearch, SearchClient } from 'algoliasearch';

// Initialize Algolia client only if credentials are available
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

// Create a mock search client when credentials are missing
const createMockSearchClient = (): SearchClient => ({
  search: async () => ({ results: [] }),
  searchForFacetValues: async () => ({ facetHits: [] }),
} as unknown as SearchClient);

export const searchClient: SearchClient = appId && apiKey
  ? algoliasearch(appId, apiKey)
  : createMockSearchClient();

// Index names
export const ALGOLIA_INDICES = {
  HERBS: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_HERBS || 'verscienta_herbs',
  MODALITIES: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_MODALITIES || 'verscienta_modalities',
  CONDITIONS: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_CONDITIONS || 'verscienta_conditions',
  PRACTITIONERS: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_PRACTITIONERS || 'verscienta_practitioners',
  FORMULAS: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_FORMULAS || 'verscienta_formulas',
} as const;

// Combined search across all indices
export const ALGOLIA_INDEX_ALL = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_ALL || 'verscienta_all';

// Type definitions for Algolia records
export interface AlgoliaHerb {
  objectID: string;
  title: string;
  scientific_name?: string;
  common_names?: string[];
  therapeutic_uses?: string;
  contraindications?: string;
  type: 'herb';
  url: string;
  // TCM enrichment fields
  herb_latin_name?: string;
  herb_pinyin_name?: string;
  tcm_taste?: string[];
  tcm_temperature?: string;
  tcm_meridians?: string[];
  ingredient_count?: number;
  target_count?: number;
  source_dbs?: string[];
}

export interface AlgoliaModality {
  objectID: string;
  title: string;
  excels_at?: string[];
  benefits?: string;
  description?: string;
  type: 'modality';
  url: string;
}

export interface AlgoliaCondition {
  objectID: string;
  title: string;
  symptoms?: string[];
  severity?: string;
  description?: string;
  type: 'condition';
  url: string;
}

export interface AlgoliaPractitioner {
  objectID: string;
  name: string;
  practice_type?: string;
  modalities?: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
  type: 'practitioner';
  url: string;
}

export interface AlgoliaFormula {
  objectID: string;
  title: string;
  description?: string;
  herb_names?: string[];
  use_cases?: string[];
  condition_names?: string[];
  total_weight?: number;
  weight_unit?: string;
  num_herbs?: number;
  type: 'formula';
  url: string;
}

export type AlgoliaRecord = AlgoliaHerb | AlgoliaModality | AlgoliaCondition | AlgoliaPractitioner | AlgoliaFormula;
