import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { drupal } from '@/lib/drupal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { HerbEntity, DrupalTextField } from '@/types/drupal';
import { herbDisplayName } from '@/lib/drupal-helpers';
import { HerbPairingsSection } from '@/components/herb/HerbPairingsSection';
import { ProcessingVariationsSection } from '@/components/herb/ProcessingVariationsSection';
import { QRCodeModal } from '@/components/ui/QRCodeModal';
import { MolecularTargetsSkeleton } from '@/components/herb/MolecularTargets';
import { DoseCalculator } from '@/components/herb/DoseCalculator';

const MolecularTargets = dynamic(
  () => import('@/components/herb/MolecularTargets').then(mod => ({ default: mod.MolecularTargets })),
  { loading: () => <MolecularTargetsSkeleton /> }
);

// ISR: revalidate every 5 minutes
export const revalidate = 300;
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SafeHtml } from '@/components/ui/SafeHtml';
import {
  PageWrapper,
  BotanicalDivider,
  Section,
  Tag,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';
import { SymbolicVerifyButton } from '@/components/ui/SymbolicVerifyButton';
import {
  popularityMap,
  onsetSpeedMap,
  costTierMap,
  palatabilityMap,
  pregnancySafetyMap,
  availabilityMap,
  bestSeasonMap,
  evidenceStrengthMap,
  getFieldConfig,
} from '@/lib/decision-field-maps';

// Helper to extract text value from Drupal text field
function getTextValue(field: DrupalTextField): string | null {
  if (!field) return null;
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && 'value' in field) return field.value;
  return null;
}

interface HerbDetailProps {
  params: Promise<{
    id: string;
  }>;
}

async function getHerb(id: string): Promise<HerbEntity | null> {
  try {
    const herb = await drupal.getResource<HerbEntity>('node--herb', id, {
      params: {
        'include': 'field_images,field_herb_pairings,field_herb_pairings.field_partner_herb,field_herb_pairings.field_example_formula,field_processing_variations',
      },
    });
    return herb;
  } catch (error) {
    console.error('Failed to fetch herb:', error);
    return null;
  }
}

export async function generateMetadata({ params }: HerbDetailProps): Promise<Metadata> {
  const { id } = await params;
  const herb = await getHerb(id);

  if (!herb) {
    return { title: 'Herb Not Found - Verscienta Health' };
  }

  const name = herb.title || 'Herb';
  const scientific = herb.field_scientific_name ? ` (${herb.field_scientific_name})` : '';
  const description = herb.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 160)
    || `Learn about ${name}${scientific} — uses, dosage, safety, and traditional properties.`;

  return {
    title: `${name}${scientific} - Medicinal Herb - Verscienta Health`,
    description,
  };
}

