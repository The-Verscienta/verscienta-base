import Link from 'next/link';
import { Tag } from '@/components/ui/DesignSystem';
import type { TcmPatternListItem, PatternCategory, PatternTemperature } from '@/types/drupal';

// Organ system → card gradient colours
const ORGAN_COLORS: Record<string, string> = {
  'Spleen':            'from-amber-100 to-yellow-200 dark:from-amber-900/40 dark:to-yellow-900/40 text-amber-800 dark:text-amber-200',
  'Stomach':           'from-amber-100 to-yellow-200 dark:from-amber-900/40 dark:to-yellow-900/40 text-amber-800 dark:text-amber-200',
  'Liver':             'from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/40 text-green-800 dark:text-green-200',
  'Gallbladder':       'from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/40 text-green-800 dark:text-green-200',
  'Heart':             'from-red-100 to-rose-200 dark:from-red-900/40 dark:to-rose-900/40 text-red-800 dark:text-red-200',
  'Pericardium':       'from-red-100 to-rose-200 dark:from-red-900/40 dark:to-rose-900/40 text-red-800 dark:text-red-200',
  'Small Intestine':   'from-red-100 to-rose-200 dark:from-red-900/40 dark:to-rose-900/40 text-red-800 dark:text-red-200',
  'Kidney':            'from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-800 dark:text-blue-200',
  'Bladder':           'from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-800 dark:text-blue-200',
  'Lung':              'from-sky-100 to-slate-100 dark:from-sky-900/40 dark:to-slate-900/40 text-sky-800 dark:text-sky-200',
  'Large Intestine':   'from-sky-100 to-slate-100 dark:from-sky-900/40 dark:to-slate-900/40 text-sky-800 dark:text-sky-200',
  'Triple Burner':     'from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-800 dark:text-orange-200',
  'Governing Vessel':  'from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 text-purple-800 dark:text-purple-200',
  'Conception Vessel': 'from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 text-purple-800 dark:text-purple-200',
};
const DEFAULT_COLOR = 'from-earth-100 to-earth-200 dark:from-earth-800/40 dark:to-earth-700/40 text-earth-800 dark:text-earth-200';

const CATEGORY_STYLES: Record<PatternCategory, string> = {
  deficiency: 'bg-sage-100 dark:bg-sage-900/40 text-sage-800 dark:text-sage-200',
  excess:     'bg-warm-100 dark:bg-warm-900/40 text-warm-800 dark:text-warm-200',
  mixed:      'bg-earth-100 dark:bg-earth-800/40 text-earth-700 dark:text-earth-300',
};

const TEMPERATURE_STYLES: Record<PatternTemperature, string> = {
  cold:    'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
  heat:    'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
  neutral: 'bg-earth-100 dark:bg-earth-800/40 text-earth-600 dark:text-earth-400',
};

interface Props {
  pattern: TcmPatternListItem;
}

export function TcmPatternCard({ pattern }: Props) {
  const headerColor = ORGAN_COLORS[pattern.organSystem ?? ''] ?? DEFAULT_COLOR;

  return (
    <Link
      href={`/patterns/${pattern.id}`}
      className="group relative bg-white dark:bg-earth-900 rounded-2xl shadow-sm hover:shadow-xl border border-earth-100 dark:border-earth-700 hover:border-earth-300 dark:hover:border-earth-600 transition-all duration-300 overflow-hidden flex flex-col"
      aria-label={`View ${pattern.title}${pattern.chineseName ? ` — ${pattern.chineseName}` : ''}`}
    >
      {/* Organ-colored header */}
      <div className={`bg-gradient-to-br ${headerColor} px-5 pt-5 pb-3 border-b border-earth-100/50 dark:border-earth-700/50`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-bold leading-snug">
            {pattern.title}
          </h3>
          {pattern.editorsPick && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex-shrink-0">
              ★ Pick
            </span>
          )}
        </div>
        {pattern.chineseName && (
          <p className="text-lg font-medium mt-1 opacity-70">{pattern.chineseName}</p>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        {pattern.pinyinName && (
          <p className="text-sm text-earth-500 dark:text-earth-400 italic mb-3">{pattern.pinyinName}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Category badge */}
          {pattern.category && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_STYLES[pattern.category]}`}>
              {pattern.category}
            </span>
          )}
          {/* Temperature badge */}
          {pattern.temperature && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TEMPERATURE_STYLES[pattern.temperature]}`}>
              {pattern.temperature}
            </span>
          )}
        </div>

        {/* Organ system tag */}
        {pattern.organSystem && (
          <div className="mb-3">
            <Tag variant="amber" size="sm">{pattern.organSystem}</Tag>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-earth-100 dark:border-earth-700">
          <span className="text-earth-600 font-medium text-sm flex items-center gap-1.5 group-hover:gap-3 transition-all">
            Explore Pattern
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
