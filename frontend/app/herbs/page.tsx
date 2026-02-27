import { drupal } from '@/lib/drupal';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ServerPagination, PaginationInfo } from '@/components/ui/ServerPagination';
import {
  PageWrapper,
  LeafPattern,
  BotanicalDivider,
  Tag,
  EmptyState,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';

// ISR: revalidate every 5 minutes
export const revalidate = 300;

const SORT_OPTIONS = [
  { value: 'title', label: 'Name (A-Z)' },
  { value: '-title', label: 'Name (Z-A)' },
  { value: '-created', label: 'Newest First' },
  { value: 'created', label: 'Oldest First' },
];

const PAGE_SIZE = 12;

export const metadata = {
  title: 'Medicinal Herbs Database - Verscienta Health',
  description: 'Explore our comprehensive collection of medicinal herbs, their therapeutic uses, benefits, and safety information.',
};

import { popularityMap, getFieldConfig } from '@/lib/decision-field-maps';

interface Herb {
  id: string;
  type: string;
  title?: string;
  attributes?: {
    title: string;
    field_scientific_name?: string;
    field_common_names?: string[];
    body?: {
      value: string;
      summary?: string;
    };
  };
  field_scientific_name?: string;
  field_common_names?: string[];
  field_primary_actions?: string[];
  field_tcm_temperature?: string;
  field_popularity?: string;
  field_beginner_friendly?: boolean;
  field_editors_pick?: boolean;
  field_images?: Array<{
    id: string;
    type: string;
    uri?: { url: string; value?: string };
    url?: string;
    filename?: string;
    meta?: { alt?: string; title?: string; width?: number; height?: number };
  }>;
  body?: {
    value: string;
    summary?: string;
    processed?: string;
  };
}

interface HerbsResult {
  herbs: Herb[];
  total: number;
}

async function getHerbs(sort: string = 'title', page: number = 1): Promise<HerbsResult> {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const herbs = await drupal.getResourceCollection<Herb[]>('node--herb', {
      params: {
        'sort': sort,
        'page[limit]': PAGE_SIZE,
        'page[offset]': offset,
        'filter[status]': 1,
        'include': 'field_images',
      },
    });

    // Get total count (fetch all IDs only for counting)
    const allHerbs = await drupal.getResourceCollection<Herb[]>('node--herb', {
      params: {
        'filter[status]': 1,
        'fields[node--herb]': 'id',
        'page[limit]': 500,
      },
    });

    return {
      herbs: herbs || [],
      total: allHerbs?.length || 0,
    };
  } catch (error) {
    console.error('Failed to fetch herbs:', error);
    return { herbs: [], total: 0 };
  }
}

// Helper to get herb data (handles both normalized and unnormalized responses)
function getHerbData(herb: Herb) {
  return {
    id: herb.id,
    title: herb.title || herb.attributes?.title || 'Unnamed Herb',
    scientificName: herb.field_scientific_name || herb.attributes?.field_scientific_name,
    commonNames: herb.field_common_names || herb.attributes?.field_common_names || [],
    primaryActions: herb.field_primary_actions || [],
    tcmTemperature: herb.field_tcm_temperature,
    popularity: herb.field_popularity,
    beginnerFriendly: herb.field_beginner_friendly,
    editorsPick: herb.field_editors_pick,
    summary: herb.body?.summary || herb.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 150) ||
             herb.attributes?.body?.summary,
    imageUrl: herb.field_images?.[0]?.uri?.url || herb.field_images?.[0]?.url || null,
    imageAlt: herb.field_images?.[0]?.meta?.alt || herb.field_images?.[0]?.filename || null,
  };
}

// Temperature styling for TCM energy
const temperatureStyles: Record<string, { variant: 'earth' | 'sage' | 'gold' | 'warm' | 'muted'; label: string }> = {
  hot: { variant: 'warm', label: 'Hot' },
  warm: { variant: 'gold', label: 'Warm' },
  neutral: { variant: 'muted', label: 'Neutral' },
  cool: { variant: 'sage', label: 'Cool' },
  cold: { variant: 'earth', label: 'Cold' },
};