export default async function HerbDetailPage({ params }: HerbDetailProps) {
  const { id } = await params;
  const herb = await getHerb(id);

  if (!herb) {
    notFound();
  }

  const name = herb.title || 'Herb';

  // Build table of contents
  const tocItems: { id: string; label: string }[] = [];
  if (herb.body?.value) tocItems.push({ id: 'overview', label: 'Overview' });
  if (herb.field_botanical_description || herb.field_native_region || herb.field_habitat) {
    tocItems.push({ id: 'botanical', label: 'Botanical' });
  }
  if (herb.field_tcm_properties) tocItems.push({ id: 'tcm', label: 'TCM Properties' });
  if (herb.field_therapeutic_uses?.value || herb.field_western_properties) {
    tocItems.push({ id: 'therapeutic', label: 'Therapeutic Uses' });
  }
  if (herb.field_active_constituents?.length) tocItems.push({ id: 'constituents', label: 'Constituents' });
  if (herb.field_recommended_dosage?.length) tocItems.push({ id: 'dosage', label: 'Dosage' });
  if (herb.field_contraindications?.value || herb.field_side_effects?.value || herb.field_drug_interactions?.length) {
    tocItems.push({ id: 'safety', label: 'Safety' });
  }
  if (herb.field_traditional_chinese_uses?.value || herb.field_traditional_american_uses?.value) {
    tocItems.push({ id: 'traditional', label: 'Traditional Uses' });
  }
  if (herb.field_cultural_significance?.value || herb.field_folklore?.value) {
    tocItems.push({ id: 'cultural', label: 'Cultural Context' });
  }
  if (herb.field_preparation_methods?.length) tocItems.push({ id: 'preparation', label: 'Preparation' });
  if (herb.field_popularity || herb.field_cost_tier || herb.field_availability || herb.field_palatability || herb.field_pregnancy_safety || herb.field_best_season) {
    tocItems.push({ id: 'practical', label: 'Practical Info' });
  }

  return (
    <PageWrapper>
    <div className="min-h-screen bg-gradient-to-b from-earth-50 via-white to-sage-50 dark:from-earth-950 dark:via-earth-900 dark:to-sage-950">
      {/* Decorative background pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-2 8-8 14-16 16 8 2 14 8 16 16 2-8 8-14 16-16-8-2-14-8-16-16z' fill='%23527a5f' fill-opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Materia Medica', href: '/herbs' },
            { label: name },
          ]}
          className="mb-8"
        />

        {/* Hero Section */}
        <header className="relative mb-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-earth-900 rounded-3xl shadow-xl border border-earth-200 dark:border-earth-700 relative overflow-hidden">
                {/* Hero image or decorative fallback */}
                {herb.field_images?.[0] && (herb.field_images[0].uri?.url || herb.field_images[0].url) ? (
                  <div className="relative w-full h-64 md:h-80">
                    <Image
                      src={herb.field_images[0].uri?.url || herb.field_images[0].url!}
                      alt={herb.field_images[0].meta?.alt || name}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                  </div>
                ) : (
                  <div className="absolute -right-12 -top-12 w-64 h-64 opacity-5">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-earth-600">
                      <path d="M100 20c0 40-30 80-30 120s30 40 30 40 30 0 30-40-30-80-30-120z" fill="currentColor"/>
                      <path d="M60 100c30-20 70-20 80 0" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M50 120c40-30 90-30 100 0" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                )}

                {/* Conservation status badge */}
                {herb.field_conservation_status && (
                  <div className="absolute top-6 right-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                      herb.field_conservation_status === 'endangered'
                        ? 'bg-red-500 text-white'
                        : herb.field_conservation_status === 'vulnerable'
                        ? 'bg-amber-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse" />
                      {herb.field_conservation_status.charAt(0).toUpperCase() + herb.field_conservation_status.slice(1)}
                    </span>
                  </div>
                )}

                <div className="relative p-8 md:p-12">
                  {/* Common name */}
                  <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-earth-100 mb-4 tracking-tight">
                    {herbDisplayName(name, herb.field_herb_pinyin_name, herb.field_herb_chinese_name)}
                  </h1>

                  {/* Scientific name */}
                  {herb.field_scientific_name && (
                    <p className="text-2xl md:text-3xl text-sage-600 italic mb-6 font-serif">
                      {herb.field_scientific_name}
                    </p>
                  )}

                  {/* Family */}
                  {herb.field_family && (
                    <p className="text-lg text-gray-600 dark:text-earth-300 mb-8">
                      <span className="font-medium">Family:</span>{' '}
                      <span className="font-serif italic">{herb.field_family}</span>
                    </p>
                  )}

                  <BotanicalDivider />

                  {/* Quick info grid */}
                  <div className="grid sm:grid-cols-2 gap-6 mt-6">
                    {/* Common Names */}
                    {herb.field_common_names && herb.field_common_names.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-3">
                          Also Known As
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {herb.field_common_names.slice(0, 5).map((nameObj, idx) => (
                            <Tag key={idx} variant="sage">
                              {nameObj.field_name_text}
                              {nameObj.field_language && (
                                <span className="text-sage-500 ml-1 text-xs">({nameObj.field_language})</span>
                              )}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Parts Used */}
                    {herb.field_parts_used && herb.field_parts_used.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-3">
                          Parts Used
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {herb.field_parts_used.map((part, idx) => (
                            <Tag key={idx} variant="earth">{part}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Facts Tags */}
                  {(herb.field_popularity || herb.field_beginner_friendly || herb.field_editors_pick || herb.field_onset_speed || herb.field_evidence_strength) && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {herb.field_editors_pick && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                          &#9733; Editor&apos;s Pick
                        </span>
                      )}
                      {herb.field_popularity && (() => { const c = getFieldConfig(popularityMap, herb.field_popularity); return c ? (
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>
                          {c.icon && <span>{c.icon}</span>}{c.label}
                        </span>
                      ) : null; })()}
                      {herb.field_beginner_friendly && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                          Beginner Friendly
                        </span>
                      )}
                      {herb.field_onset_speed && (() => { const c = getFieldConfig(onsetSpeedMap, herb.field_onset_speed); return c ? (
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>
                          {c.icon && <span>{c.icon}</span>}{c.label}
                        </span>
                      ) : null; })()}
                      {herb.field_evidence_strength && (() => { const c = getFieldConfig(evidenceStrengthMap, herb.field_evidence_strength); return c ? (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>
                          {c.label}
                        </span>
                      ) : null; })()}
                    </div>
                  )}

                  {/* Hero action bar */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <QRCodeModal title={name} />
                  </div>
                </div>
              </div>

              {/* Image Gallery (if multiple images) */}
              {herb.field_images && herb.field_images.length > 1 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {herb.field_images.slice(1).map((image, idx) => {
                    const imgUrl = image.uri?.url || image.url;
                    if (!imgUrl) return null;
                    return (
                      <div key={image.id || idx} className="relative aspect-square rounded-xl overflow-hidden border border-earth-200 dark:border-earth-700 shadow-sm">
                        <Image
                          src={imgUrl}
                          alt={image.meta?.alt || `${name} image ${idx + 2}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar - Table of Contents */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <nav className="bg-white/80 dark:bg-earth-900/80 backdrop-blur-sm rounded-2xl border border-earth-200 dark:border-earth-700 p-6 shadow-lg">
                <h3 className="text-sm font-bold text-earth-500 dark:text-earth-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h12"/>
                  </svg>
                  Contents
                </h3>
                <ul className="space-y-2">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block py-2 px-3 text-sm text-earth-600 dark:text-earth-300 hover:text-gray-900 dark:hover:text-earth-100 hover:bg-earth-50 dark:hover:bg-earth-800 rounded-lg transition-colors font-medium"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          </div>
        </header>

        {/* Main Content */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <main className="lg:col-span-2 space-y-8">

            {/* Overview */}
            {herb.body?.value && (
              <Section id="overview" title="Overview" icon="📖">
                <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-gray-800 dark:prose-headings:text-earth-100 prose-a:text-sage-600">
                  <SafeHtml html={herb.body.value} />
                </div>
              </Section>
            )}

            {/* Botanical Information */}
            {(herb.field_botanical_description || herb.field_native_region || herb.field_habitat) && (
              <Section id="botanical" title="Botanical Information" icon="🌱">
                {getTextValue(herb.field_botanical_description as DrupalTextField) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-earth-700 dark:text-earth-300 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                      Description
                    </h3>
                    <div className="prose max-w-none text-gray-700 dark:text-earth-200">
                      <SafeHtml html={getTextValue(herb.field_botanical_description as DrupalTextField)!} />
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {herb.field_native_region && herb.field_native_region.length > 0 && (
                    <div className="bg-sage-50/50 dark:bg-sage-950/50 rounded-xl p-5 border border-sage-100 dark:border-sage-800">
                      <h3 className="text-sm font-bold text-sage-700 dark:text-sage-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        Native Regions
                      </h3>
                      <ul className="space-y-1.5">
                        {herb.field_native_region.map((region, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-gray-700 dark:text-earth-200">
                            <span className="w-1 h-1 rounded-full bg-sage-400" />
                            {region}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {getTextValue(herb.field_habitat as DrupalTextField) && (
                    <div className="bg-earth-50/50 dark:bg-earth-950/50 rounded-xl p-5 border border-earth-100 dark:border-earth-700">
                      <h3 className="text-sm font-bold text-earth-700 dark:text-earth-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
                        </svg>
                        Habitat
                      </h3>
                      <div className="prose prose-sm max-w-none text-gray-700 dark:text-earth-200">
                        <SafeHtml html={getTextValue(herb.field_habitat as DrupalTextField)!} />
                      </div>
                    </div>
                  )}
                </div>

                {getTextValue(herb.field_conservation_notes as DrupalTextField) && (
                  <div className="mt-6 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 rounded-r-xl p-5">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      Conservation Notes
                    </h3>
                    <div className="prose prose-sm max-w-none text-amber-900 dark:text-amber-200">
                      <SafeHtml html={getTextValue(herb.field_conservation_notes as DrupalTextField)!} />
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* TCM Properties */}
            {herb.field_tcm_properties && (
              <Section id="tcm" title="Traditional Chinese Medicine" icon="☯️" variant="tcm">
                <div className="grid md:grid-cols-2 gap-6">
                  {herb.field_tcm_properties.field_tcm_taste && herb.field_tcm_properties.field_tcm_taste.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-3">Taste (味 Wèi)</h3>
                      <div className="flex flex-wrap gap-2">
                        {herb.field_tcm_properties.field_tcm_taste.map((taste, idx) => (
                          <Tag key={idx} variant="amber">{taste}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {herb.field_tcm_properties.field_tcm_temperature && (
                    <div>
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-3">Temperature (性 Xìng)</h3>
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                        herb.field_tcm_properties.field_tcm_temperature.toLowerCase().includes('cold')
                          ? 'bg-blue-500 text-white'
                          : herb.field_tcm_properties.field_tcm_temperature.toLowerCase().includes('cool')
                          ? 'bg-cyan-400 text-cyan-900'
                          : herb.field_tcm_properties.field_tcm_temperature.toLowerCase().includes('warm')
                          ? 'bg-orange-400 text-orange-900'
                          : herb.field_tcm_properties.field_tcm_temperature.toLowerCase().includes('hot')
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-400 text-white'
                      }`}>
                        {herb.field_tcm_properties.field_tcm_temperature}
                      </span>
                    </div>
                  )}

                  {herb.field_tcm_properties.field_tcm_meridians && herb.field_tcm_properties.field_tcm_meridians.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-3">Meridians (經絡 Jīngluò)</h3>
                      <div className="flex flex-wrap gap-2">
                        {herb.field_tcm_properties.field_tcm_meridians.map((meridian, idx) => (
                          <Tag key={idx} variant="purple">{meridian}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {herb.field_tcm_properties.field_tcm_category && (
                    <div>
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-3">Category</h3>
                      <Tag variant="orange">{herb.field_tcm_properties.field_tcm_category}</Tag>
                    </div>
                  )}
                </div>

                {getTextValue(herb.field_tcm_properties.field_tcm_functions as DrupalTextField) && (
                  <div className="mt-6 pt-6 border-t border-amber-200 dark:border-amber-800">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-3">Functions & Indications</h3>
                    <div className="prose max-w-none text-amber-900 dark:text-amber-200">
                      <SafeHtml html={getTextValue(herb.field_tcm_properties.field_tcm_functions as DrupalTextField)!} />
                    </div>
                  </div>
                )}

                {/* Tongue & Pulse Diagnosis */}
                {(herb.field_tongue_indication || herb.field_pulse_indication) && (
                  <div className="mt-6 pt-6 border-t border-amber-200 dark:border-amber-800">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-4">Tongue & Pulse Diagnosis</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {herb.field_tongue_indication && (
                        <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900">
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <span>👅</span> Tongue Indication
                          </p>
                          <p className="text-sm text-amber-900 dark:text-amber-200">{herb.field_tongue_indication}</p>
                        </div>
                      )}
                      {herb.field_pulse_indication && (
                        <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-100 dark:border-amber-900">
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <span>💓</span> Pulse Indication
                          </p>
                          <p className="text-sm text-amber-900 dark:text-amber-200">{herb.field_pulse_indication}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Therapeutic Uses */}
            {(herb.field_therapeutic_uses?.value || herb.field_western_properties) && (
              <Section id="therapeutic" title="Therapeutic Uses" icon="💊">
                {herb.field_therapeutic_uses?.value && (
                  <div className="mb-6 prose prose-lg max-w-none">
                    <SafeHtml html={herb.field_therapeutic_uses.value} />
                  </div>
                )}

                {herb.field_western_properties && herb.field_western_properties.length > 0 && (
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                    <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-4">
                      Western Herbal Properties
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {herb.field_western_properties.map((prop, idx) => (
                        <Tag key={idx} variant="blue">{prop}</Tag>
                      ))}
                    </div>
                  </div>
                )}

                {herb.field_pharmacological_effects?.value && (
                  <div className="mt-6 pt-6 border-t border-earth-200 dark:border-earth-700">
                    <h3 className="text-lg font-semibold text-earth-700 dark:text-earth-300 mb-3">Pharmacological Effects</h3>
                    <div className="prose max-w-none">
                      <SafeHtml html={herb.field_pharmacological_effects.value} />
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Active Constituents */}
            {herb.field_active_constituents && herb.field_active_constituents.length > 0 && (
              <Section id="constituents" title="Active Constituents" icon="🔬">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-earth-200 dark:border-earth-700">
                        <th className="text-left py-3 px-4 font-bold text-gray-800 dark:text-earth-100 text-sm uppercase tracking-wider">Compound</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-800 dark:text-earth-100 text-sm uppercase tracking-wider">Class</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-800 dark:text-earth-100 text-sm uppercase tracking-wider">%</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-800 dark:text-earth-100 text-sm uppercase tracking-wider">Effects</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-earth-100 dark:divide-earth-700">
                      {herb.field_active_constituents.map((constituent, idx) => (
                        <tr key={idx} className="hover:bg-earth-50/50 dark:hover:bg-earth-800/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-gray-900 dark:text-earth-100">{constituent.field_compound_name}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-earth-300">{constituent.field_compound_class || '—'}</td>
                          <td className="py-3 px-4 text-right font-mono text-gray-600 dark:text-earth-300">
                            {constituent.field_compound_percentage ? `${constituent.field_compound_percentage}%` : '—'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-earth-300 text-sm">{constituent.field_compound_effects || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* Dosage */}
            {herb.field_recommended_dosage && herb.field_recommended_dosage.length > 0 && (
              <Section id="dosage" title="Recommended Dosage" icon="⚖️">
                <div className="grid gap-4">
                  {herb.field_recommended_dosage.map((dosage, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-sage-50 to-earth-50 dark:from-sage-950 dark:to-earth-950 rounded-xl p-5 border border-sage-200 dark:border-sage-800 hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-gray-800 dark:text-earth-100">{dosage.field_dosage_form}</span>
                        {dosage.field_dosage_population && (
                          <span className="text-xs font-semibold bg-sage-200 dark:bg-sage-800 text-sage-800 dark:text-sage-200 px-2 py-1 rounded-full">
                            {dosage.field_dosage_population}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-earth-200 text-lg">
                        <span className="font-semibold">{dosage.field_dosage_amount}</span>
                        {dosage.field_dosage_frequency && (
                          <span className="text-earth-500"> — {dosage.field_dosage_frequency}</span>
                        )}
                      </p>
                      {dosage.field_dosage_notes && (
                        <p className="text-sm text-earth-500 mt-2 italic">{dosage.field_dosage_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  <SymbolicVerifyButton herbId={name} />
                  <DoseCalculator herbName={name} />
                </div>
              </Section>
            )}

            {/* Safety Information */}
            {(herb.field_contraindications?.value ||
              herb.field_side_effects?.value ||
              herb.field_drug_interactions ||
              herb.field_toxicity_info ||
              herb.field_safety_warnings) && (
              <Section id="safety" title="Safety Information" icon="⚠️" variant="warning">
                {herb.field_contraindications?.value && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      Contraindications
                    </h3>
                    <div className="prose max-w-none text-red-900 dark:text-red-200">
                      <SafeHtml html={herb.field_contraindications.value} />
                    </div>
                  </div>
                )}

                {herb.field_side_effects?.value && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200 mb-3">Possible Side Effects</h3>
                    <div className="prose max-w-none text-orange-900 dark:text-orange-200">
                      <SafeHtml html={herb.field_side_effects.value} />
                    </div>
                  </div>
                )}

                {herb.field_drug_interactions && herb.field_drug_interactions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-3">Drug Interactions</h3>
                    <div className="space-y-3">
                      {herb.field_drug_interactions.map((interaction, idx) => (
                        <div key={idx} className="bg-white dark:bg-earth-900 rounded-lg p-4 border border-red-200 dark:border-red-800 shadow-sm">
                          <p className="font-bold text-red-900 dark:text-red-200">{interaction.field_drug_name}</p>
                          <p className="text-sm font-semibold text-red-600 dark:text-red-300 mt-1">
                            Interaction: {interaction.field_interaction_type}
                          </p>
                          <p className="text-sm text-red-800 dark:text-red-300 mt-2">{interaction.field_interaction_description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {herb.field_toxicity_info && (
                  <div className="mb-6 bg-red-100 dark:bg-red-950/30 rounded-xl p-5 border border-red-300 dark:border-red-800">
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-3">Toxicity Information</h3>
                    <dl className="space-y-2">
                      {herb.field_toxicity_info.field_toxicity_level && (
                        <div className="flex gap-2">
                          <dt className="font-semibold text-red-800 dark:text-red-300">Level:</dt>
                          <dd className="text-red-900 dark:text-red-200">{herb.field_toxicity_info.field_toxicity_level}</dd>
                        </div>
                      )}
                      {herb.field_toxicity_info.field_toxic_compounds && (
                        <div className="flex gap-2">
                          <dt className="font-semibold text-red-800 dark:text-red-300">Compounds:</dt>
                          <dd className="text-red-900 dark:text-red-200">{herb.field_toxicity_info.field_toxic_compounds}</dd>
                        </div>
                      )}
                      {herb.field_toxicity_info.field_toxic_symptoms && (
                        <div className="flex gap-2">
                          <dt className="font-semibold text-red-800 dark:text-red-300">Symptoms:</dt>
                          <dd className="text-red-900 dark:text-red-200">{herb.field_toxicity_info.field_toxic_symptoms}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                {herb.field_safety_warnings && herb.field_safety_warnings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-red-800 mb-3">Safety Warnings</h3>
                    <div className="space-y-3">
                      {herb.field_safety_warnings.map((warning, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg p-4 border-l-4 ${
                            warning.field_warning_severity === 'severe'
                              ? 'bg-red-100 border-red-600'
                              : warning.field_warning_severity === 'moderate'
                              ? 'bg-orange-100 border-orange-500'
                              : 'bg-yellow-100 border-yellow-500'
                          }`}
                        >
                          <p className="font-bold">{warning.field_warning_type}</p>
                          <p className="text-sm mt-1">{warning.field_warning_description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Herb Pairings */}
            <HerbPairingsSection pairings={herb.field_herb_pairings ?? []} />

            {/* Processing Variations (Paozhi) */}
            <ProcessingVariationsSection variations={herb.field_processing_variations ?? []} />

            {/* Molecular Targets (BATMAN-TCM data) */}
            <Suspense fallback={<MolecularTargetsSkeleton />}>
              <MolecularTargets herbId={herb.id} />
            </Suspense>

            {/* Traditional Uses */}
            {(herb.field_traditional_chinese_uses?.value ||
              herb.field_traditional_american_uses?.value ||
              herb.field_native_american_uses?.value) && (
              <Section id="traditional" title="Traditional Uses" icon="📜">
                <div className="space-y-6">
                  {herb.field_traditional_chinese_uses?.value && (
                    <div className="bg-red-50/30 rounded-xl p-6 border border-red-100">
                      <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-3">
                        <span className="text-2xl">🇨🇳</span> Traditional Chinese Uses
                      </h3>
                      <div className="prose max-w-none text-red-900">
                        <SafeHtml html={herb.field_traditional_chinese_uses.value} />
                      </div>
                    </div>
                  )}

                  {herb.field_traditional_american_uses?.value && (
                    <div className="bg-blue-50/30 rounded-xl p-6 border border-blue-100">
                      <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-3">
                        <span className="text-2xl">🇺🇸</span> Traditional American Uses
                      </h3>
                      <div className="prose max-w-none text-blue-900">
                        <SafeHtml html={herb.field_traditional_american_uses.value} />
                      </div>
                    </div>
                  )}

                  {herb.field_native_american_uses?.value && (
                    <div className="bg-amber-50/30 rounded-xl p-6 border border-amber-100">
                      <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-3">
                        <span className="text-2xl">🪶</span> Native American Uses
                      </h3>
                      <div className="prose max-w-none text-amber-900">
                        <SafeHtml html={herb.field_native_american_uses.value} />
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Cultural Context */}
            {(herb.field_cultural_significance?.value ||
              herb.field_folklore?.value ||
              herb.field_ethnobotanical_notes?.value) && (
              <Section id="cultural" title="Cultural & Historical Context" icon="🏛️" variant="cultural">
                {herb.field_cultural_significance?.value && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-earth-700 mb-3">Cultural Significance</h3>
                    <div className="prose max-w-none">
                      <SafeHtml html={herb.field_cultural_significance.value} />
                    </div>
                  </div>
                )}

                {herb.field_folklore?.value && (
                  <div className="mb-6 bg-gold-50/50 rounded-xl p-6 border border-gold-200">
                    <h3 className="text-lg font-semibold text-gold-800 mb-3 flex items-center gap-2">
                      <span>✨</span> Folklore & Legends
                    </h3>
                    <div className="prose max-w-none text-gold-900 italic">
                      <SafeHtml html={herb.field_folklore.value} />
                    </div>
                  </div>
                )}

                {herb.field_ethnobotanical_notes?.value && (
                  <div>
                    <h3 className="text-lg font-semibold text-earth-700 mb-3">Ethnobotanical Notes</h3>
                    <div className="prose max-w-none">
                      <SafeHtml html={herb.field_ethnobotanical_notes.value} />
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Preparation Methods */}
            {herb.field_preparation_methods && herb.field_preparation_methods.length > 0 && (
              <Section id="preparation" title="Preparation Methods" icon="🫖">
                <div className="grid md:grid-cols-2 gap-4">
                  {herb.field_preparation_methods.map((method, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-sage-50 to-earth-50 rounded-xl p-5 border border-sage-200 hover:shadow-lg transition-all hover:-translate-y-1">
                      <h3 className="font-bold text-gray-800 dark:text-earth-100 text-lg mb-2">{method.field_method_type}</h3>
                      <p className="text-gray-700 dark:text-earth-300 text-sm leading-relaxed">{method.field_method_instructions}</p>
                      {method.field_method_time && (
                        <p className="text-sage-600 text-sm mt-3 font-medium flex items-center gap-2">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                          </svg>
                          {method.field_method_time}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Practical Information */}
            {(herb.field_cost_tier || herb.field_availability || herb.field_palatability || herb.field_best_season || herb.field_pregnancy_safety) && (
              <Section id="practical" title="Practical Information" icon="&#x1F4CB;">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {herb.field_cost_tier && (() => { const c = getFieldConfig(costTierMap, herb.field_cost_tier); return c ? (
                    <div className="bg-white dark:bg-earth-900 rounded-xl p-5 border border-earth-100 dark:border-earth-700 shadow-sm">
                      <h3 className="text-xs font-bold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-2">Cost</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                    </div>
                  ) : null; })()}
                  {herb.field_availability && (() => { const c = getFieldConfig(availabilityMap, herb.field_availability); return c ? (
                    <div className="bg-white dark:bg-earth-900 rounded-xl p-5 border border-earth-100 dark:border-earth-700 shadow-sm">
                      <h3 className="text-xs font-bold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-2">Availability</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                    </div>
                  ) : null; })()}
                  {herb.field_palatability && (() => { const c = getFieldConfig(palatabilityMap, herb.field_palatability); return c ? (
                    <div className="bg-white dark:bg-earth-900 rounded-xl p-5 border border-earth-100 dark:border-earth-700 shadow-sm">
                      <h3 className="text-xs font-bold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-2">Taste</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                    </div>
                  ) : null; })()}
                  {herb.field_best_season && (() => { const c = getFieldConfig(bestSeasonMap, herb.field_best_season); return c ? (
                    <div className="bg-white dark:bg-earth-900 rounded-xl p-5 border border-earth-100 dark:border-earth-700 shadow-sm">
                      <h3 className="text-xs font-bold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-2">Best Season</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                    </div>
                  ) : null; })()}
                  {herb.field_pregnancy_safety && (() => { const c = getFieldConfig(pregnancySafetyMap, herb.field_pregnancy_safety); return c ? (
                    <div className="bg-white dark:bg-earth-900 rounded-xl p-5 border border-earth-100 dark:border-earth-700 shadow-sm">
                      <h3 className="text-xs font-bold text-earth-500 dark:text-earth-400 uppercase tracking-wider mb-2">Pregnancy Safety</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>{c.label}</span>
                    </div>
                  ) : null; })()}
                </div>
              </Section>
            )}

            {/* Storage & Sourcing */}
            {(herb.field_storage_requirements || herb.field_sourcing_info) && (
              <Section id="storage" title="Storage & Sourcing" icon="📦">
                <div className="grid md:grid-cols-2 gap-6">
                  {herb.field_storage_requirements && (
                    <div className="bg-earth-50/50 dark:bg-earth-900/50 rounded-xl p-5 border border-earth-100 dark:border-earth-700">
                      <h3 className="text-sm font-bold text-earth-700 dark:text-earth-300 uppercase tracking-wider mb-4">Storage Requirements</h3>
                      <dl className="space-y-3">
                        {herb.field_storage_requirements.field_storage_conditions && (
                          <div>
                            <dt className="text-xs font-semibold text-earth-500 dark:text-earth-400 uppercase">Conditions</dt>
                            <dd className="text-gray-800 dark:text-earth-200">{herb.field_storage_requirements.field_storage_conditions}</dd>
                          </div>
                        )}
                        {herb.field_storage_requirements.field_shelf_life && (
                          <div>
                            <dt className="text-xs font-semibold text-earth-500 dark:text-earth-400 uppercase">Shelf Life</dt>
                            <dd className="text-gray-800 dark:text-earth-200">{herb.field_storage_requirements.field_shelf_life}</dd>
                          </div>
                        )}
                        {herb.field_storage_requirements.field_storage_temperature && (
                          <div>
                            <dt className="text-xs font-semibold text-earth-500 dark:text-earth-400 uppercase">Temperature</dt>
                            <dd className="text-gray-800 dark:text-earth-200">{herb.field_storage_requirements.field_storage_temperature}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {herb.field_sourcing_info && (
                    <div className="bg-sage-50/50 dark:bg-sage-900/20 rounded-xl p-5 border border-sage-100 dark:border-sage-800">
                      <h3 className="text-sm font-bold text-sage-700 dark:text-sage-300 uppercase tracking-wider mb-4">Sourcing Information</h3>
                      <dl className="space-y-3">
                        {herb.field_sourcing_info.field_sourcing_type && (
                          <div>
                            <dt className="text-xs font-semibold text-sage-500 dark:text-sage-400 uppercase">Type</dt>
                            <dd className="text-sage-800 dark:text-sage-200">{herb.field_sourcing_info.field_sourcing_type}</dd>
                          </div>
                        )}
                        {herb.field_sourcing_info.field_organic_available !== undefined && (
                          <div>
                            <dt className="text-xs font-semibold text-sage-500 dark:text-sage-400 uppercase">Organic Available</dt>
                            <dd className="text-sage-800 dark:text-sage-200">{herb.field_sourcing_info.field_organic_available ? 'Yes' : 'No'}</dd>
                          </div>
                        )}
                        {herb.field_sourcing_info.field_sustainable_harvest && (
                          <div>
                            <dt className="text-xs font-semibold text-sage-500 dark:text-sage-400 uppercase">Sustainability</dt>
                            <dd className="text-sage-800 dark:text-sage-200">{herb.field_sourcing_info.field_sustainable_harvest}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Related Content */}
            {((herb.field_conditions_treated && herb.field_conditions_treated.length > 0) ||
              (herb.field_related_species && herb.field_related_species.length > 0) ||
              (herb.field_substitute_herbs && herb.field_substitute_herbs.length > 0)) && (
              <Section id="related" title="Related Information" icon="🔗">
                {herb.field_conditions_treated && herb.field_conditions_treated.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-earth-600 uppercase tracking-wider mb-3">Conditions Treated</h3>
                    <div className="flex flex-wrap gap-2">
                      {herb.field_conditions_treated.map((condition) => (
                        <Link
                          key={condition.id}
                          href={`/conditions/${condition.id}`}
                          className="inline-flex items-center gap-2 bg-sage-100 hover:bg-sage-200 text-sage-800 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-md"
                        >
                          {condition.title || 'View Condition'}
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {herb.field_related_species && herb.field_related_species.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-earth-600 uppercase tracking-wider mb-3">Related Species</h3>
                    <div className="flex flex-wrap gap-2">
                      {herb.field_related_species.map((species) => (
                        <Link
                          key={species.id}
                          href={`/herbs/${species.id}`}
                          className="inline-flex items-center gap-2 bg-earth-100 hover:bg-earth-200 dark:bg-earth-800 dark:hover:bg-earth-700 text-gray-800 dark:text-earth-200 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-md"
                        >
                          {species.title || 'View Herb'}
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {herb.field_substitute_herbs && herb.field_substitute_herbs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-earth-600 uppercase tracking-wider mb-3">Substitute Herbs</h3>
                    <div className="flex flex-wrap gap-2">
                      {herb.field_substitute_herbs.map((substitute) => (
                        <Link
                          key={substitute.id}
                          href={`/herbs/${substitute.id}`}
                          className="inline-flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-md"
                        >
                          {substitute.title || 'View Herb'}
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            <BotanicalDivider />

            <DisclaimerBox />

            <div className="py-8">
              <BackLink href="/herbs" label="Back to Materia Medica" />
            </div>
          </main>

          {/* Right column spacer for layout balance */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </div>
    </PageWrapper>
  );
}
