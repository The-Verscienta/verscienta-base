import { drupal } from '@/lib/drupal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { ClinicEntity } from '@/types/drupal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { ClinicMap } from '@/components/clinic/ClinicMap';
import {
  PageWrapper,
  LeafPattern,
  Section,
  Tag,
  DisclaimerBox,
  BackLink,
} from '@/components/ui/DesignSystem';

interface ClinicDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ClinicDetailProps): Promise<Metadata> {
  const { id } = await params;
  const clinic = await getClinic(id);

  if (!clinic) {
    return { title: 'Clinic Not Found - Verscienta Health' };
  }

  const name = clinic.title || 'Clinic';
  const location = [clinic.field_city, clinic.field_state].filter(Boolean).join(', ');
  const description = location
    ? `${name} in ${location} — holistic health clinic offering natural healing modalities. View services, practitioners, hours, and reviews.`
    : `${name} — holistic health clinic offering natural healing modalities. View services, practitioners, hours, and reviews.`;

  return {
    title: `${name} - Holistic Health Clinic - Verscienta Health`,
    description,
  };
}

async function getClinic(id: string): Promise<ClinicEntity | null> {
  try {
    const clinic = await drupal.getResource<ClinicEntity>(
      'node--clinic',
      id,
      {
        params: {
          'include': 'field_images,field_practitioners,field_practitioners.field_images,field_modalities',
        },
      }
    );
    return clinic;
  } catch (error) {
    console.error('Failed to fetch clinic:', error);
    return null;
  }
}

// Insurance label mapping
const insuranceLabels: Record<string, string> = {
  aetna: 'Aetna',
  blue_cross: 'Blue Cross Blue Shield',
  cigna: 'Cigna',
  humana: 'Humana',
  kaiser: 'Kaiser Permanente',
  medicare: 'Medicare',
  medicaid: 'Medicaid',
  united: 'UnitedHealthcare',
  tricare: 'TRICARE',
  other: 'Other',
  self_pay: 'Self-Pay / Cash',
};

