import { drupal } from '@/lib/drupal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { TcmPatternEntity } from '@/types/drupal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { getTextValue, hasTextContent } from '@/lib/drupal-helpers';
import {
  PageWrapper,
  Section,
  BotanicalDivider,
  Tag,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';
import { QRCodeModal } from '@/components/ui/QRCodeModal';
import { TongueAndPulsePanel } from '@/components/pattern/TongueAndPulsePanel';

export const revalidate = 300;

async function getPattern(id: string): Promise<TcmPatternEntity | null> {
  try {
    return await drupal.getResource<TcmPatternEntity>('node--tcm_pattern', id, {
      params: {
        include: 'field_organ_system,field_related_conditions,field_related_herbs,field_related_formulas,field_related_points',
        'fields[taxonomy_term--organ_system]': 'id,name,description',
        'fields[node--condition]': 'id,title',
        'fields[node--herb]': 'id,title,field_herb_pinyin_name',
        'fields[node--formula]': 'id,title',
        'fields[node--acupuncture_point]': 'id,title,field_point_code',
      },
    });
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const patterns = await drupal.getResourceCollection<TcmPatternEntity[]>('node--tcm_pattern', {
      params: { 'fields[node--tcm_pattern]': 'id', 'page[limit]': 500, 'filter[status]': 1 },
    });
    return (patterns ?? []).map(p => ({ id: p.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pattern = await getPattern(id);
  if (!pattern) return { title: 'Pattern Not Found — Verscienta Health' };
  const pinyin = pattern.field_pattern_name_pinyin ?? '';
  const name = [pattern.title, pinyin].filter(Boolean).join(' — ');
  return {
    title: `${name} — TCM Pattern — Verscienta Health`,
    description:
      getTextValue(pattern.field_signs_symptoms)?.slice(0, 160) ??
      `TCM pattern: ${pattern.title}. Etiology, signs & symptoms, tongue/pulse criteria, and treatment principle.`,
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PatternDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pattern = await getPattern(id);
  if (!pattern) notFound();

  const organName = pattern.field_organ_system?.name;

  return (
    <PageWrapper>
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/40 to-cream-100 dark:from-amber-950 dark:via-orange-950/60 dark:to-earth-900 border-b border-amber-200/50 dark:border-amber-800/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'TCM Patterns', href: '/patterns' },
              { label: pattern.title },
            ]}
            className="mb-8"
          />

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              {/* Chinese name */}
              {pattern.field_pattern_name_chinese && (
                <span className="text-4xl md:text-5xl text-gray-700 dark:text-earth-200 font-light block mb-2">
                  {pattern.field_pattern_name_chinese}
                </span>
              )}

              {/* Pinyin */}
              {pattern.field_pattern_name_pinyin && (
                <p className="text-xl text-earth-500 dark:text-earth-400 italic mb-3">
                  {pattern.field_pattern_name_pinyin}
                </p>
              )}

              <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-earth-100 mb-4">
                {pattern.title}
              </h1>

              {/* Tags row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {organName && (
                  <Link href={`/patterns?organSystem=${encodeURIComponent(organName)}`}>
                    <Tag variant="amber" size="sm">{organName}</Tag>
                  </Link>
                )}
                {pattern.field_pattern_category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 capitalize">
                    {pattern.field_pattern_category}
                  </span>
                )}
                {pattern.field_temperature && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage-100 dark:bg-sage-900/40 text-sage-700 dark:text-sage-300 capitalize">
                    {pattern.field_temperature}
                  </span>
                )}
                {pattern.field_editors_pick && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                    ★ Essential Pattern
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <QRCodeModal title={pattern.title} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* Overview / body */}
        {pattern.body?.processed && (
          <Section title="Overview">
            <SafeHtml html={pattern.body.processed} />
          </Section>
        )}

        {/* Etiology */}
        {hasTextContent(pattern.field_etiology) && (
          <Section title="Etiology">
            <SafeHtml html={getTextValue(pattern.field_etiology)} />
          </Section>
        )}

        {/* Pathomechanism */}
        {hasTextContent(pattern.field_pathomechanism) && (
          <Section title="Pathomechanism">
            <SafeHtml html={getTextValue(pattern.field_pathomechanism)} />
          </Section>
        )}

        {/* Signs & Symptoms */}
        {hasTextContent(pattern.field_signs_symptoms) && (
          <Section title="Signs &amp; Symptoms" variant="tcm">
            <SafeHtml html={getTextValue(pattern.field_signs_symptoms)} />
          </Section>
        )}

        {/* Tongue & Pulse */}
        <TongueAndPulsePanel
          tongue={pattern.field_tongue_criteria}
          pulse={pattern.field_pulse_criteria}
        />

        {/* Treatment Principle */}
        {hasTextContent(pattern.field_treatment_principle) && (
          <Section title="Treatment Principle">
            <SafeHtml html={getTextValue(pattern.field_treatment_principle)} />
          </Section>
        )}

        {/* Differential Diagnosis */}
        {hasTextContent(pattern.field_differential_diagnosis) && (
          <Section
            title="Differential Diagnosis"
            className="border-l-4 border-amber-300 dark:border-amber-700 pl-4"
          >
            <SafeHtml html={getTextValue(pattern.field_differential_diagnosis)} />
          </Section>
        )}

        <BotanicalDivider />

        {/* Cross-references — 4-column grid */}
        {(pattern.field_related_conditions?.length ||
          pattern.field_related_formulas?.length ||
          pattern.field_related_herbs?.length ||
          pattern.field_related_points?.length) ? (
          <section className="grid md:grid-cols-4 gap-6">
            {/* Related Conditions */}
            {pattern.field_related_conditions && pattern.field_related_conditions.length > 0 && (
              <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-700 p-5">
                <h3 className="font-serif text-base font-bold text-gray-800 dark:text-earth-100 mb-4">
                  Related Conditions
                </h3>
                <ul className="space-y-2">
                  {pattern.field_related_conditions.map(c => (
                    <li key={c.id}>
                      <Link
                        href={`/conditions/${c.id}`}
                        className="text-sm text-earth-700 dark:text-earth-300 hover:text-earth-900 dark:hover:text-earth-100 hover:underline flex items-center gap-1.5"
                      >
                        <span className="text-earth-400">›</span>
                        {c.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Formulas */}
            {pattern.field_related_formulas && pattern.field_related_formulas.length > 0 && (
              <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-700 p-5">
                <h3 className="font-serif text-base font-bold text-gray-800 dark:text-earth-100 mb-4">
                  Related Formulas
                </h3>
                <ul className="space-y-2">
                  {pattern.field_related_formulas.map(f => (
                    <li key={f.id}>
                      <Link
                        href={`/formulas/${f.id}`}
                        className="text-sm text-earth-700 dark:text-earth-300 hover:text-earth-900 dark:hover:text-earth-100 hover:underline flex items-center gap-1.5"
                      >
                        <span className="text-earth-400">›</span>
                        {f.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Herbs */}
            {pattern.field_related_herbs && pattern.field_related_herbs.length > 0 && (
              <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-700 p-5">
                <h3 className="font-serif text-base font-bold text-gray-800 dark:text-earth-100 mb-4">
                  Related Herbs
                </h3>
                <ul className="space-y-2">
                  {pattern.field_related_herbs.map(h => (
                    <li key={h.id}>
                      <Link
                        href={`/herbs/${h.id}`}
                        className="text-sm text-earth-700 dark:text-earth-300 hover:text-earth-900 dark:hover:text-earth-100 hover:underline flex items-center gap-1.5"
                      >
                        <span className="text-earth-400">›</span>
                        <span>{h.title}</span>
                        {h.field_herb_pinyin_name && (
                          <span className="text-earth-400 italic">({h.field_herb_pinyin_name})</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Points */}
            {pattern.field_related_points && pattern.field_related_points.length > 0 && (
              <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-700 p-5">
                <h3 className="font-serif text-base font-bold text-gray-800 dark:text-earth-100 mb-4">
                  Related Points
                </h3>
                <ul className="space-y-2">
                  {pattern.field_related_points.map(pt => (
                    <li key={pt.id}>
                      <Link
                        href={`/points/${pt.id}`}
                        className="text-sm text-earth-700 dark:text-earth-300 hover:text-earth-900 dark:hover:text-earth-100 hover:underline flex items-center gap-1.5"
                      >
                        <span className="text-earth-400">›</span>
                        {pt.field_point_code && (
                          <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {pt.field_point_code}
                          </span>
                        )}
                        <span>{pt.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ) : null}

        <BotanicalDivider className="mt-4" />
        <DisclaimerBox className="mb-8" />
        <div className="text-center">
          <BackLink href="/patterns" label="Back to TCM Patterns" />
        </div>
      </div>
    </PageWrapper>
  );
}
