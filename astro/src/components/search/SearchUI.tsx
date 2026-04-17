/**
 * Search UI — React island using MeiliSearch + react-instantsearch.
 * Replaces the Algolia-based search from frontend/app/search/page.tsx.
 *
 * Key change: searchClient comes from @meilisearch/instant-meilisearch
 * instead of algoliasearch. The react-instantsearch components are identical.
 */
import {
  InstantSearch,
  SearchBox,
  Hits,
  RefinementList,
  Configure,
  Stats,
  Pagination,
  useInstantSearch,
} from "react-instantsearch";
import { searchClient, SEARCH_INDICES } from "../../lib/search";

const typeIcons: Record<string, string> = {
  herb: "🌿",
  modality: "🧘",
  condition: "🩺",
  practitioner: "👨‍⚕️",
  formula: "📜",
};

const typeColors: Record<string, string> = {
  herb: "bg-green-100 text-green-700 border-green-200",
  modality: "bg-purple-100 text-purple-700 border-purple-200",
  condition: "bg-blue-100 text-blue-700 border-blue-200",
  practitioner: "bg-amber-100 text-amber-700 border-amber-200",
  formula: "bg-earth-100 text-earth-700 border-earth-200",
};

function Hit({ hit }: { hit: any }) {
  const icon = typeIcons[hit.type] || "📄";
  const colorClass = typeColors[hit.type] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <a href={hit.url} className="block h-full">
      <article className="group bg-white dark:bg-earth-900 rounded-xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-earth-700 hover:border-sage-200 dark:hover:border-earth-600 transition-all h-full overflow-hidden">
        <div className="bg-gradient-to-br from-sage-50 to-earth-50 dark:from-earth-900 dark:to-earth-950 p-4 border-b border-gray-100 dark:border-earth-700">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-white dark:bg-earth-800 rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">{icon}</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border capitalize ${colorClass}`}>
              {hit.type}
            </span>
          </div>
        </div>
        <div className="p-5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-earth-100 mb-2 group-hover:text-earth-600 dark:group-hover:text-earth-400 transition-colors line-clamp-1">
            {hit.title || hit.name}
          </h2>
          {hit.scientific_name && <p className="text-sm italic text-sage-600 mb-2">{hit.scientific_name}</p>}
          {hit.common_names?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {hit.common_names.slice(0, 2).map((name: string, idx: number) => (
                <span key={idx} className="text-xs bg-sage-100 dark:bg-earth-800 text-gray-600 dark:text-earth-300 px-2 py-0.5 rounded">{name}</span>
              ))}
              {hit.common_names.length > 2 && <span className="text-xs text-gray-400">+{hit.common_names.length - 2}</span>}
            </div>
          )}
          {hit.description && <p className="text-sm text-gray-600 dark:text-earth-300 line-clamp-2">{hit.description}</p>}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-earth-700">
            <span className="text-sage-600 font-medium text-sm">View Details →</span>
          </div>
        </div>
      </article>
    </a>
  );
}

function EmptyQueryBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const { indexUiState } = useInstantSearch();
  return <>{indexUiState.query ? children : fallback}</>;
}

function NoResultsBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const { results } = useInstantSearch();
  return <>{!results.__isArtificial && results.nbHits === 0 ? fallback : children}</>;
}

interface SearchUIProps {
  initialQuery?: string;
}