export default async function ClinicDetailPage({ params }: ClinicDetailProps) {
  const { id } = await params;
  const clinic = await getClinic(id);

  if (!clinic) {
    notFound();
  }

  const name = clinic.title || 'Clinic';
  const fullAddress = [
    clinic.field_address,
    clinic.field_city,
    clinic.field_state,
    clinic.field_zip,
  ]
    .filter(Boolean)
    .join(', ');

  const mapMarkers = clinic.field_latitude && clinic.field_longitude
    ? [{
        id: clinic.id,
        title: name,
        lat: clinic.field_latitude,
        lng: clinic.field_longitude,
        address: fullAddress || undefined,
      }]
    : [];

  return (
    <PageWrapper>
      <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 border-b border-sage-200/50">
        <LeafPattern opacity={0.04} />
        <div className="absolute top-20 left-10 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Clinics', href: '/clinics' },
              { label: name },
            ]}
            className="mb-8"
          />
          <div className="bg-white rounded-3xl shadow-xl border border-earth-200 relative overflow-hidden">
            {clinic.field_images?.[0] && (clinic.field_images[0].uri?.url || clinic.field_images[0].url) && (
              <div className="relative w-full h-56 md:h-72">
                <Image
                  src={clinic.field_images[0].uri?.url || clinic.field_images[0].url!}
                  alt={clinic.field_images[0].meta?.alt || name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 896px) 100vw, 896px"
                />
              </div>
            ) : (
              <div className="absolute -right-12 -top-12 w-64 h-64 opacity-5 pointer-events-none text-8xl">🏥</div>
            )}
            <div className="relative p-8 md:p-12">
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-earth-900 mb-2 tracking-tight">
                {name}
              </h1>
              {fullAddress && (
                <p className="text-lg text-sage-600 mb-4">{fullAddress}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {clinic.field_accepting_new_patients ? (
                  <Tag variant="sage">Accepting New Patients</Tag>
                ) : (
                  <Tag variant="muted">Not Accepting Patients</Tag>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {clinic.body && (
        <Section id="about" variant="default" title="About" icon="🏥">
          <div className="prose max-w-none text-earth-700">
            <SafeHtml html={clinic.body.processed || clinic.body.value} />
          </div>
        </Section>
      )}

      {/* Image Gallery */}
      {clinic.field_images && clinic.field_images.length > 1 && (
        <Section id="photos" variant="default" title="Photos" icon="📷">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {clinic.field_images.slice(1).map((image, idx) => {
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

          {clinic.field_phone && (
            <div>
              <h3 className="text-lg font-semibold text-earth-700 mb-2 flex items-center gap-2">
                <span>📞</span> Phone
              </h3>
              <a
                href={`tel:${clinic.field_phone}`}
                className="text-sage-600 hover:text-sage-800"
              >
                {clinic.field_phone}
              </a>
            </div>
          )}

          {clinic.field_email && (
            <div>
              <h3 className="text-lg font-semibold text-earth-700 mb-2 flex items-center gap-2">
                <span>✉️</span> Email
              </h3>
              <a
                href={`mailto:${clinic.field_email}`}
                className="text-sage-600 hover:text-sage-800"
              >
                {clinic.field_email}
              </a>
            </div>
          )}

          {clinic.field_website && (
            <div>
              <h3 className="text-lg font-semibold text-earth-700 mb-2 flex items-center gap-2">
                <span>🌐</span> Website
              </h3>
              <a
                href={clinic.field_website}
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

      {clinic.field_hours && (
        <Section id="hours" variant="default" title="Operating Hours" icon="🕐">
          <div className="prose max-w-none text-earth-700">
            <SafeHtml html={clinic.field_hours} />
          </div>
        </Section>
      )}

      {clinic.field_insurance_accepted && clinic.field_insurance_accepted.length > 0 && (
        <Section id="insurance" variant="default" title="Insurance Accepted" icon="🛡️">
          <div className="flex flex-wrap gap-2">
            {clinic.field_insurance_accepted.map((insurance) => (
              <Tag key={insurance} variant="blue">
                {insuranceLabels[insurance] || insurance}
              </Tag>
            ))}
          </div>
        </Section>
      )}

      {mapMarkers.length > 0 && (
        <Section id="location" variant="default" title="Location" icon="📍">
          <ClinicMap
            clinics={mapMarkers}
            singleClinic
            zoom={15}
            className="h-[300px] rounded-lg overflow-hidden"
          />
        </Section>
      )}

      {clinic.field_modalities && clinic.field_modalities.length > 0 && (
        <Section id="modalities" variant="default" title="Modalities & Services" icon="🧘">
          <div className="grid md:grid-cols-2 gap-4">
            {clinic.field_modalities.map((modality) => (
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

      {clinic.field_practitioners && clinic.field_practitioners.length > 0 && (
        <Section id="practitioners" variant="default" title="Our Practitioners" icon="👨‍⚕️">
          <div className="grid sm:grid-cols-2 gap-4">
            {clinic.field_practitioners.map((practitioner) => {
              const practImg = practitioner.field_images?.[0];
              const practImgUrl = practImg?.uri?.url || practImg?.url;

              return (
                <Link
                  key={practitioner.id}
                  href={`/practitioners/${practitioner.id}`}
                  className="group flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-sage-300 hover:shadow-md transition-all"
                >
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-sage-100 flex-shrink-0 flex items-center justify-center">
                    {practImgUrl ? (
                      <Image
                        src={practImgUrl}
                        alt={practImg?.meta?.alt || practitioner.title || 'Practitioner'}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <span className="text-2xl">👨‍⚕️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-earth-800 group-hover:text-earth-600 transition-colors truncate">
                      {practitioner.title || practitioner.field_name || 'Practitioner'}
                    </h3>
                    {practitioner.field_credentials && (
                      <p className="text-sm text-sage-600 truncate">{practitioner.field_credentials}</p>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-sage-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      {clinic.field_google_place_id && (
        <Section id="reviews" variant="default" title="Reviews" icon="⭐">
          <a
            href={`https://search.google.com/local/reviews?placeid=${clinic.field_google_place_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white border-2 border-earth-200 hover:border-sage-400 px-6 py-3 rounded-xl font-semibold text-earth-700 hover:text-sage-700 transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1"/>
            </svg>
            Read Google Reviews
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </Section>
      )}

      <div className="bg-gradient-to-r from-earth-700 via-sage-700 to-earth-800 text-white p-8 rounded-2xl shadow-xl text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Ready to Visit?</h2>
        <p className="mb-6 opacity-90">
          Contact {name} to schedule an appointment and begin your wellness journey.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {clinic.field_phone && (
            <a
              href={`tel:${clinic.field_phone}`}
              className="inline-block bg-white text-earth-800 px-8 py-3 rounded-lg font-semibold hover:bg-earth-50 transition shadow-lg"
            >
              Call Now
            </a>
          )}
          {clinic.field_email && (
            <a
              href={`mailto:${clinic.field_email}`}
              className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Send Email
            </a>
          )}
        </div>
      </div>

      <DisclaimerBox />

      <BackLink href="/clinics" label="Back to All Clinics" />
    </div>
    </PageWrapper>
  );
}
