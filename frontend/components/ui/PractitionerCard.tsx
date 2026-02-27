import Link from 'next/link';
import type { PractitionerEntity } from '@/types/drupal';

interface PractitionerCardProps {
  practitioner: PractitionerEntity;
  variant?: 'default' | 'compact';
  className?: string;
}

export function PractitionerCard({
  practitioner,
  variant = 'default',
  className = '',
}: PractitionerCardProps) {
  const name = practitioner.title || practitioner.field_name || 'Unnamed Practitioner';
  const isAccepting = practitioner.field_accepting_new_patients || practitioner.field_accepting_patients;

  const locationParts = [
    practitioner.field_city,
    practitioner.field_state,
  ].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(', ') : practitioner.field_address;

  if (variant === 'compact') {
    return (
      <Link
        href={`/practitioners/${practitioner.id}`}
        className={`flex items-center gap-4 p-4 bg-white dark:bg-earth-900 rounded-lg border border-gray-200 dark:border-earth-700 hover:border-earth-300 hover:shadow-md transition ${className}`}
      >
        <div className="w-12 h-12 bg-earth-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-earth-100 truncate">{name}</h3>
          {location && (
            <p className="text-sm text-gray-500 dark:text-earth-400 truncate">{location}</p>
          )}
        </div>
        {isAccepting && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex-shrink-0">
            Available
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={`/practitioners/${practitioner.id}`}
      className={`block bg-white dark:bg-earth-900 rounded-xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-earth-700 hover:border-earth-200 transition-all p-6 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-earth-100 to-sage-100 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-earth-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        {isAccepting && (
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
            Accepting Patients
          </span>
        )}
      </div>

      <h2 className="text-xl font-bold text-gray-800 dark:text-earth-100 mb-1">{name}</h2>

      {practitioner.field_practice_type && (
        <p className="text-sm text-sage-600 mb-3 capitalize">
          {practitioner.field_practice_type.replace(/_/g, ' ')} Practice
        </p>
      )}

      {location && (
        <div className="flex items-start gap-2 mb-3">
          <svg className="w-4 h-4 text-gray-400 dark:text-earth-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm text-gray-600 dark:text-earth-300">{location}</span>
        </div>
      )}

      {practitioner.field_modalities && practitioner.field_modalities.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 dark:text-earth-400 mb-2">Specialties</p>
          <div className="flex flex-wrap gap-1.5">
            {practitioner.field_modalities.slice(0, 3).map((modality, idx) => (
              <span
                key={idx}
                className="text-xs bg-sage-100 text-sage-700 px-2.5 py-1 rounded-full"
              >
                {modality.title || 'Modality'}
              </span>
            ))}
            {practitioner.field_modalities.length > 3 && (
              <span className="text-xs bg-gray-100 dark:bg-earth-800 text-gray-600 dark:text-earth-300 px-2.5 py-1 rounded-full">
                +{practitioner.field_modalities.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {practitioner.field_years_experience && (
        <p className="text-sm text-gray-500 dark:text-earth-400 mb-4">
          {practitioner.field_years_experience} years of experience
        </p>
      )}

      <div className="pt-4 border-t border-gray-100 dark:border-earth-700">
        <span className="text-earth-600 font-medium text-sm group-hover:text-earth-700 flex items-center gap-1">
          View Profile
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
