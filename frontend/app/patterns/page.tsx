import { Suspense } from 'react';
import { drupal } from '@/lib/drupal';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ServerPagination, PaginationInfo } from '@/components/ui/ServerPagination';
import { EmptyState, PageWrapper, LeafPattern, BotanicalDivider, DisclaimerBox, BackLink } from '@/components/ui/DesignSystem';
import { TcmPatternCard } from '@/components/pattern/TcmPatternCard';
import { OrganSystemFilterBar } from '@/components/pattern/OrganSystemFilterBar';
import { TcmPatternCardSkeleton } from '@/components/pattern/LoadingSkeletons';
import type { TcmPatternEntity, TcmPatternListItem } from '@/types/drupal';

export const revalidate = 300;

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'title',               label: 'Name (A–Z)' },
  { value: '-title',              label: 'Name (Z–A)' },
  { value: 'field_organ_system',  label: 'Organ System' },
  { value: '-created',            label: 'Newest First' },
];

export const metadata = {
  title: 'TCM Patterns & Syndromes Database — Verscienta Health',
  description:
    'Browse TCM pattern differentiation syndromes with etiology, signs & symptoms, tongue/pulse criteria, and treatment principles. Filter by organ system.',
};

interface PatternsResult {
  patterns: TcmPatternListItem[];
  total: number;
}

async function getPatterns(sort: string, page: number, organSystem: string): Promise<PatternsResult> {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const params: Record<string, string | number> = {
      sort,
      'page[limit]': PAGE_SIZE,
      'page[offset]': offset,
      'filter[status]': 1,
      'fields[node--tcm_pattern]':
        'id,title,field_pattern_name_chinese,field_pattern_name_pinyin,' +
        'field_organ_system,field_pattern_category,field_temperature,field_popularity,field_editors_pick',
      include: 'field_organ_system',
      'fields[taxonomy_term--organ_system]': 'id,name',
    };
    if (organSystem) {
      params['filter[field_organ_system.name]'] = organSystem;
    }

    const countParams: Record<string, string | number> = {
      'filter[status]': 1,
      'fields[node--tcm_pattern]': 'id',
      'page[limit]': 500,
    };
    if (organSystem) {
      countParams['filter[field_organ_system.name]'] = organSystem;
    }

    const [list, all] = await Promise.all([
      drupal.getResourceCollection<TcmPatternEntity[]>('node--tcm_pattern', { params }),
      drupal.getResourceCollection<TcmPatternEntity[]>('node--tcm_pattern', { params: countParams }),
    ]);

    const patterns: TcmPatternListItem[] = (list ?? []).map(p => ({
      id: p.id,
      title: p.title,
      chineseName: p.field_pattern_name_chinese,
      pinyinName: p.field_pattern_name_pinyin,
      organSystem: p.field_organ_system?.name,
      category: p.field_pattern_category,
      temperature: p.field_temperature,
      popularity: p.field_popularity,
      editorsPick: p.field_editors_pick,
    }));

    return { patterns, total: (all ?? []).length };
  } catch (err) {
    console.error('Failed to fetch TCM patterns:', err);
    return { patterns: [], total: 0 };
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string; organSystem?: string }>;
}