// Decorative botanical card icon
function HerbIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <circle cx="24" cy="24" r="20" fill="url(#herbGrad)" opacity="0.1" />
      <path
        d="M24 8c-4 8-12 12-12 20a12 12 0 0024 0c0-8-8-12-12-20z"
        fill="url(#herbGrad)"
        opacity="0.3"
      />
      <path
        d="M24 12v24M20 18c2 2 4 4 4 8M28 18c-2 2-4 4-4 8"
        stroke="url(#herbGrad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="herbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a7c59" />
          <stop offset="100%" stopColor="#6b8f71" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function HerbsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || 'title';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const { herbs, total } = await getHerbs(sort, currentPage);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Count unique characteristics for filter display
  const temperatureCounts: Record<string, number> = {};

  herbs.forEach(herb => {
    const data = getHerbData(herb);
    if (data.tcmTemperature) {
      temperatureCounts[data.tcmTemperature] = (temperatureCounts[data.tcmTemperature] || 0) + 1;
    }
  });

  return (
    <PageWrapper>
      {/* Hero Section with Botanical Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 dark:from-earth-950 dark:via-sage-950 dark:to-earth-900 border-b border-earth-200/50 dark:border-earth-700/50">
        <LeafPattern opacity={0.04} />

        {/* Decorative blurred circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-sage-300/20 dark:bg-sage-800/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-earth-300/15 dark:bg-earth-800/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Herbs' },
            ]}
            className="mb-8"
          />

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sage-500 to-earth-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <span className="text-sage-600 dark:text-sage-400 font-medium tracking-wide uppercase text-sm">
                  Botanical Collection
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-earth-100 mb-4 leading-tight">
                Medicinal Herbs
              </h1>

              <p className="text-lg md:text-xl text-gray-600 dark:text-earth-300 leading-relaxed">
                Discover the healing wisdom of nature through our carefully curated
                database of traditional and evidence-based herbal remedies.
              </p>

              {/* TCM Temperature Legend */}
              {Object.keys(temperatureCounts).length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-sage-600 dark:text-sage-400 font-medium mr-1">TCM Energy:</span>
                  {Object.entries(temperatureCounts).map(([temp, count]) => {
                    const style = temperatureStyles[temp.toLowerCase()] || { variant: 'muted' as const, label: temp };
                    return (
                      <Tag key={temp} variant={style.variant} size="sm">
                        {style.label} ({count})
                      </Tag>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sort & Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/60 dark:bg-earth-900/60 backdrop-blur-sm rounded-xl p-4 border border-earth-200/50 dark:border-earth-700/50 shadow-sm">
              <SortDropdown options={SORT_OPTIONS} defaultValue="title" />
              <div className="hidden sm:block w-px h-8 bg-earth-200" />
              <PaginationInfo
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                totalItems={total}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {herbs.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            title="No Herbs Found"
            description="Our botanical library is being cultivated. Check back soon as we add more herbal wisdom to our collection."
            action={
              <a
                href="https://backend.ddev.site/node/add/herb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-earth-600 to-sage-600 hover:from-earth-700 hover:to-sage-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Add Herbs
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </a>
            }
          />
        ) : (
          <>
            {/* Editor's Picks */}
            {(() => {
              const picks = herbs.filter(h => getHerbData(h).editorsPick);
              return picks.length > 0 ? (
                <div className="mb-12">
                  <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-6 flex items-center gap-2">
                    <span className="text-amber-500">&#9733;</span> Editor&apos;s Picks
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {picks.map((herb) => {
                      const data = getHerbData(herb);
                      return (
                        <Link
                          key={herb.id}
                          href={`/herbs/${herb.id}`}
                          className="group relative bg-gradient-to-br from-amber-50 via-cream-50 to-sage-50 dark:from-amber-950/20 dark:via-earth-900 dark:to-sage-950 rounded-2xl shadow-sm hover:shadow-xl border-2 border-amber-200 hover:border-amber-300 dark:border-amber-800 dark:hover:border-amber-700 transition-all duration-300 overflow-hidden p-6"
                        >
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200">
                              &#9733; Pick
                            </span>
                          </div>
                          <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-earth-100 mb-1 group-hover:text-sage-700 transition-colors">{data.title}</h3>
                          {data.scientificName && <p className="text-sm italic text-sage-600 dark:text-sage-400 mb-2">{data.scientificName}</p>}
                          {data.summary && <p className="text-sm text-gray-600 dark:text-earth-300 line-clamp-2">{data.summary}...</p>}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {data.popularity && (() => { const c = getFieldConfig(popularityMap, data.popularity); return c ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                            ) : null; })()}
                            {data.beginnerFriendly && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Beginner Friendly</span>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Herbs Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {herbs.map((herb) => {
                const data = getHerbData(herb);

                return (
                  <Link
                    key={herb.id}
                    href={`/herbs/${herb.id}`}
                    className="group relative bg-white dark:bg-earth-900 rounded-2xl shadow-sm border border-earth-100 dark:border-earth-700 hover:border-sage-300 dark:hover:border-sage-700 card-interactive overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="relative bg-gradient-to-br from-cream-50 via-sage-50/30 to-earth-50/20 dark:from-earth-950 dark:via-sage-950/30 dark:to-earth-950/20 border-b border-earth-100/50 dark:border-earth-700/50">
                      {data.imageUrl ? (
                        <div className="relative w-full h-48 overflow-hidden">
                          <Image
                            src={data.imageUrl}
                            alt={data.imageAlt || data.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                          {data.tcmTemperature && (
                            <div className="absolute top-3 right-3">
                              <Tag
                                variant={temperatureStyles[data.tcmTemperature.toLowerCase()]?.variant || 'muted'}
                                size="sm"
                              >
                                {data.tcmTemperature}
                              </Tag>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="w-14 h-14 rounded-xl bg-white dark:bg-earth-800 shadow-md flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                              <HerbIcon />
                            </div>
                            {data.tcmTemperature && (
                              <Tag
                                variant={temperatureStyles[data.tcmTemperature.toLowerCase()]?.variant || 'muted'}
                                size="sm"
                              >
                                {data.tcmTemperature}
                              </Tag>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      <h2 className="font-serif text-lg font-bold text-gray-800 dark:text-earth-100 mb-1 group-hover:text-sage-700 transition-colors">
                        {data.title}
                      </h2>

                      {data.scientificName && (
                        <p className="text-sm italic text-sage-600 dark:text-sage-400 mb-3 font-light">
                          {data.scientificName}
                        </p>
                      )}

                      {data.commonNames.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {data.commonNames.slice(0, 2).map((name, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-sage-50 text-sage-700 dark:bg-sage-900/30 dark:text-sage-300 dark:border-sage-800 px-2 py-1 rounded-md border border-sage-100"
                            >
                              {name}
                            </span>
                          ))}
                          {data.commonNames.length > 2 && (
                            <span className="text-xs text-sage-400 dark:text-earth-500 py-1">
                              +{data.commonNames.length - 2} more
                            </span>
                          )}
                        </div>
                      )}

                      {data.summary && (
                        <p className="text-sm text-gray-600 dark:text-earth-300 line-clamp-2 mb-3 leading-relaxed">
                          {data.summary}...
                        </p>
                      )}

                      {data.primaryActions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {data.primaryActions.slice(0, 2).map((action, idx) => (
                            <Tag key={idx} variant="earth" size="sm">
                              {action}
                            </Tag>
                          ))}
                          {data.primaryActions.length > 2 && (
                            <span className="text-xs text-earth-400 py-1">
                              +{data.primaryActions.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Decision indicators */}
                      {(data.popularity || data.beginnerFriendly || data.editorsPick) && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {data.editorsPick && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">&#9733; Pick</span>}
                          {data.popularity && (() => { const c = getFieldConfig(popularityMap, data.popularity); return c ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                          ) : null; })()}
                          {data.beginnerFriendly && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Beginner</span>}
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-earth-100 dark:border-earth-700">
                        <span className="text-sage-600 dark:text-sage-400 font-medium text-sm flex items-center gap-1.5 group-hover:gap-3 transition-all">
                          Explore Details
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mb-12">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                />
              </div>
            )}

            <BotanicalDivider className="mb-12" />

            {/* Newsletter Signup */}
            <NewsletterSignup variant="card" className="mb-12" />
          </>
        )}

        {/* Educational Disclaimer */}
        <DisclaimerBox className="mb-8" />

        {/* Back Link */}
        <div className="text-center">
          <BackLink href="/" label="Return to Home" />
        </div>
      </div>
    </PageWrapper>
  );
}