export default function SearchUI({ initialQuery = "" }: SearchUIProps) {
  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={SEARCH_INDICES.ALL}
      initialUiState={{ [SEARCH_INDICES.ALL]: { query: initialQuery } }}
    >
      <Configure hitsPerPage={12} />

      <div className="mb-8">
        <div className="relative max-w-2xl">
          <SearchBox
            placeholder="Search for herbs, modalities, conditions..."
            classNames={{
              root: "relative",
              form: "relative",
              input: "w-full pl-12 pr-12 py-4 text-lg border-2 border-earth-200 dark:border-earth-600 rounded-xl focus:border-earth-500 focus:ring-2 focus:ring-earth-500/20 focus:outline-none transition bg-white dark:bg-earth-800 dark:text-earth-100 shadow-sm",
              submit: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400",
              submitIcon: "w-5 h-5",
              reset: "absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
              resetIcon: "w-5 h-5",
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1">
          <div className="bg-white dark:bg-earth-900 rounded-xl shadow-sm border border-gray-100 dark:border-earth-700 p-6 sticky top-24 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-earth-100 mb-3">Filter by Type</h3>
              <RefinementList attribute="type" classNames={{ list: "space-y-2", label: "flex items-center gap-3 cursor-pointer hover:bg-sage-50 dark:hover:bg-earth-800 p-2 rounded-lg transition", checkbox: "w-4 h-4 rounded", labelText: "text-gray-700 dark:text-earth-200 capitalize flex-1 text-sm", count: "text-xs bg-gray-100 dark:bg-earth-800 text-gray-600 dark:text-earth-400 px-2 py-0.5 rounded-full" }} />
            </div>
            <div className="pt-6 border-t border-gray-100 dark:border-earth-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-earth-200 uppercase tracking-wide mb-3">TCM Temperature</h3>
              <RefinementList attribute="tcm_temperature" classNames={{ list: "space-y-1", label: "flex items-center gap-3 cursor-pointer hover:bg-sage-50 dark:hover:bg-earth-800 p-2 rounded-lg transition text-sm", checkbox: "w-4 h-4 rounded", labelText: "text-gray-700 dark:text-earth-200 capitalize flex-1", count: "text-xs bg-gray-100 dark:bg-earth-800 px-2 py-0.5 rounded-full", noResults: "hidden" }} />
            </div>
            <div className="pt-6 border-t border-gray-100 dark:border-earth-700">
              <h3 className="text-sm font-bold text-gray-700 dark:text-earth-200 uppercase tracking-wide mb-3">TCM Taste</h3>
              <RefinementList attribute="tcm_taste" classNames={{ list: "space-y-1", label: "flex items-center gap-3 cursor-pointer hover:bg-sage-50 dark:hover:bg-earth-800 p-2 rounded-lg transition text-sm", checkbox: "w-4 h-4 rounded", labelText: "text-gray-700 dark:text-earth-200 capitalize flex-1", count: "text-xs bg-gray-100 dark:bg-earth-800 px-2 py-0.5 rounded-full", noResults: "hidden" }} />
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          <EmptyQueryBoundary
            fallback={
              <div className="bg-gradient-to-br from-sage-50 to-earth-50 dark:from-earth-900 dark:to-earth-950 rounded-2xl p-12 text-center border border-sage-200 dark:border-earth-700">
                <div className="text-6xl mb-6">🔍</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-3">Start Your Search</h2>
                <p className="text-gray-600 dark:text-earth-300 max-w-md mx-auto">Enter keywords above to search our database.</p>
              </div>
            }
          >
            <NoResultsBoundary
              fallback={
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-earth-900 dark:to-earth-950 rounded-2xl p-12 text-center border border-yellow-200 dark:border-earth-700">
                  <div className="text-6xl mb-6">🤔</div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-earth-100 mb-3">No Results Found</h2>
                  <p className="text-gray-600 dark:text-earth-300">Try different keywords or browse our categories.</p>
                </div>
              }
            >
              <div className="flex items-center justify-between mb-6">
                <Stats classNames={{ root: "text-sm text-gray-600 dark:text-earth-300" }} />
              </div>
              <Hits hitComponent={Hit} classNames={{ list: "grid md:grid-cols-2 xl:grid-cols-3 gap-6" }} />
              <div className="mt-8 flex justify-center">
                <Pagination classNames={{ list: "flex items-center gap-1", link: "px-4 py-2 rounded-lg text-gray-700 dark:text-earth-200 hover:bg-sage-100 dark:hover:bg-earth-800 transition", disabledItem: "opacity-50 cursor-not-allowed" }} />
              </div>
            </NoResultsBoundary>
          </EmptyQueryBoundary>
        </div>
      </div>
    </InstantSearch>
  );
}