export default async function PatternsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort ?? 'title';
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10));
  const organSystem = params.organSystem ?? '';

  const { patterns, total } = await getPatterns(sort, currentPage, organSystem);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const picks = patterns.filter(p => p.editorsPick);

  return (
    <PageWrapper>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/40 to-cream-100 dark:from-amber-950 dark:via-orange-950/60 dark:to-earth-900 border-b border-amber-200/50 dark:border-amber-800/50">
        <LeafPattern opacity={0.04} />
        <div className="absolute top-16 right-20 w-56 h-56 bg-amber-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-orange-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'TCM Patterns' }]}
            className="mb-8"
          />

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  {/* Pattern / yin-yang icon */}
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 0v9m0 0a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 0a4.5 4.5 0 110-9" />
                  </svg>
                </div>
                <span className="text-amber-700 dark:text-amber-400 font-medium tracking-wide uppercase text-sm">
                  TCM Pattern Database
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-earth-100 mb-4 leading-tight">
                TCM Patterns &amp; Syndromes
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-earth-300 leading-relaxed">
                Explore classical TCM pattern differentiation syndromes with etiology, signs &amp; symptoms,
                tongue/pulse criteria, and treatment principles. Filter by organ system.
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/60 dark:bg-earth-900/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/50 shadow-sm">
              <SortDropdown options={SORT_OPTIONS} defaultValue="title" />
              <div className="hidden sm:block w-px h-8 bg-earth-200 dark:bg-earth-700" />
              <PaginationInfo currentPage={currentPage} pageSize={PAGE_SIZE} totalItems={total} />
            </div>
          </div>

          {/* Organ system filter bar */}
          <Suspense fallback={null}>
            <OrganSystemFilterBar activeOrganSystem={organSystem || undefined} />
          </Suspense>

          {organSystem && (
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm3 4h12m-9 4h6" />
              </svg>
              Filtered by: <strong>{organSystem}</strong> — {total} pattern{total !== 1 ? 's' : ''}
              <Link href="/patterns" className="ml-2 underline hover:no-underline">Clear filter</Link>
            </p>
          )}
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {patterns.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 3a9 9 0 100 18A9 9 0 0012 3zm0 0v9m0 0a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
              </svg>
            }
            title="No TCM Patterns Found"
            description={
              organSystem
                ? `No patterns found for the ${organSystem} system. Try a different organ system or clear the filter.`
                : 'The TCM patterns database is being curated. Check back soon.'
            }
            action={
              organSystem ? (
                <Link
                  href="/patterns"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
                >
                  View All Patterns
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Editor's Picks */}
            {picks.length > 0 && (
              <section className="mb-12">
                <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-6 flex items-center gap-2">
                  <span className="text-amber-500">★</span> Essential Patterns
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {picks.map(pattern => (
                    <TcmPatternCard key={pattern.id} pattern={pattern} />
                  ))}
                </div>
              </section>
            )}

            {/* All Patterns Grid */}
            <section>
              {picks.length > 0 && (
                <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-6">
                  {organSystem ? `${organSystem} Patterns` : 'All Patterns'}
                </h2>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {(picks.length > 0 ? patterns.filter(p => !p.editorsPick) : patterns).map(pattern => (
                  <TcmPatternCard key={pattern.id} pattern={pattern} />
                ))}
                {patterns.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                  <TcmPatternCardSkeleton key={i} />
                ))}
              </div>
            </section>

            {totalPages > 1 && (
              <div className="mb-12">
                <ServerPagination currentPage={currentPage} totalPages={totalPages} />
              </div>
            )}

            <BotanicalDivider className="mb-12" />

            {/* Educational blurb */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-2xl p-8 border border-amber-200 dark:border-amber-800 mb-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-3">
                  About TCM Pattern Differentiation
                </h2>
                <p className="text-gray-600 dark:text-earth-300 leading-relaxed mb-4">
                  Pattern differentiation (辨证论治, biànzhèng lùnzhì) is the cornerstone of TCM diagnosis.
                  Rather than treating a disease label, practitioners identify an individual&apos;s unique pattern
                  of disharmony — combining organ system, temperature quality, and deficiency/excess character —
                  to guide formula selection, acupuncture, and lifestyle recommendations.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link href="/formulas" className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline">
                    Browse Formulas →
                  </Link>
                  <Link href="/points" className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline">
                    Browse Points →
                  </Link>
                  <Link href="/conditions" className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline">
                    Browse Conditions →
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        <DisclaimerBox className="mb-8" />
        <div className="text-center">
          <BackLink href="/" label="Return to Home" />
        </div>
      </div>
    </PageWrapper>
  );
}
