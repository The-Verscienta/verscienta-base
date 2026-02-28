import Link from 'next/link';
import { Tag } from '@/components/ui/DesignSystem';
import type { TcmConceptListItem } from '@/types/drupal';

// Category → card gradient colours
const CATEGORY_COLORS: Record<string, string> = {
  'Fundamental Substances': 'from-violet-100 to-purple-200 dark:from-violet-900/40 dark:to-purple-900/40 text-violet-800 dark:text-violet-200',
  'Pathogenic Factors':     'from-indigo-100 to-blue-200 dark:from-indigo-900/40 dark:to-blue-900/40 text-indigo-800 dark:text-indigo-200',
  'Diagnostic Frameworks':  'from-teal-100 to-cyan-200 dark:from-teal-900/40 dark:to-cyan-900/40 text-teal-800 dark:text-teal-200',
  'Five Element Theory':    'from-emerald-100 to-green-200 dark:from-emerald-900/40 dark:to-green-900/40 text-emerald-800 dark:text-emerald-200',
  'Treatment Methods':      'from-amber-100 to-yellow-200 dark:from-amber-900/40 dark:to-yellow-900/40 text-amber-800 dark:text-amber-200',
  'Constitutional Theory':  'from-rose-100 to-pink-200 dark:from-rose-900/40 dark:to-pink-900/40 text-rose-800 dark:text-rose-200',
};

const DEFAULT_COLOR = 'from-earth-100 to-earth-200 dark:from-earth-800/40 dark:to-earth-700/40 text-earth-800 dark:text-earth-200';

interface Props {
  concept: TcmConceptListItem;
}

export function ConceptCard({ concept }: Props) {
  const headerColor = CATEGORY_COLORS[concept.category ?? ''] ?? DEFAULT_COLOR;

  return (
    <Link
      href={`/concepts/${concept.id}`}
      className="group relative bg-white dark:bg-earth-900 rounded-2xl shadow-sm hover:shadow-xl border border-earth-100 dark:border-earth-700 hover:border-earth-300 dark:hover:border-earth-600 transition-all duration-300 overflow-hidden flex flex-col"
      aria-label={`View ${concept.title}${concept.chineseName ? ` — ${concept.chineseName}` : ''}`}
    >
      {/* Category-colored header */}
      <div className={`bg-gradient-to-br ${headerColor} px-5 pt-5 pb-3 border-b border-earth-100/50 dark:border-earth-700/50`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-bold leading-snug">
            {concept.title}
          </h3>
          {concept.editorsPick && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex-shrink-0">
              ★ Pick
            </span>
          )}
        </div>
        {concept.chineseName && (
          <p className="text-lg font-medium mt-1 opacity-70">{concept.chineseName}</p>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        {concept.pinyinName && (
          <p className="text-sm text-earth-500 dark:text-earth-400 italic mb-3">{concept.pinyinName}</p>
        )}

        {concept.category && (
          <div className="mb-3">
            <Tag variant="purple" size="sm">{concept.category}</Tag>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-earth-100 dark:border-earth-700">
          <span className="text-earth-600 font-medium text-sm flex items-center gap-1.5 group-hover:gap-3 transition-all">
            Explore Concept
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
