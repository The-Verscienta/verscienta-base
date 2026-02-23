import { drupal } from '@/lib/drupal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { PractitionerEntity } from '@/types/drupal';

// ISR: revalidate every 5 minutes
export const revalidate = 300;
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { ClinicMap } from '@/components/clinic/ClinicMap';
import {
  PageWrapper,
  LeafPattern,
  Section,
  BotanicalDivider,
  Tag,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';

interface PractitionerDetailProps {
  params: Promise<{
    id: string;
  }>;
}

async function getPractitioner(id: string): Promise<PractitionerEntity | null> {
  try {
    const practitioner = await drupal.getResource<PractitionerEntity>(
      'node--practitioner',
      id,
      {
        params: {
          'include': 'field_images,field_clinic',
        },
      }
    );
    return practitioner;
  } catch (error) {
    console.error('Failed to fetch practitioner:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PractitionerDetailProps): Promise<Metadata> {
  const { id } = await params;
  const practitioner = await getPractitioner(id);

  if (!practitioner) {
    return { title: 'Practitioner Not Found - Verscienta Health' };
  }

  const name = practitioner.field_name || practitioner.title || 'Practitioner';
  const credentials = practitioner.field_credentials ? `, ${practitioner.field_credentials}` : '';
  const location = [practitioner.field_city, practitioner.field_state].filter(Boolean).join(', ');
  const description = location
    ? `${name}${credentials} in ${location} — holistic health practitioner. View specializations, contact info, and book an appointment.`
    : `${name}${credentials} — holistic health practitioner. View specializations, contact info, and book an appointment.`;

  return {
    title: `${name}${credentials} - Holistic Practitioner - Verscienta Health`,
    description,
  };
}

export default async function PractitionerDetailPage({ params }: PractitionerDetailProps) {
  const { id } = await params;
  const practitioner = await getPractitioner(id);

  if (!practitioner) {
    notFound();
  }

  const name = practitioner.field_name || practitioner.title || 'Practitioner';
  const fullAddress = [
    practitioner.field_address,
    practitioner.field_city,
    practitioner.field_state,
    practitioner.field_zip || practitioner.field_zip_code,
  ]
    .filter(Boolean)
    .join(', ');

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
              { label: 'Practitioners', href: '/practitioners' },
              { label: name },
            ]}
            className="mb-8"
          />

          <div className="bg-white rounded-3xl shadow-xl border border-earth-200 relative overflow-hidden">
            {practitioner.field_images?.[0] && (practitioner.field_images[0].uri?.url || practitioner.field_images[0].url) ? (
              <div className="relative w-full h-56 md:h-72">
                <Image
                  src={practitioner.field_images[0].uri?.url || practitioner.field_images[0].url!}
                  alt={practitioner.field_images[0].meta?.alt || name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 896px) 100vw, 896px"
                />
              </div>
            ) : (
              <div className="absolute -right-12 -top-12 w-64 h-64 opacity-5 pointer-events-none text-8xl">👨‍⚕️</div>
            )}
            <div className="relative p-8 md:p-12">
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-earth-900 mb-2 tracking-tight">
                {name}
              </h1>
              {practitioner.field_credentials && (
                <p className="text-lg text-sage-600 mb-4">{practitioner.field_credentials}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {practitioner.field_accepting_new_patients || practitioner.field_accepting_patients ? (
                  <Tag variant="sage">Accepting New Patients</Tag>
                ) : (
                  <Tag variant="muted">Not Accepting Patients</Tag>
                )}
                {practitioner.field_practice_type && (
                  <Tag variant="earth">{practitioner.field_practice_type}</Tag>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {practitioner.field_bio && (
          <Section
            id="about"
            variant="default"
            title="About"
            icon="👨‍⚕️"
          >
            <div className="prose max-w-none text-earth-700">
              <SafeHtml html={practitioner.field_bio} />
            </div>
          </Section>
        )}

        {(practitioner.field_practice_type || practitioner.field_years_experience !== undefined) && (
          <Section
            id="practice"
            variant="default"
            title="Practice Details"
            icon={
              <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          >
            <div className="grid md:grid-cols-2 gap-6">
              {practitioner.field_practice_type && (
                <div>
                  <h3 className="text-lg font-semibold text-earth-700 mb-2">Practice Type</h3>
                  <Tag variant="sage">{practitioner.field_practice_type}</Tag>
                </div>
              )}
              {practitioner.field_years_experience !== undefined && (
                <div>
                  <h3 className="text-lg font-semibold text-earth-700 mb-2">Experience</h3>
                  <p className="text-earth-700">
                    {practitioner.field_years_experience} years of experience
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

      {practitioner.field_clinic && (
        <Section
          id="clinic"
          variant="default"
          title="Clinic Affiliation"
          icon="🏥"
        >
          <Link
            href={`/clinics/${practitioner.field_clinic.id}`}
            className="group flex items-center gap-4 p-4 rounded-lg border border-sage-200 hover:border-sage-400 hover:shadow-md transition-all bg-sage-50"
          >
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏥</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-earth-800 group-hover:text-earth-600 transition-colors">
                {practitioner.field_clinic.title || 'View Clinic'}
              </h3>
              <p className="text-sm text-sage-600">View clinic details and other practitioners</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-sage-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Section>
      )}

      {/* Image Gallery (if multiple images) */}
      {practitioner.field_images && practitioner.field_images.length > 1 && (
        <Section id="photos" variant="default" title="Photos" icon="📷">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {practitioner.field_images.slice(1).map((image, idx) => {
              const imgUrl = image.uri?.url || image.url;
              if (!imgUrl) return null;
              return (
                <div key={image.id || idx} className="relative aspect-square rounded-xl overflow-hidden border border-earth-200 shadow-sm">
                  <Image
                    src={imgUrl}
                    alt={image.meta?.alt || `${name} photo ${idx + 2}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 896px) 33vw, 250px"
                  />
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section id="contact" variant="default" title="Contact Information" icon="📧">

        <div className="grid md:grid-cols-2 gap-6">
          {fullAddress && (
            <div>
              <h3 className="text-lg font-semibold text-earth-700 mb-2 flex items-center gap-2">
                <span>📍</span> Address
              </h3>
              <p className="text-gray-700">{fullAddress}</p>
            </div>
          )}

          {practitioner.field_phone && (
            <div>
              <h3 className="text-lg font-semibold text-earth-700 mb-2 flex items-center gap-2">
                <span>📞</span> Phone
              </h3>
              <a
                href={`tel:${practitioner.field_phone}`}
                className="text-sage-600 hover:text-sage-800"
              >
                {practitioner.field_phone}
              </a>
            </div>
          )}

          {practitioner.field_email && (
            <div>
              <h3 className="text-lg font-semibold text-earth-700 mb-2 flex items-center gap-2">
                <span>✉️</span> Email
              </h3>
              <a
                href={`mailto:${practitioner.field_email}`}
                className="text-sage-600 hover:text-sage-800"
              >
                {practitioner.field_email}
              </a>
            </div>
          )}

          {practitioner.field_website && (
            <div>
              <h3 className="text-lg font-semibold text-earth-700 mb-2 flex items-center gap-2">
                <span>🌐</span> Website
              </h3>
              <a
                href={practitioner.field_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sage-600 hover:text-sage-800"
              >
                Visit Website
              </a>
            </div>
          )}
        </div>
      </Section>

      {practitioner.field_modalities && practitioner.field_modalities.length > 0 && (
        <Section id="modalities" variant="default" title="Specializations & Modalities" icon="🧘">
          <div className="grid md:grid-cols-2 gap-4">
            {practitioner.field_modalities.map((modality) => (
              <Link
                key={modality.id}
                href={`/modalities/${modality.id}`}
                className="flex items-center bg-sage-50 p-4 rounded-lg hover:bg-sage-100 transition border border-sage-200"
              >
                <span className="text-sage-600 mr-3 text-2xl">🧘</span>
                <span className="text-gray-800 font-medium">
                  {modality.title || 'View Modality'}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {practitioner.field_latitude && practitioner.field_longitude && (
        <Section id="location" variant="default" title="Location" icon="📍">
          <ClinicMap
            clinics={[{
              id: practitioner.id,
              title: name,
              lat: practitioner.field_latitude,
              lng: practitioner.field_longitude,
              address: fullAddress || undefined,
            }]}
            singleClinic
            zoom={15}
            className="h-[300px] rounded-lg overflow-hidden"
          />
        </Section>
      )}

      <div className="bg-gradient-to-r from-earth-700 via-sage-700 to-earth-800 text-white p-8 rounded-2xl shadow-xl text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Ready to Schedule?</h2>
        <p className="mb-6 opacity-90">
          Contact {name} to schedule a consultation and begin your wellness journey.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {practitioner.field_phone && (
            <a
              href={`tel:${practitioner.field_phone}`}
              className="inline-block bg-white text-earth-800 px-8 py-3 rounded-lg font-semibold hover:bg-earth-50 transition shadow-lg"
            >
              Call Now
            </a>
          )}
          {practitioner.field_email && (
            <a
              href={`mailto:${practitioner.field_email}`}
              className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Send Email
            </a>
          )}
        </div>
      </div>

      <DisclaimerBox />

      <BackLink href="/practitioners" label="Back to All Practitioners" />
      </div>
    </PageWrapper>
  );
}
