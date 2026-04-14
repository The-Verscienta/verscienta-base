import Link from 'next/link';
import { Section, Tag } from '@/components/ui/DesignSystem';
import type { FormulaSummary } from '@/lib/drupal-related-formulas';

/**
 * Lane 1b — Curated entity references from Drupal (`field_related_formulas`).
 */
export function CuratedRelatedFormulasSection({
  formulas,
}: {
  formulas: Array<{ id: string; title?: string }>;
}) {
  if (!formulas?.length) return null;

  return (
    <Section
      id="curated-related-formulas"
      variant="default"
      title="Curated related formulas"
      subtitle="Editor-selected formulas that are often compared, combined, or contrasted with this one in clinic or classical literature."
      icon={
        <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      }
    >
      <div className="flex flex-wrap gap-2">
        {formulas.map((f) => (
          <Link key={f.id} href={`/formulas/${f.id}`} className="inline-flex">
            <Tag variant="earth" size="md">
              {f.title || 'Formula'}
            </Tag>
          </Link>
        ))}
      </div>
    </Section>
  );
}

/**
 * Lane — Other formulas that reference at least one of the same conditions (indication overlap).
 */
export function OverlappingConditionFormulasSection({
  currentFormulaId,
  related,
}: {
  currentFormulaId: string;
  related: FormulaSummary[];
}) {
  const filtered = related.filter((r) => r.id !== currentFormulaId);
  if (!filtered.length) return null;

  return (
    <Section
      id="formulas-overlapping-conditions"
      variant="default"
      title="Other formulas for overlapping conditions"
      subtitle="Published formulas that share one or more of the same related conditions. Stronger overlap (more shared conditions) is listed first."
      icon={
        <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      }
    >
      <ul className="space-y-2">
        {filtered.map((f) => (
          <li key={f.id}>
            <Link
              href={`/formulas/${f.id}`}
              className="flex flex-wrap items-center gap-2 text-earth-700 dark:text-earth-300 hover:text-sage-700 dark:hover:text-sage-400 font-medium"
            >
              <span>{f.title}</span>
              {f.overlapCount > 1 && (
                <span className="text-xs font-normal text-gray-500 dark:text-earth-500">
                  ({f.overlapCount} shared conditions)
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
