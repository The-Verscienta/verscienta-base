import Link from 'next/link';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { herbDisplayName, getTextValue } from '@/lib/drupal-helpers';
import type { HerbPairing } from '@/types/drupal';

interface Props {
  pairings: HerbPairing[];
}

export function HerbPairingsSection({ pairings }: Props) {
  if (!pairings || pairings.length === 0) return null;

  return (
    <section
      className="bg-sage-50 dark:bg-sage-950/20 rounded-xl p-5 border border-sage-200 dark:border-sage-800"
      aria-label="Herb Pairings"
    >
      <h2 className="font-serif text-xl font-bold text-gray-800 dark:text-earth-100 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Herb Pairings
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        {pairings.map((pairing) => {
          const partner = pairing.field_partner_herb;
          const actionText = getTextValue(pairing.field_synergistic_action);
          const formula = pairing.field_example_formula;

          return (
            <div
              key={pairing.id}
              className="bg-white dark:bg-earth-900 rounded-lg p-4 border border-sage-200 dark:border-sage-800 shadow-sm"
            >
              {partner && (
                <Link
                  href={`/herbs/${partner.id}`}
                  className="font-semibold text-sage-700 dark:text-sage-300 hover:text-sage-900 dark:hover:text-sage-100 hover:underline block mb-2"
                >
                  {herbDisplayName(
                    partner.title ?? 'Herb',
                    partner.field_herb_pinyin_name,
                    partner.field_herb_chinese_name,
                  )}
                </Link>
              )}

              {actionText && (
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-earth-200 mb-2">
                  <SafeHtml html={actionText} />
                </div>
              )}

              {formula && (
                <Link
                  href={`/formulas/${formula.id}`}
                  className="text-xs text-earth-500 dark:text-earth-400 hover:underline flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  {formula.title ?? 'Example Formula'}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
