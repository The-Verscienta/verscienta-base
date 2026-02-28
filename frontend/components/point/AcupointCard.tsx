import Link from 'next/link';
import { Tag } from '@/components/ui/DesignSystem';
import { SpecialPropertiesBadges } from './SpecialPropertiesBadges';
import type { AcupointListItem } from '@/types/drupal';

// Meridian-keyed accent colours (element associations)
const MERIDIAN_COLORS: Record<string, string> = {
  'Lung':              'from-sky-100 to-sky-200 dark:from-sky-900/40 dark:to-sky-800/40 text-sky-800 dark:text-sky-200',
  'Large Intestine':   'from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 text-amber-800 dark:text-amber-200',
  'Stomach':           'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 text-yellow-800 dark:text-yellow-200',
  'Spleen':            'from-yellow-50 to-yellow-100 dark:from-yellow-950/40 dark:to-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  'Heart':             'from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 text-red-800 dark:text-red-200',
  'Small Intestine':   'from-red-50 to-orange-100 dark:from-red-950/40 dark:to-orange-900/40 text-red-700 dark:text-red-300',
  'Bladder':           'from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-800 dark:text-blue-200',
  'Kidney':            'from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 text-blue-700 dark:text-blue-300',
  'Pericardium':       'from-fuchsia-100 to-pink-100 dark:from-fuchsia-900/40 dark:to-pink-900/40 text-fuchsia-800 dark:text-fuchsia-200',
  'Triple Burner':     'from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-800 dark:text-orange-200',
  'Gallbladder':       'from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-800 dark:text-green-200',
  'Liver':             'from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-900/40 text-emerald-800 dark:text-emerald-200',
  'Governing Vessel':  'from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 text-purple-800 dark:text-purple-200',
  'Conception Vessel': 'from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 text-violet-800 dark:text-violet-200',
  'Extra Points':      'from-earth-100 to-earth-200 dark:from-earth-800/40 dark:to-earth-700/40 text-earth-800 dark:text-earth-200',
};
const DEFAULT_CODE_COLOR = 'from-sage-100 to-sage-200 dark:from-sage-900/40 dark:to-sage-800/40 text-sage-800 dark:text-sage-200';

interface Props {
  point: AcupointListItem;
}

export function AcupointCard({ point }: Props) {
  const codeColor = MERIDIAN_COLORS[point.meridianName ?? ''] ?? DEFAULT_CODE_COLOR;

  return (
    <Link
      href={`/points/${point.id}`}
      className="group relative bg-white dark:bg-earth-900 rounded-2xl shadow-sm hover:shadow-xl border border-earth-100 dark:border-earth-700 hover:border-earth-300 dark:hover:border-earth-600 transition-all duration-300 overflow-hidden flex flex-col"
      aria-label={`View ${point.pointCode} — ${point.title}`}
    >
      {/* Code badge header */}
      <div className={`bg-gradient-to-br ${codeColor} px-5 pt-5 pb-3 border-b border-earth-100/50 dark:border-earth-700/50`}>
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-2xl font-bold tracking-wide leading-none">
            {point.pointCode || '—'}
          </span>
          <div className="flex flex-wrap gap-1 justify-end">
            {point.editorsPick && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                ★ Pick
              </span>
            )}
            {point.beginnerFriendly && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                Beginner
              </span>
            )}
          </div>
        </div>
        {point.chineseName && (
          <p className="text-lg font-medium mt-1 opacity-70">{point.chineseName}</p>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-earth-100 mb-1 group-hover:text-earth-600 dark:group-hover:text-earth-300 transition-colors leading-snug">
          {point.title}
        </h3>
        {point.pinyinName && (
          <p className="text-sm text-earth-500 dark:text-earth-400 italic mb-3">{point.pinyinName}</p>
        )}

        {/* Meridian tag */}
        {point.meridianName && (
          <div className="mb-3">
            <Tag variant="sage" size="sm">{point.meridianName} Channel</Tag>
          </div>
        )}

        {/* Special properties (max 3) */}
        {point.specialProperties && point.specialProperties.length > 0 && (
          <div className="mb-3">
            <SpecialPropertiesBadges properties={point.specialProperties} max={3} />
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-earth-100 dark:border-earth-700">
          <span className="text-earth-600 font-medium text-sm flex items-center gap-1.5 group-hover:gap-3 transition-all">
            Explore Details
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
