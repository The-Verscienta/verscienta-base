import { Section } from '@/components/ui/DesignSystem';
import { getTextValue } from '@/lib/drupal-helpers';
import type { FormulaModification, JiaJianAction } from '@/types/drupal';

interface Props {
  modifications: FormulaModification[];
}

const ACTION_STYLES: Record<JiaJianAction, string> = {
  add:      'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  remove:   'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  increase: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  decrease: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
};

const ACTION_LABELS: Record<JiaJianAction, string> = {
  add:      'Add',
  remove:   'Remove',
  increase: 'Increase',
  decrease: 'Decrease',
};

export function JiaJianSection({ modifications }: Props) {
  if (!modifications || modifications.length === 0) return null;

  return (
    <Section
      id="jia-jian"
      variant="tcm"
      title="Formula Modifications (加减)"
      icon={
        <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      }
    >
      <div className="space-y-3">
        {modifications.map((mod) => {
          const action = mod.field_modification_action;
          const noteText = getTextValue(mod.field_modification_note);

          return (
            <div
              key={mod.id}
              className="bg-white dark:bg-earth-900 rounded-xl p-4 border border-earth-100 dark:border-earth-700 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                {mod.field_modification_condition && (
                  <span className="text-sm italic text-gray-600 dark:text-earth-300">
                    {mod.field_modification_condition}
                  </span>
                )}
                {action && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ACTION_STYLES[action]}`}>
                    {ACTION_LABELS[action]}
                  </span>
                )}
                {mod.field_modification_herb && (
                  <span className="font-medium text-gray-800 dark:text-earth-100">
                    {mod.field_modification_herb.title ?? 'Herb'}
                    {mod.field_modification_herb.field_herb_pinyin_name && (
                      <span className="text-earth-500 ml-1 italic text-sm">
                        ({mod.field_modification_herb.field_herb_pinyin_name})
                      </span>
                    )}
                  </span>
                )}
                {mod.field_modification_amount && (
                  <span className="text-sm font-mono text-earth-600 dark:text-earth-400">
                    {mod.field_modification_amount}
                  </span>
                )}
              </div>
              {noteText && (
                <p className="text-sm text-gray-600 dark:text-earth-300 mt-1 pl-2 border-l-2 border-earth-200 dark:border-earth-700">
                  {noteText}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
