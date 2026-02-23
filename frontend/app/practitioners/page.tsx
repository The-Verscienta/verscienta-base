import { drupal } from '@/lib/drupal';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NewsletterSignup } from '@/components/NewsletterSignup';
import { SortDropdown } from '@/components/ui/SortDropdown';
import { ServerPagination, PaginationInfo } from '@/components/ui/ServerPagination';
import type { PractitionerEntity } from '@/types/drupal';

// ISR: revalidate every 5 minutes
export const revalidate = 300;

const SORT_OPTIONS = [
  { value: 'title', label: 'Name (A-Z)' },
  { value: '-title', label: 'Name (Z-A)' },
  { value: '-created', label: 'Newest First' },
  { value: 'created', label: 'Oldest First' },
];

const PAGE_SIZE = 12;

export const metadata = {
  title: 'Find Holistic Health Practitioners - Verscienta Health',
  description: 'Connect with qualified holistic health practitioners specializing in acupuncture, herbalism, yoga, massage therapy, and more.',
};

// Practice type icons
const practiceTypeIcons: Record<string, string> = {
  solo: '👤',
  group: '👥',
  clinic: '🏥',
  hospital: '🏨',
  wellness_center: '🧘',
  default: '👨‍⚕️',
};

// Modality icons for specialties display
const modalityIcons: Record<string, string> = {
  acupuncture: '🪡',
  herbalism: '🌿',
  massage: '💆',
  yoga: '🧘',
  meditation: '🧘‍♂️',
  reiki: '✨',
  chiropractic: '🦴',
  naturopathy: '🌱',
  ayurveda: '🕉️',
  nutrition: '🥗',
  default: '🌟',
};

function getModalityIcon(name: string): string {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(modalityIcons)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  return modalityIcons.default;
}

function getPractitionerImage(practitioner: PractitionerEntity) {
  const img = practitioner.field_images?.[0];
  if (!img) return null;
  const url = img.uri?.url || img.url;
  if (!url) return null;
  return { url, alt: img.meta?.alt || img.filename || practitioner.field_name || practitioner.title || 'Practitioner' };
}

interface PractitionersResult {
  practitioners: PractitionerEntity[];
  total: number;
}

