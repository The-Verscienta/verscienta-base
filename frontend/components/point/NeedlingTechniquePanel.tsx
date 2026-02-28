import type { AcupointEntity } from '@/types/drupal';

interface Props {
  point: AcupointEntity;
}

function BoolBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }: { value?: boolean; trueLabel?: string; falseLabel?: string }) {
  if (value === undefined || value === null) return <span className="text-earth-400">—</span>;
  return value ? (
    <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-earth-400 dark:text-earth-500">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      {falseLabel}
    </span>
  );
}

const ANGLE_LABELS: Record<string, string> = {
  perpendicular: 'Perpendicular (90°)',
  oblique: 'Oblique (45°)',
  transverse: 'Transverse / Subcutaneous (15°)',
};

export function NeedlingTechniquePanel({ point }: Props) {
  const hasAnyData =
    point.field_needling_depth ||
    point.field_needling_angle ||
    point.field_needling_method ||
    point.field_moxa_suitable !== undefined ||
    point.field_press_needle_suitable !== undefined;

  if (!hasAnyData) return null;

  return (
    <div className="bg-earth-50 dark:bg-earth-800/50 rounded-xl p-5 border border-earth-100 dark:border-earth-700">
      <h3 className="text-sm font-semibold text-earth-600 dark:text-earth-400 uppercase tracking-wide mb-4">
        Needling Technique
      </h3>
      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        {point.field_needling_depth && (
          <>
            <dt className="text-earth-500 dark:text-earth-400">Depth</dt>
            <dd className="font-medium text-gray-800 dark:text-earth-100">{point.field_needling_depth}</dd>
          </>
        )}
        {point.field_needling_angle && (
          <>
            <dt className="text-earth-500 dark:text-earth-400">Angle</dt>
            <dd className="font-medium text-gray-800 dark:text-earth-100">
              {ANGLE_LABELS[point.field_needling_angle] ?? point.field_needling_angle}
            </dd>
          </>
        )}
        {point.field_needling_method && (
          <>
            <dt className="text-earth-500 dark:text-earth-400">Method</dt>
            <dd className="text-gray-700 dark:text-earth-200 sm:col-span-1">{point.field_needling_method}</dd>
          </>
        )}
        {point.field_moxa_suitable !== undefined && (
          <>
            <dt className="text-earth-500 dark:text-earth-400">Moxibustion</dt>
            <dd>
              <BoolBadge value={point.field_moxa_suitable} trueLabel="Suitable" falseLabel="Not recommended" />
              {point.field_moxa_suitable && point.field_moxa_cones && (
                <span className="ml-2 text-earth-500 text-xs">({point.field_moxa_cones} cones)</span>
              )}
            </dd>
          </>
        )}
        {point.field_press_needle_suitable !== undefined && (
          <>
            <dt className="text-earth-500 dark:text-earth-400">Press Needle</dt>
            <dd><BoolBadge value={point.field_press_needle_suitable} trueLabel="Suitable" falseLabel="Not indicated" /></dd>
          </>
        )}
      </dl>
    </div>
  );
}
