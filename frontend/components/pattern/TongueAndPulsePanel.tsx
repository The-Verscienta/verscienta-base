import { SafeHtml } from '@/components/ui/SafeHtml';
import { getTextValue, hasTextContent } from '@/lib/drupal-helpers';
import type { DrupalTextField } from '@/types/drupal';

interface Props {
  tongue?: DrupalTextField;
  pulse?: DrupalTextField;
}

export function TongueAndPulsePanel({ tongue, pulse }: Props) {
  if (!hasTextContent(tongue) && !hasTextContent(pulse)) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-5 border border-amber-100 dark:border-amber-800/50">
      <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-earth-100 mb-4">
        Tongue &amp; Pulse Criteria
      </h3>
      <div className="grid sm:grid-cols-2 gap-6">
        {hasTextContent(tongue) && (
          <div>
            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
              Tongue
            </h4>
            <SafeHtml html={getTextValue(tongue)} />
          </div>
        )}
        {hasTextContent(pulse) && (
          <div>
            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
              Pulse
            </h4>
            <SafeHtml html={getTextValue(pulse)} />
          </div>
        )}
      </div>
    </div>
  );
}