async function getPractitioners(sort: string = '-created', page: number = 1): Promise<PractitionersResult> {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const practitioners = await drupal.getResourceCollection<PractitionerEntity[]>('node--practitioner', {
      params: {
        'sort': sort,
        'page[limit]': PAGE_SIZE,
        'page[offset]': offset,
        'filter[status]': 1,
        'include': 'field_images,field_clinic',
      },
    });

    const allPractitioners = await drupal.getResourceCollection<PractitionerEntity[]>('node--practitioner', {
      params: {
        'filter[status]': 1,
        'fields[node--practitioner]': 'id',
        'page[limit]': 500,
      },
    });

    return {
      practitioners: practitioners || [],
      total: allPractitioners?.length || 0,
    };
  } catch (error) {
    console.error('Failed to fetch practitioners:', error);
    return { practitioners: [], total: 0 };
  }
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function PractitionersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || '-created';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const { practitioners, total } = await getPractitioners(sort, currentPage);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Count practitioners by practice type
  const practiceTypeCounts: Record<string, number> = {};
  let acceptingCount = 0;

  practitioners.forEach(practitioner => {
    if (practitioner.field_practice_type) {
      practiceTypeCounts[practitioner.field_practice_type] = (practiceTypeCounts[practitioner.field_practice_type] || 0) + 1;
    }
    if (practitioner.field_accepting_new_patients) {
      acceptingCount++;
    }
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Practitioners' },
        ]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-earth-800 mb-3">
              Find Practitioners
            </h1>
            <p className="text-xl text-sage-700 max-w-2xl">
              Connect with qualified holistic health practitioners who specialize in natural healing modalities.
            </p>
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

        {/* Quick stats */}
        <div className="flex flex-wrap gap-3">
          {acceptingCount > 0 && (
            <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-green-100 text-green-700 border border-green-200">
              {acceptingCount} accepting new patients
            </span>
          )}
          {Object.entries(practiceTypeCounts).slice(0, 4).map(([type, count]) => (
            <span
              key={type}
              className="text-xs px-3 py-1.5 rounded-full font-medium bg-sage-100 text-sage-700 border border-sage-200 capitalize"
            >
              {type.replace('_', ' ')} ({count})
            </span>
          ))}
        </div>
      </div>

      {practitioners.length === 0 ? (
        <div className="bg-gradient-to-br from-sage-50 to-earth-50 rounded-2xl p-12 text-center border border-sage-200">
          <div className="text-7xl mb-6">👨‍⚕️</div>
          <h2 className="text-2xl font-bold text-earth-800 mb-3">
            No Practitioners Found
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Our practitioner directory is being built. Check back soon to find qualified holistic health professionals.
          </p>
          <a
            href="https://backend.ddev.site/node/add/practitioner"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-earth-600 hover:bg-earth-700 text-white px-8 py-3 rounded-xl font-semibold transition"
          >
            Add Practitioner Profile
          </a>
        </div>
      ) : (
        <>
          {/* Featured Practitioners */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {practitioners.slice(0, 2).map((practitioner) => {
              const icon = practiceTypeIcons[practitioner.field_practice_type || 'default'] || practiceTypeIcons.default;
              const image = getPractitionerImage(practitioner);

              return (
                <Link
                  key={practitioner.id}
                  href={`/practitioners/${practitioner.id}`}
                  className="group bg-gradient-to-br from-sage-50 to-earth-50 rounded-2xl p-8 border border-sage-200 hover:border-sage-300 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-5">
                    <div className="relative w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden flex-shrink-0">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <span className="text-4xl">{icon}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-earth-800 group-hover:text-earth-600 transition-colors">
                          {practitioner.title || practitioner.field_name}
                        </h2>
                        {practitioner.field_accepting_new_patients && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                            Accepting Patients
                          </span>
                        )}
                      </div>

                      {practitioner.field_practice_type && (
                        <p className="text-sage-600 mb-2 capitalize">
                          {practitioner.field_practice_type.replace('_', ' ')} Practice
                        </p>
                      )}

                      {practitioner.field_address && (
                        <p className="text-gray-600 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {practitioner.field_address}
                        </p>
                      )}

                      {practitioner.field_clinic?.title && (
                        <p className="text-sage-600 mb-3 flex items-center gap-2 text-sm">
                          <span>🏥</span>
                          {practitioner.field_clinic.title}
                        </p>
                      )}

                      {practitioner.field_modalities && practitioner.field_modalities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {practitioner.field_modalities.slice(0, 4).map((modality: any, idx: number) => {
                            const modalityName = modality.title || 'Modality';
                            const modalityIcon = getModalityIcon(modalityName);
                            return (
                              <span
                                key={idx}
                                className="text-xs bg-white/70 text-sage-700 px-3 py-1 rounded-full flex items-center gap-1"
                              >
                                <span>{modalityIcon}</span>
                                {modalityName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 text-sage-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    View full profile
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* All Practitioners Grid */}
          <h2 className="text-2xl font-bold text-earth-800 mb-6">All Practitioners</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {practitioners.slice(2).map((practitioner) => {
              const icon = practiceTypeIcons[practitioner.field_practice_type || 'default'] || practiceTypeIcons.default;
              const image = getPractitionerImage(practitioner);

              return (
                <Link
                  key={practitioner.id}
                  href={`/practitioners/${practitioner.id}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-sage-200 transition-all overflow-hidden"
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
                        {practitioner.field_accepting_new_patients && (
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
                            <span className="text-2xl">{icon}</span>
                          </div>
                          {practitioner.field_accepting_new_patients && (
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
                      {practitioner.title || practitioner.field_name}
                    </h3>

                    {practitioner.field_practice_type && (
                      <p className="text-sm text-sage-600 mb-3 capitalize">
                        {practitioner.field_practice_type.replace('_', ' ')} Practice
                      </p>
                    )}

                    {practitioner.field_address && (
                      <p className="text-sm text-gray-600 mb-2 flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-2">{practitioner.field_address}</span>
                      </p>
                    )}

                    {practitioner.field_clinic?.title && (
                      <p className="text-xs text-sage-600 mb-3 flex items-center gap-1.5">
                        <span>🏥</span>
                        <span className="truncate">{practitioner.field_clinic.title}</span>
                      </p>
                    )}

                    {practitioner.field_modalities && practitioner.field_modalities.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {practitioner.field_modalities.slice(0, 2).map((modality: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-sage-100 text-sage-700 px-2 py-0.5 rounded"
                            >
                              {modality.title || 'Modality'}
                            </span>
                          ))}
                          {practitioner.field_modalities.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{practitioner.field_modalities.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {practitioner.field_years_experience && (
                      <p className="text-xs text-gray-500 mb-3">
                        {practitioner.field_years_experience} years experience
                      </p>
                    )}

                    <div className="pt-3 border-t border-gray-100">
                      <span className="text-sage-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Profile
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

          {/* If only 2 or fewer practitioners */}
          {practitioners.length <= 2 && practitioners.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {practitioners.map((practitioner) => {
                const icon = practiceTypeIcons[practitioner.field_practice_type || 'default'] || practiceTypeIcons.default;
                const image = getPractitionerImage(practitioner);

                return (
                  <Link
                    key={practitioner.id}
                    href={`/practitioners/${practitioner.id}`}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-sage-200 transition-all p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden">
                        {image ? (
                          <Image
                            src={image.url}
                            alt={image.alt}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <span className="text-2xl">{icon}</span>
                        )}
                      </div>
                      {practitioner.field_accepting_new_patients && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                          Accepting
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-earth-800 mb-2">
                      {practitioner.title || practitioner.field_name}
                    </h3>
                    {practitioner.field_address && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {practitioner.field_address}
                      </p>
                    )}
                    <span className="text-sage-600 font-medium text-sm">
                      View Profile →
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

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
              Are You a Holistic Health Practitioner?
            </h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              Join our directory to connect with patients seeking holistic health solutions.
              Create your professional profile and grow your practice.
            </p>
            <a
              href="https://backend.ddev.site/node/add/practitioner"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-earth-800 px-8 py-3 rounded-xl font-semibold hover:bg-earth-50 transition shadow-lg"
            >
              Create Your Profile
            </a>
          </div>

          {/* Newsletter */}
          <NewsletterSignup variant="card" className="mb-12" />
        </>
      )}

      {/* How it works */}
      <div className="bg-sage-50 border border-sage-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-sage-800 mb-1">Finding the Right Practitioner</h3>
            <p className="text-sm text-sage-700">
              Browse practitioner profiles to find specialists in your preferred modalities.
              Check their qualifications, experience, and whether they're accepting new patients
              before reaching out to schedule a consultation.
            </p>
          </div>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <Link
          href="/"
          className="text-sage-600 hover:text-sage-800 font-medium"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
