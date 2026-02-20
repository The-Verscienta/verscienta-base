'use client';
import { useEffect, useState } from 'react';
import { drupal } from '@/lib/drupal';
import { getFieldConfig } from '@/lib/decision-field-maps';

interface ModalityCardProps {
  modalityId: string;
  showDetails?: boolean;
  className?: string;
}

export function ModalityCard({ 
  modalityId, 
  showDetails = false,
  className = ''
}: ModalityCardProps) {
  const [modality, setModality] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModality() {
      try {
        setLoading(true);
        const data = await drupal.getResource('node--modality', modalityId);
        setModality(data);
      } catch (err) {
        setError('Failed to load modality');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (modalityId) {
      fetchModality();
    }
  }, [modalityId]);

  if (loading) {
    return <div className={`modality-card ${className}`}>Loading...</div>;
  }

  if (error || !modality) {
    return <div className={`modality-card ${className}`}>Error loading modality</div>;
  }

  return (
    <div className={`modality-card ${className}`}>
      <h3 className="text-xl font-bold">{modality.title}</h3>
      
      {/* Decision indicators */}
      {(modality.field_editors_pick || modality.field_self_practice || modality.field_session_cost_range) && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {modality.field_editors_pick && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">&#9733; Pick</span>}
          {modality.field_self_practice && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Self-Practice</span>}
          {modality.field_session_cost_range && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700">{modality.field_session_cost_range}</span>}
        </div>
      )}

      {modality.field_benefits && (
        <p className="mt-2 text-gray-700">{modality.field_benefits}</p>
      )}

      {showDetails && modality.field_excels_at && (
        <div className="mt-4">
          <h4 className="font-semibold">Excels At:</h4>
          <ul className="list-disc list-inside">
            {Array.isArray(modality.field_excels_at) ? 
              modality.field_excels_at.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              )) : 
              <li>{modality.field_excels_at}</li>
            }
          </ul>
        </div>
      )}
    </div>
  );
}
