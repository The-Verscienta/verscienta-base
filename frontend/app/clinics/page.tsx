import { drupal } from '@/lib/drupal';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ServerPagination, PaginationInfo } from '@/components/ui/ServerPagination';
import { ClinicMap } from '@/components/clinic/ClinicMap';
import type { ClinicEntity } from '@/types/drupal';
import { PageWrapper, LeafPattern, Tag, BackLink } from '@/components/ui/DesignSystem';

export const dynamic = 'force-dynamic';

const SORT_OPTIONS = [
  { value: 'title', label: 'Name (A-Z)' },
  { value: '-title', label: 'Name (Z-A)' },
  { value: '-created', label: 'Newest First' },
  { value: 'created', label: 'Oldest First' },
];

const PAGE_SIZE = 12;

export const metadata = {
  title: 'Find Holistic Health Clinics - Verscienta Health',
  description: 'Discover holistic health clinics near you offering acupuncture, herbalism, naturopathy, and other natural healing modalities.',
};

function getClinicImage(clinic: ClinicEntity) {
  const img = clinic.field_images?.[0];
  if (!img) return null;
  const url = img.uri?.url || img.url;
  if (!url) return null;
  return { url, alt: img.meta?.alt || img.filename || clinic.title || 'Clinic' };
}

function getClinicLocation(clinic: ClinicEntity): string {
  const parts = [clinic.field_city, clinic.field_state].filter(Boolean);
  return parts.join(', ');
}

interface ClinicsResult {
  clinics: ClinicEntity[];
  total: number;
}

async function getClinics(sort: string = '-created', page: number = 1): Promise<ClinicsResult> {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const clinics = await drupal.getResourceCollection<ClinicEntity[]>('node--clinic', {
      params: {
        'sort': sort,
        'page[limit]': PAGE_SIZE,
        'page[offset]': offset,
        'filter[status]': 1,
        'include': 'field_images,field_modalities',
      },
    });

    const allClinics = await drupal.getResourceCollection<ClinicEntity[]>('node--clinic', {
      params: {
        'filter[status]': 1,
        'fields[node--clinic]': 'id',
        'page[limit]': 500,
      },
    });

    return {
      clinics: clinics || [],
      total: allClinics?.length || 0,
    };
  } catch (error) {
    console.error('Failed to fetch clinics:', error);
    return { clinics: [], total: 0 };
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function ClinicsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || '-created';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const { clinics, total } = await getClinics(sort, currentPage);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  let acceptingCount = 0;
  clinics.forEach((clinic) => {
    if (clinic.field_accepting_new_patients) {
      acceptingCount++;
    }
  });

  const mapMarkers = clinics
    .filter((c) => c.field_latitude && c.field_longitude)
    .map((c) => ({
      id: c.id,
      title: c.title,
      lat: c.field_latitude!,
      lng: c.field_longitude!,
      address: getClinicLocation(c) || undefined,
    }));

  return (
    <PageWrapper>
    <div className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-sage-50/50 to-cream-100 border-b border-sage-200/50">
      <LeafPattern opacity={0.04} />
      <div className="absolute top-20 left-10 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-20 w-48 h-48 bg-earth-300/15 rounded-full blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Clinics' },
          ]}
          className="mb-6"
        />
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-earth-900 mb-3">
              Find Clinics
            </h1>
            <p className="text-xl text-sage-700 max-w-2xl mb-4">
              Discover holistic health clinics offering natural healing modalities and integrative care.
            </p>
            <div className="flex flex-wrap gap-2">
              {acceptingCount > 0 && (
                <Tag variant="sage" size="sm">{acceptingCount} accepting new patients</Tag>
              )}
              <Tag variant="earth" size="sm">{total} clinic{total !== 1 ? 's' : ''} listed</Tag>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SortDropdown options={SORT_OPTIONS} defaultValue="-created" />
            <PaginationInfo
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={total}
            />
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Map Section */}
      {mapMarkers.length > 0 && (
        <div className="mb-10">
          <ClinicMap clinics={mapMarkers} className="h-[400px] rounded-xl overflow-hidden shadow-lg border border-earth-200" />
        </div>
      )}

      {clinics.length === 0 ? (
        <div className="bg-gradient-to-br from-sage-50 to-earth-50 rounded-2xl p-12 text-center border border-sage-200">
          <div className="text-7xl mb-6">🏥</div>
          <h2 className="text-2xl font-bold text-earth-800 mb-3">
            No Clinics Found
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Our clinic directory is being built. Check back soon to find holistic health clinics near you.
          </p>
          <a
            href="https://backend.ddev.site/node/add/clinic"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-earth-600 hover:bg-earth-700 text-white px-8 py-3 rounded-xl font-semibold transition"
          >
            Add a Clinic
          </a>
        </div>
      ) : (
        <>
          {/* Clinic Grid */}
          <h2 className="text-2xl font-bold text-earth-800 mb-6">All Clinics</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {clinics.map((clinic) => {
              const image = getClinicImage(clinic);
              const location = getClinicLocation(clinic);

              return (
                <Link
                  key={clinic.id}
                  href={`/clinics/${clinic.id}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-earth-200 hover:border-sage-200 transition-all overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-br from-sage-50 to-earth-50 border-b border-gray-100">
                    {image ? (
                      <div className="relative w-full h-40 overflow-hidden">
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        {clinic.field_accepting_new_patients && (
                          <div className="absolute top-3 right-3">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 border border-green-200">
                              Accepting
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-2xl">🏥</span>
                          </div>
                          {clinic.field_accepting_new_patients && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 border border-green-200">
                              Accepting
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-earth-800 mb-1 group-hover:text-earth-600 transition-colors">
                      {clinic.title}
                    </h3>

                    {location && (
                      <p className="text-sm text-gray-600 mb-3 flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-2">{location}</span>
                      </p>
                    )}

                    {clinic.field_modalities && clinic.field_modalities.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {clinic.field_modalities.slice(0, 3).map((modality, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-sage-100 text-sage-700 px-2 py-0.5 rounded"
                            >
                              {modality.title || 'Modality'}
                            </span>
                          ))}
                          {clinic.field_modalities.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{clinic.field_modalities.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100">
                      <span className="text-sage-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Clinic
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <ServerPagination
              currentPage={currentPage}
              totalPages={totalPages}
              className="mb-12"
            />
          )}

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-earth-700 to-sage-700 rounded-2xl p-8 md:p-12 text-white text-center mb-8">
            <h2 className="text-3xl font-serif font-bold mb-4">
              Own a Holistic Health Clinic?
            </h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              List your clinic in our directory to connect with patients seeking holistic health solutions.
            </p>
            <a
              href="https://backend.ddev.site/node/add/clinic"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-earth-800 px-8 py-3 rounded-xl font-semibold hover:bg-earth-50 transition shadow-lg"
            >
              Add Your Clinic
            </a>
          </div>
        </>
      )}

      {/* Info Section */}
      <div className="bg-sage-50 border border-sage-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-sage-800 mb-1">Finding the Right Clinic</h3>
            <p className="text-sm text-sage-700">
              Browse clinic profiles to find facilities offering your preferred healing modalities.
              Check their services, insurance acceptance, operating hours, and practitioner team
              before scheduling a visit.
            </p>
          </div>
        </div>
      </div>

      <BackLink href="/" label="Return to Home" />
    </div>
    </PageWrapper>
  );
}
