'use client';
import { useEffect, useState } from 'react';
import { drupal } from '@/lib/drupal';
import { popularityMap, getFieldConfig } from '@/lib/decision-field-maps';

interface HerbCardProps {
  herbId: string;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function HerbCard({ 
  herbId, 
  variant = 'compact',
  className = ''
}: HerbCardProps) {
  const [herb, setHerb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHerb() {
      try {
        setLoading(true);
        const data = await drupal.getResource('node--herb', herbId);
        setHerb(data);
      } catch (err) {
        setError('Failed to load herb');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (herbId) {
      fetchHerb();
    }
  }, [herbId]);

  if (loading) {
    return <div className={`herb-card ${className}`}>Loading...</div>;
  }

  if (error || !herb) {
    return <div className={`herb-card ${className}`}>Error loading herb</div>;
  }

  return (
    <div className={`herb-card ${className}`}>
      <h3 className="text-xl font-bold">{herb.title}</h3>
      
      {herb.field_scientific_name && (
        <p className="italic text-gray-600">{herb.field_scientific_name}</p>
      )}
      
      {variant === 'detailed' && (
        <>
          {/* Decision indicators */}
          {(herb.field_editors_pick || herb.field_popularity || herb.field_beginner_friendly) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {herb.field_editors_pick && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">&#9733; Pick</span>}
              {herb.field_popularity && (() => { const c = getFieldConfig(popularityMap, herb.field_popularity); return c ? (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
              ) : null; })()}
              {herb.field_beginner_friendly && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Beginner Friendly</span>}
            </div>
          )}

          {herb.field_common_names && (
            <div className="mt-2">
              <strong>Common Names:</strong>
              <span className="ml-2">
                {Array.isArray(herb.field_common_names) ?
                  herb.field_common_names.join(', ') :
                  herb.field_common_names
                }
              </span>
            </div>
          )}

          {herb.field_therapeutic_uses && (
            <div className="mt-3">
              <strong>Therapeutic Uses:</strong>
              <p className="mt-1">{herb.field_therapeutic_uses}</p>
            </div>
          )}

          {herb.field_contraindications && (
            <div className="mt-3 text-red-600">
              <strong>Contraindications:</strong>
              <p className="mt-1">{herb.field_contraindications}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
