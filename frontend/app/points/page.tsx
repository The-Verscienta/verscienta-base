import { Suspense } from 'react';
import { drupal } from '@/lib/drupal';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ServerPagination, PaginationInfo } from '@/components/ui/ServerPagination';
import { EmptyState, PageWrapper, LeafPattern, BotanicalDivider, DisclaimerBox, BackLink } from '@/components/ui/DesignSystem';
import { AcupointCard } from '@/components/point/AcupointCard';
import { MeridianFilterBar } from '@/components/point/MeridianFilterBar';
import { AcupointCardSkeleton } from '@/components/point/LoadingSkeletons';
import type { AcupointEntity, AcupointListItem } from '@/types/drupal';

export const revalidate = 300;

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'title',              label: 'Name (A–Z)' },
  { value: '-title',             label: 'Name (Z–A)' },
  { value: 'field_point_code',   label: 'Point Code' },
  { value: 'field_meridian',     label: 'Channel' },
  { value: '-created',           label: 'Newest First' },
];

export const metadata = {
  title: 'Acupuncture Points Database — Verscienta Health',
  description:
    'Browse 361+ classical acupuncture points with location, needling depth, TCM actions, and clinical indications. Filter by meridian channel.',
};

interface PointsResult {
  points: AcupointListItem[];
  total: number;
}

async function getPoints(sort: string, page: number, meridian: string): Promise<PointsResult> {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const params: Record<string, string | number> = {
      sort,
      'page[limit]': PAGE_SIZE,
      'page[offset]': offset,
      'filter[status]': 1,
      'fields[node--acupuncture_point]':
        'id,title,field_point_code,field_point_pinyin_name,field_point_chinese_name,' +
        'field_meridian,field_special_properties,field_popularity,field_editors_pick,field_beginner_friendly',
      include: 'field_meridian',
      'fields[taxonomy_term--meridian]': 'id,name',
    };
    if (meridian) {
      params['filter[field_meridian.name]'] = meridian;
    }

    const countParams: Record<string, string | number> = {
      'filter[status]': 1,
      'fields[node--acupuncture_point]': 'id',
      'page[limit]': 500,
    };
    if (meridian) {
      countParams['filter[field_meridian.name]'] = meridian;
    }

    const [list, all] = await Promise.all([
      drupal.getResourceCollection<AcupointEntity[]>('node--acupuncture_point', { params }),
      drupal.getResourceCollection<AcupointEntity[]>('node--acupuncture_point', { params: countParams }),
    ]);

    const points: AcupointListItem[] = (list ?? []).map(p => ({
      id: p.id,
      title: p.title,
      pointCode: p.field_point_code ?? '',
      pinyinName: p.field_point_pinyin_name,
      chineseName: p.field_point_chinese_name,
      meridianName: p.field_meridian?.name,
      specialProperties: p.field_special_properties,
      popularity: p.field_popularity,
      editorsPick: p.field_editors_pick,
      beginnerFriendly: p.field_beginner_friendly,
    }));

    return { points, total: (all ?? []).length };
  } catch (err) {
    console.error('Failed to fetch acupuncture points:', err);
    return { points: [], total: 0 };
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string; meridian?: string }>;
}

export default async function PointsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort ?? 'field_point_code';
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10));
  const meridian = params.meridian ?? '';

  const { points, total } = await getPoints(sort, currentPage, meridian);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const picks = points.filter(p => p.editorsPick);

  return (
    <PageWrapper>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50/50 to-cream-100 dark:from-indigo-950 dark:via-blue-950/80 dark:to-earth-900 border-b border-indigo-200/50 dark:border-indigo-800/50">
        <LeafPattern opacity={0.04} />
        <div className="absolute top-16 right-20 w-56 h-56 bg-indigo-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Acupuncture Points' }]}
            className="mb-8"
          />

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                  {/* Acupuncture needle icon */}
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 3v18M9 6l3-3 3 3M12 21l-1-2M12 21l1-2M8 12h8" />
                  </svg>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium tracking-wide uppercase text-sm">
                  Acupuncture Point Database
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-earth-100 mb-4 leading-tight">
                Acupuncture Points
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-earth-300 leading-relaxed">
                Explore classical acupuncture points with precise locations, needling technique,
                TCM actions, and clinical indications. Filter by meridian channel.
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/60 dark:bg-earth-900/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-800/50 shadow-sm">
              <SortDropdown options={SORT_OPTIONS} defaultValue="field_point_code" />
              <div className="hidden sm:block w-px h-8 bg-earth-200 dark:bg-earth-700" />
              <PaginationInfo currentPage={currentPage} pageSize={PAGE_SIZE} totalItems={total} />
            </div>
          </div>

          {/* Meridian filter bar */}
          <Suspense fallback={null}>
            <MeridianFilterBar activeMeridian={meridian || undefined} />
          </Suspense>

          {meridian && (
            <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm3 4h12m-9 4h6" />
              </svg>
              Filtered by: <strong>{meridian} Channel</strong> — {total} point{total !== 1 ? 's' : ''}
              <Link href="/points" className="ml-2 underline hover:no-underline">Clear filter</Link>
            </p>
          )}
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {points.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 3v18M9 6l3-3 3 3M8 12h8" />
              </svg>
            }
            title="No Acupuncture Points Found"
            description={
              meridian
                ? `No points found in the ${meridian} channel. Try a different meridian or clear the filter.`
                : 'The acupuncture points database is being curated. Check back soon.'
            }
            action={
              meridian ? (
                <Link
                  href="/points"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
                >
                  View All Points
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
                  <span className="text-amber-500">★</span> Essential Points
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {picks.map(point => (
                    <AcupointCard key={point.id} point={point} />
                  ))}
                </div>
              </section>
            )}

            {/* All Points Grid */}
            <section>
              {picks.length > 0 && (
                <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-6">
                  {meridian ? `${meridian} Channel Points` : 'All Points'}
                </h2>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {(picks.length > 0 ? points.filter(p => !p.editorsPick) : points).map(point => (
                  <AcupointCard key={point.id} point={point} />
                ))}
                {/* Skeleton placeholders during SSR */}
                {points.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                  <AcupointCardSkeleton key={i} />
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
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-800 mb-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-earth-100 mb-3">
                  About Acupuncture Points
                </h2>
                <p className="text-gray-600 dark:text-earth-300 leading-relaxed mb-4">
                  Acupuncture points are specific anatomical locations where stimulation via needles,
                  moxibustion, or pressure influences the flow of Qi through the meridian system.
                  Each of the 361 classical points has documented locations, actions, and clinical
                  indications refined over 2,000+ years of practice.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link href="/herbs" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    Browse Herbs →
                  </Link>
                  <Link href="/formulas" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    Browse Formulas →
                  </Link>
                  <Link href="/conditions" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
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
