import { drupal } from '@/lib/drupal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { TcmConceptEntity } from '@/types/drupal';
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

export const revalidate = 300;

async function getConcept(id: string): Promise<TcmConceptEntity | null> {
  try {
    return await drupal.getResource<TcmConceptEntity>('node--tcm_concept', id, {
      params: {
        include: 'field_concept_category,field_related_patterns,field_related_herbs,field_related_formulas',
        'fields[taxonomy_term--concept_category]': 'id,name',
        'fields[node--tcm_pattern]': 'id,title',
        'fields[node--herb]': 'id,title,field_herb_pinyin_name',
        'fields[node--formula]': 'id,title',
      },
    });
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const concepts = await drupal.getResourceCollection<TcmConceptEntity[]>('node--tcm_concept', {
      params: { 'fields[node--tcm_concept]': 'id', 'page[limit]': 500, 'filter[status]': 1 },
    });
    return (concepts ?? []).map(c => ({ id: c.id }));
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
  const concept = await getConcept(id);
  if (!concept) return { title: 'Concept Not Found — Verscienta Health' };
  const pinyin = concept.field_concept_pinyin_name ?? '';
  const name = [concept.title, pinyin].filter(Boolean).join(' — ');
  return {
    title: `${name} — TCM Concept — Verscienta Health`,
    description:
      getTextValue(concept.field_clinical_relevance)?.slice(0, 160) ??
      `TCM concept: ${concept.title}. Clinical relevance, related patterns, herbs, and formulas.`,
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConceptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const concept = await getConcept(id);
  if (!concept) notFound();

  const categoryName = concept.field_concept_category?.name;

  return (
    <PageWrapper>
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50/40 to-cream-100 dark:from-violet-950 dark:via-purple-950/60 dark:to-earth-900 border-b border-violet-200/50 dark:border-violet-800/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'TCM Concepts', href: '/concepts' },
              { label: concept.title },
            ]}
            className="mb-8"
          />

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              {concept.field_concept_chinese_name && (
                <span className="text-4xl md:text-5xl text-gray-700 dark:text-earth-200 font-light block mb-2">
                  {concept.field_concept_chinese_name}
                </span>
              )}

              {concept.field_concept_pinyin_name && (
                <p className="text-xl text-earth-500 dark:text-earth-400 italic mb-3">
                  {concept.field_concept_pinyin_name}
                </p>
              )}

              <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-earth-100 mb-4">
                {concept.title}
              </h1>

              {/* Tags row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {categoryName && (
                  <Link href={`/concepts?category=${encodeURIComponent(categoryName)}`}>
                    <Tag variant="purple" size="sm">{categoryName}</Tag>
                  </Link>
                )}
                {concept.field_popularity && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-earth-100 dark:bg-earth-800 text-earth-700 dark:text-earth-300 capitalize">
                    {concept.field_popularity}
                  </span>
                )}
                {concept.field_editors_pick && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                    ★ Essential Concept
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <QRCodeModal title={concept.title} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* Overview / body */}
        {concept.body?.processed && (
          <Section title="Overview">
            <SafeHtml html={concept.body.processed} />
          </Section>
        )}

        {/* Clinical Relevance */}
        {hasTextContent(concept.field_clinical_relevance) && (
          <Section title="Clinical Relevance" variant="tcm">
            <SafeHtml html={getTextValue(concept.field_clinical_relevance)} />
          </Section>
        )}

        <BotanicalDivider />

        {/* Cross-references — 3-column grid */}
        {(concept.field_related_patterns?.length ||
          concept.field_related_herbs?.length ||
          concept.field_related_formulas?.length) ? (
          <section className="grid md:grid-cols-3 gap-6">
            {/* Related Patterns */}
            {concept.field_related_patterns && concept.field_related_patterns.length > 0 && (
              <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-700 p-5">
                <h3 className="font-serif text-base font-bold text-gray-800 dark:text-earth-100 mb-4">
                  Related Patterns
                </h3>
                <ul className="space-y-2">
                  {concept.field_related_patterns.map(p => (
                    <li key={p.id}>
                      <Link
                        href={`/patterns/${p.id}`}
                        className="text-sm text-earth-700 dark:text-earth-300 hover:text-earth-900 dark:hover:text-earth-100 hover:underline flex items-center gap-1.5"
                      >
                        <span className="text-earth-400">›</span>
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Herbs */}
            {concept.field_related_herbs && concept.field_related_herbs.length > 0 && (
              <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-700 p-5">
                <h3 className="font-serif text-base font-bold text-gray-800 dark:text-earth-100 mb-4">
                  Related Herbs
                </h3>
                <ul className="space-y-2">
                  {concept.field_related_herbs.map(h => (
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

            {/* Related Formulas */}
            {concept.field_related_formulas && concept.field_related_formulas.length > 0 && (
              <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-700 p-5">
                <h3 className="font-serif text-base font-bold text-gray-800 dark:text-earth-100 mb-4">
                  Related Formulas
                </h3>
                <ul className="space-y-2">
                  {concept.field_related_formulas.map(f => (
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
          </section>
        ) : null}

        <BotanicalDivider className="mt-4" />
        <DisclaimerBox className="mb-8" />
        <div className="text-center">
          <BackLink href="/concepts" label="Back to TCM Concepts" />
        </div>
      </div>
    </PageWrapper>
  );
}
