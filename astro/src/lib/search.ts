/**
 * MeiliSearch Client
 *
 * Replaces frontend/lib/algolia.ts.
 * Provides both a direct MeiliSearch client and an InstantSearch adapter.
 *
 * Frontend usage:
 *   import { searchClient, SEARCH_INDICES } from '@/lib/search';
 *   <InstantSearch searchClient={searchClient} indexName={SEARCH_INDICES.ALL}>
 */

import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";

const MEILI_URL = import.meta.env.PUBLIC_MEILI_URL || "http://localhost:7700";
const MEILI_SEARCH_KEY = import.meta.env.PUBLIC_MEILI_SEARCH_KEY || "";

/**
 * InstantSearch-compatible client (drop-in replacement for Algolia searchClient)
 * Works with react-instantsearch components: SearchBox, Hits, RefinementList, etc.
 */
export const { searchClient, setMeiliSearchParams } = instantMeiliSearch(MEILI_URL, MEILI_SEARCH_KEY, {
  placeholderSearch: false,
  primaryKey: "id",
});

/**
 * Index names (matches MeiliSearch setup)
 */
export const SEARCH_INDICES = {
  HERBS: "verscienta_herbs",
  MODALITIES: "verscienta_modalities",
  CONDITIONS: "verscienta_conditions",
  PRACTITIONERS: "verscienta_practitioners",
  FORMULAS: "verscienta_formulas",
  ALL: "verscienta_all",
} as const;

/**
 * Type definitions for search results
 * (Same interfaces as the old Algolia types)
 */
export interface SearchHerb {
  id: number;
  title: string;
  scientific_name?: string;
  common_names?: string[];
  therapeutic_uses?: string;
  type: "herb";
  url: string;
  latin_name?: string;
  pinyin_name?: string;
  tcm_taste?: string[];
  tcm_temperature?: string;
  tcm_meridians?: string[];
  source_databases?: string[];
}

export interface SearchModality {
  id: number;
  title: string;
  excels_at?: string[];
  benefits?: string;
  description?: string;
  type: "modality";
  url: string;
}

export interface SearchCondition {
  id: number;
  title: string;
  symptoms?: string[];
  severity?: string;
  description?: string;
  type: "condition";
  url: string;
}

export interface SearchPractitioner {
  id: number;
  title: string;
  name: string;
  practice_type?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  type: "practitioner";
  url: string;
}

export interface SearchFormula {
  id: number;
  title: string;
  chinese_name?: string;
  pinyin_name?: string;
  description?: string;
  use_cases?: string[];
  classic_source?: string;
  type: "formula";
  url: string;
}

export type SearchResult = SearchHerb | SearchModality | SearchCondition | SearchPractitioner | SearchFormula;
