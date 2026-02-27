import Link from 'next/link';
import { ReactNode } from 'react';

interface CardProps {
  title: string;
  description?: string;
  href?: string;
  icon?: ReactNode;
  tags?: string[];
  className?: string;
}

export function Card({ title, description, href, icon, tags, className = '' }: CardProps) {
  const content = (
    <div className={`bg-white dark:bg-earth-900 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ${className}`}>
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-800 dark:text-earth-100 mb-2">{title}</h3>
      {description && <p className="text-sage-700 mb-4">{description}</p>}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-earth-100 text-earth-700 text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {href && (
        <div className="mt-4 text-earth-600 font-medium hover:text-gray-800">
          Learn more →
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

interface HerbCardProps {
  scientificName: string;
  commonNames: string[];
  id: string;
}

export function HerbCard({ scientificName, commonNames, id }: HerbCardProps) {
  return (
    <Card
      title={scientificName}
      description={commonNames.join(', ')}
      href={`/herbs/${id}`}
      icon="🌿"
      tags={commonNames.slice(0, 3)}
    />
  );
}

interface ModalityCardProps {
  name: string;
  excelsAt: string[];
  id: string;
}

export function ModalityCard({ name, excelsAt, id }: ModalityCardProps) {
  return (
    <Card
      title={name}
      description={excelsAt.join(', ')}
      href={`/modalities/${id}`}
      icon="🧘"
      tags={excelsAt.slice(0, 3)}
    />
  );
}