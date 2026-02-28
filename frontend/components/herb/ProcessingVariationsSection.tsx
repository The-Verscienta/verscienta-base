import { SafeHtml } from '@/components/ui/SafeHtml';
import { getTextValue } from '@/lib/drupal-helpers';
import type { HerbProcessing } from '@/types/drupal';

interface Props {
  variations: HerbProcessing[];
}

export function ProcessingVariationsSection({ variations }: Props) {
  if (!variations || variations.length === 0) return null;

  return (
    <section
      className="bg-orange-50/40 dark:bg-orange-950/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800"
      aria-label="Processing Variations"
    >
      <h2 className="font-serif text-xl font-bold text-gray-800 dark:text-earth-100 mb-1 flex items-center gap-2">
        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
        Processing Variations <span className="font-serif font-normal text-orange-600 dark:text-orange-400 text-lg ml-1">(炮製 Páozhì)</span>
      </h2>
      <p className="text-sm text-gray-500 dark:text-earth-400 mb-4">
        Different processing methods alter this herb&apos;s properties and clinical applications.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {variations.map((variation) => {
          const effect = getTextValue(variation.field_processing_effect);
          const indicationChange = getTextValue(variation.field_processing_indication_change);

          return (
            <div
              key={variation.id}
              className="bg-white dark:bg-earth-900 rounded-lg p-4 border border-orange-200 dark:border-orange-800 shadow-sm"
            >
              {variation.field_processing_method && (
                <p className="inline-block text-sm font-bold text-orange-800 dark:text-orange-200 bg-orange-100 dark:bg-orange-900/40 px-3 py-1 rounded-full mb-3">
                  {variation.field_processing_method}
                </p>
              )}

              {effect && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-1">
                    Effect on Properties
                  </p>
                  <div className="prose prose-sm max-w-none text-gray-700 dark:text-earth-200">
                    <SafeHtml html={effect} />
                  </div>
                </div>
              )}

              {indicationChange && (
                <div className="mt-2 pt-2 border-t border-orange-100 dark:border-orange-900">
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-1">
                    Indication Change
                  </p>
                  <div className="prose prose-sm max-w-none text-gray-600 dark:text-earth-300">
                    <SafeHtml html={indicationChange} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
