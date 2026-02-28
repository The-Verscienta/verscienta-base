import { drupal } from '@/lib/drupal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { AcupointEntity } from '@/types/drupal';
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
import { NeedlingTechniquePanel } from '@/components/point/NeedlingTechniquePanel';
import { SpecialPropertiesBadges } from '@/components/point/SpecialPropertiesBadges';

export const revalidate = 300;

async function getPoint(id: string): Promise<AcupointEntity | null> {
  try {
    return await drupal.getResource<AcupointEntity>('node--acupuncture_point', id, {
      params: {
        include: 'field_meridian,field_related_conditions,field_related_herbs,field_related_formulas',
        'fields[taxonomy_term--meridian]': 'id,name,description',
        'fields[node--condition]': 'id,title',
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
    const points = await drupal.getResourceCollection<AcupointEntity[]>('node--acupuncture_point', {
      params: { 'fields[node--acupuncture_point]': 'id', 'page[limit]': 500, 'filter[status]': 1 },
    });
    return (points ?? []).map(p => ({ id: p.id }));
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
  const point = await getPoint(id);
  if (!point) return { title: 'Point Not Found — Verscienta Health' };
  const code = point.field_point_code ?? '';
  const pinyin = point.field_point_pinyin_name ?? '';
  const name = [code, pinyin, point.title].filter(Boolean).join(' — ');
  return {
    title: `${name} — Acupuncture Point — Verscienta Health`,
    description: getTextValue(point.field_indications)?.slice(0, 160) ?? `Acupuncture point ${code} with location, needling, TCM actions, and clinical indications.`,
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PointDetailPage({ params }: PageProps) {
  const { id } = await params;
  const point = await getPoint(id);
  if (!point) notFound();

  const code = point.field_point_code ?? '';
  const meridianName = point.field_meridian?.name;

  return (
    <PageWrapper>
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50/40 to-cream-100 dark:from-indigo-950 dark:via-blue-950/60 dark:to-earth-900 border-b border-indigo-200/50 dark:border-indigo-800/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Acupuncture Points', href: '/points' },
              { label: code || point.title },
            ]}
            className="mb-8"
          />

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              {/* Point code — large, prominent */}
              {code && (
                <span className="font-mono text-5xl md:text-7xl font-black text-indigo-700 dark:text-indigo-400 leading-none block mb-3">
                  {code}
                </span>
              )}

              {/* Chinese + Pinyin */}
              <div className="flex flex-wrap items-baseline gap-3 mb-3">
                {point.field_point_chinese_name && (
                  <span className="text-3xl text-gray-700 dark:text-earth-200 font-light">
                    {point.field_point_chinese_name}
                  </span>
                )}
                {point.field_point_pinyin_name && (
                  <span className="text-xl text-earth-500 dark:text-earth-400 italic">
                    {point.field_point_pinyin_name}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-earth-100 mb-4">
                {point.title}
              </h1>

              {/* Meridian + meridian number */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {meridianName && (
                  <Link href={`/points?meridian=${encodeURIComponent(meridianName)}`}>
                    <Tag variant="sage" size="sm">
                      {meridianName} Channel
                      {point.field_meridian_number ? ` · Point ${point.field_meridian_number}` : ''}
                    </Tag>
                  </Link>
                )}
                {point.field_popularity && (
                  <Tag variant="earth" size="sm">{point.field_popularity}</Tag>
                )}
                {point.field_editors_pick && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                    ★ Essential Point
                  </span>
                )}
                {point.field_beginner_friendly && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                    Beginner Friendly
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <QRCodeModal title={`${code} — ${point.title}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* Overview / body */}
        {point.body?.processed && (
          <Section title="Overview">
            <SafeHtml html={point.body.processed} />
          </Section>
        )}

        {/* Location */}
        {(point.field_location_description || point.field_location_anatomical) && (
          <Section title="Location">
            <div className="space-y-3">
              {point.field_location_description && (
                <p className="text-gray-700 dark:text-earth-200 leading-relaxed">
                  {point.field_location_description}
                </p>
              )}
              {point.field_location_anatomical && (
                <p className="text-sm text-earth-500 dark:text-earth-400 font-medium bg-earth-50 dark:bg-earth-800/50 rounded-lg px-4 py-2 border border-earth-100 dark:border-earth-700">
                  📍 {point.field_location_anatomical}
                </p>
              )}
            </div>
          </Section>
        )}

        {/* Needling Technique */}
        <NeedlingTechniquePanel point={point} />

        {/* Actions */}
        {hasTextContent(point.field_actions) && (
          <Section title="TCM Actions">
            <SafeHtml html={getTextValue(point.field_actions)} />
          </Section>
        )}

        {/* Indications */}
        {hasTextContent(point.field_indications) && (
          <Section title="Indications">
            <SafeHtml html={getTextValue(point.field_indications)} />
          </Section>
        )}

        {/* Contraindications */}
        {hasTextContent(point.field_contraindications) && (
          <Section title="Contraindications" className="border-l-4 border-red-300 dark:border-red-700 pl-4">
            <SafeHtml html={getTextValue(point.field_contraindications)} />
          </Section>
        )}

        {/* Special Properties */}
        {point.field_special_properties && point.field_special_properties.length > 0 && (
          <Section title="Point Category &amp; Special Properties">
            <SpecialPropertiesBadges properties={point.field_special_properties} />
          </Section>
        )}

        {/* Classical Notes */}
        {hasTextContent(point.field_classical_notes) && (
          <Section title="Classical References">
            <SafeHtml html={getTextValue(point.field_classical_notes)} />
          </Section>
        )}

        {/* Clinical Notes */}
        {hasTextContent(point.field_clinical_notes) && (
          <Section title="Clinical Notes">
            <SafeHtml html={getTextValue(point.field_clinical_notes)} />
          </Section>
        )}

        {/* Point Combinations */}
        {hasTextContent(point.field_combinations) && (
          <Section title="Common Combinations">
            <SafeHtml html={getTextValue(point.field_combinations)} />
          </Section>
        )}

        <BotanicalDivider />

        {/* Cross-references */}
        {(point.field_related_conditions?.length ||
          point.field_related_herbs?.length ||
          point.field_related_formulas?.length) ? (
          <section className="grid md:grid-cols-3 gap-6">
            {/* Related Conditions */}
            {point.field_related_conditions && point.field_related_conditions.length > 0 && (
              <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-700 p-5">
                <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-earth-100 mb-4">
                  Related Conditions
                </h3>
                <ul className="space-y-2">
                  {point.field_related_conditions.map(c => (
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

            {/* Related Herbs */}
            {point.field_related_herbs && point.field_related_herbs.length > 0 && (
              <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-700 p-5">
                <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-earth-100 mb-4">
                  Related Herbs
                </h3>
                <ul className="space-y-2">
                  {point.field_related_herbs.map(h => (
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
            {point.field_related_formulas && point.field_related_formulas.length > 0 && (
              <div className="bg-white dark:bg-earth-900 rounded-2xl border border-earth-200 dark:border-earth-700 p-5">
                <h3 className="font-serif text-lg font-bold text-gray-800 dark:text-earth-100 mb-4">
                  Related Formulas
                </h3>
                <ul className="space-y-2">
                  {point.field_related_formulas.map(f => (
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
          <BackLink href="/points" label="Back to Acupuncture Points" />
        </div>
      </div>
    </PageWrapper>
  );
}
