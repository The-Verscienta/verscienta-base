import { drupal } from '@/lib/drupal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { ModalityEntity } from '@/types';

// ISR: revalidate every 5 minutes
export const revalidate = 300;
import {
  PageWrapper,
  LeafPattern,
  Section,
  BotanicalDivider,
  Tag,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';
import { getFieldConfig } from '@/lib/decision-field-maps';

interface ModalityDetailProps {
  params: Promise<{
    id: string;
  }>;
}

async function getModality(id: string): Promise<ModalityEntity | null> {
  try {
    const modality = await drupal.getResource<ModalityEntity>('node--modality', id);
    return modality;
  } catch (error) {
    console.error('Failed to fetch modality:', error);
    return null;
  }
}

// Modality icon - healing/hands
function ModalityIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <circle cx="24" cy="24" r="20" fill="url(#modGrad)" opacity="0.1" />
      <path
        d="M24 12c-6 4-10 8-10 14a10 10 0 0020 0c0-6-4-10-10-14z"
        fill="url(#modGrad)"
        opacity="0.25"
      />
      <circle cx="24" cy="22" r="6" stroke="url(#modGrad)" strokeWidth="2" fill="none" />
      <path d="M24 16v-4M24 32v4M18 22h-4M30 22h4" stroke="url(#modGrad)" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="modGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a7c59" />
          <stop offset="100%" stopColor="#6b8f71" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export async function generateMetadata({ params }: ModalityDetailProps): Promise<Metadata> {
  const { id } = await params;
  const modality = await getModality(id);

  if (!modality) {
    return { title: 'Modality Not Found - Verscienta Health' };
  }

  const name = modality.title || 'Modality';
  const description = modality.body?.processed?.replace(/<[^>]*>/g, '').slice(0, 160)
    || `Learn about ${name} — a holistic healing modality. Benefits, evidence, and how it works.`;

  return {
    title: `${name} - Healing Modality - Verscienta Health`,
    description,
  };
}

export default async function ModalityDetailPage({ params }: ModalityDetailProps) {
  const { id } = await params;
  const modality = await getModality(id);

  if (!modality) {
    notFound();
  }

  const title = modality.title || 'Modality';
  const description = modality.body?.value || (modality as { field_description?: string }).field_description;

  return (
    <PageWrapper>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 border-b border-sage-200/50">
        <LeafPattern opacity={0.04} />
        <div className="absolute top-20 left-10 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Modalities', href: '/modalities' },
              { label: title },
            ]}
            className="mb-8"
          />

          <div className="bg-white rounded-3xl shadow-xl border border-earth-200 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-64 h-64 opacity-5 pointer-events-none">
              <ModalityIcon />
            </div>
            <div className="relative p-8 md:p-12">
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-earth-900 mb-4 tracking-tight">
                {title}
              </h1>

              {(modality.field_excels_at?.length || modality.field_editors_pick || modality.field_self_practice) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {modality.field_editors_pick && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      &#9733; Editor&apos;s Pick
                    </span>
                  )}
                  {modality.field_self_practice && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      Can Self-Practice
                    </span>
                  )}
                  {modality.field_excels_at?.map((item: string, idx: number) => (
                    <Tag key={idx} variant="sage" size="md">
                      {item}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {description && (
          <Section
            id="overview"
            variant="default"
            title="Overview"
            icon={
              <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            <div className="prose max-w-none text-earth-700">
              {typeof description === 'string' && description.startsWith('<') ? (
                <SafeHtml html={description} />
              ) : (
                <p className="whitespace-pre-wrap">{description}</p>
              )}
            </div>
          </Section>
        )}

        {modality.field_excels_at && modality.field_excels_at.length > 0 && (
          <Section
            id="excels-at"
            variant="feature"
            title="This Modality Excels At"
            icon="✓"
          >
            <div className="grid md:grid-cols-2 gap-4">
              {modality.field_excels_at.map((item: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-white/60 p-4 rounded-xl border border-sage-200"
                >
                  <span className="text-sage-600 text-xl">✓</span>
                  <span className="text-earth-800">{item}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {modality.field_benefits && (
          <Section
            id="benefits"
            variant="cultural"
            title="Benefits"
            icon={
              <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            <div className="prose max-w-none">
              {typeof modality.field_benefits === 'string' ? (
                <p className="text-earth-700 whitespace-pre-wrap">{modality.field_benefits}</p>
              ) : (
                <p className="text-earth-700">{String(modality.field_benefits)}</p>
              )}
            </div>
          </Section>
        )}

        {modality.field_conditions && modality.field_conditions.length > 0 && (
          <Section
            id="conditions"
            variant="card"
            title="May Help With These Conditions"
            icon="🩺"
          >
            <div className="grid md:grid-cols-2 gap-4">
              {modality.field_conditions.map((condition: { id: string; title?: string }) => (
                <Link
                  key={condition.id}
                  href={`/conditions/${condition.id}`}
                  className="flex items-center gap-3 bg-earth-50 hover:bg-earth-100 p-4 rounded-xl border border-earth-200 transition"
                >
                  <span className="text-earth-600">🩺</span>
                  <span className="text-earth-800 font-medium">{condition.title || 'View Condition'}</span>
                  <svg className="w-5 h-5 text-earth-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Session Details */}
        {(modality.field_session_cost_range || modality.field_sessions_needed || (modality.field_pairs_well_with && modality.field_pairs_well_with.length > 0)) && (
          <Section
            id="session-details"
            variant="default"
            title="Session Details"
            icon={
              <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            <div className="grid md:grid-cols-2 gap-4">
              {modality.field_session_cost_range && (
                <div className="bg-white rounded-xl p-5 border border-earth-100 shadow-sm">
                  <h3 className="text-xs font-bold text-earth-500 uppercase tracking-wider mb-2">Cost Range</h3>
                  <p className="text-lg font-semibold text-earth-800">{modality.field_session_cost_range}</p>
                </div>
              )}
              {modality.field_sessions_needed && (
                <div className="bg-white rounded-xl p-5 border border-earth-100 shadow-sm">
                  <h3 className="text-xs font-bold text-earth-500 uppercase tracking-wider mb-2">Sessions Needed</h3>
                  <p className="text-earth-700">{modality.field_sessions_needed}</p>
                </div>
              )}
              {modality.field_pairs_well_with && modality.field_pairs_well_with.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-earth-100 shadow-sm md:col-span-2">
                  <h3 className="text-xs font-bold text-earth-500 uppercase tracking-wider mb-3">Pairs Well With</h3>
                  <div className="flex flex-wrap gap-2">
                    {modality.field_pairs_well_with.map((paired) => (
                      <Link
                        key={paired.id}
                        href={`/modalities/${paired.id}`}
                        className="inline-flex items-center gap-2 bg-sage-50 hover:bg-sage-100 text-sage-800 px-4 py-2 rounded-full text-sm font-medium transition border border-sage-200"
                      >
                        {paired.title || 'View Modality'}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        <BotanicalDivider />

        {/* CTA - Find Practitioners */}
        <div className="relative bg-gradient-to-r from-sage-600 via-sage-700 to-earth-700 rounded-2xl p-8 md:p-12 text-white text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-2 8-8 14-16 16 8 2 14 8 16 16 2-8 8-14 16-16-8-2-14-8-16-16z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
          <div className="relative">
            <h2 className="font-serif text-3xl font-bold mb-4">
              Find {title} Practitioners
            </h2>
            <p className="mb-6 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Connect with qualified practitioners who specialize in this modality.
            </p>
            <Link
              href={`/practitioners?modality=${modality.id}`}
              className="inline-flex items-center gap-2 bg-white text-earth-800 px-8 py-3 rounded-xl font-semibold hover:bg-cream-50 transition shadow-lg hover:shadow-xl"
            >
              Find Practitioners
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        <DisclaimerBox title="Disclaimer">
          This information is for educational purposes only. Always consult with a qualified
          healthcare provider before starting any new treatment or therapy.
        </DisclaimerBox>

        <BackLink href="/modalities" label="Return to All Modalities" />
      </div>
    </PageWrapper>
  );
}
