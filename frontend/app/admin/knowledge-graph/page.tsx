'use client';

import { useState, useEffect } from 'react';
import { PageWrapper, Section } from '@/components/ui/DesignSystem';
import dynamic from 'next/dynamic';

const KnowledgeGraph = dynamic(
  () => import('@/components/admin/KnowledgeGraph'),
  { ssr: false }
);

interface HerbOption {
  id: string;
  title: string;
}

const FEATURE_ENABLED = process.env.NEXT_PUBLIC_KNOWLEDGE_GRAPH === 'true';

export default function KnowledgeGraphPage() {
  const [herbs, setHerbs] = useState<HerbOption[]>([]);
  const [selectedHerb, setSelectedHerb] = useState<string>('');
  const [depth, setDepth] = useState(2);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHerbs() {
      const baseUrl = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || '';
      try {
        const res = await fetch(
          `${baseUrl}/jsonapi/node/herb?fields[node--herb]=title&page[limit]=100&sort=title`,
          { headers: { Accept: 'application/vnd.api+json' } }
        );
        if (res.ok) {
          const data = await res.json();
          setHerbs(
            (data.data || []).map((n: any) => ({
              id: n.id,
              title: n.attributes?.title || 'Untitled',
            }))
          );
        }
      } catch {
        // Herbs will remain empty
      }
      setLoading(false);
    }
    fetchHerbs();
  }, []);

  if (!FEATURE_ENABLED) {
    return (
      <PageWrapper>
        <div className="text-center py-20">
          <h1 className="text-2xl font-serif text-earth-800 mb-4">Knowledge Graph</h1>
          <p className="text-earth-500">
            This feature is not enabled. Set <code className="bg-earth-100 px-2 py-1 rounded text-sm">NEXT_PUBLIC_KNOWLEDGE_GRAPH=true</code> to enable.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-earth-800 mb-2">
          Knowledge Graph
        </h1>
        <p className="text-gray-600">
          Explore herb-ingredient-target-condition relationships.
        </p>
      </div>

      <Section title="Select Herb">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="herb-select" className="block text-sm font-medium text-gray-700 mb-1">
              Herb
            </label>
            {loading ? (
              <div className="h-10 bg-earth-100 rounded-lg animate-pulse" />
            ) : (
              <select
                id="herb-select"
                value={selectedHerb}
                onChange={(e) => setSelectedHerb(e.target.value)}
                className="w-full px-3 py-2 border border-earth-300 rounded-lg text-earth-800 bg-white focus:ring-2 focus:ring-sage-300 focus:border-sage-400"
              >
                <option value="">Choose an herb...</option>
                {herbs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="w-32">
            <label htmlFor="depth-select" className="block text-sm font-medium text-gray-700 mb-1">
              Depth
            </label>
            <select
              id="depth-select"
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-earth-300 rounded-lg text-earth-800 bg-white focus:ring-2 focus:ring-sage-300 focus:border-sage-400"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        </div>
      </Section>

      {selectedHerb && (
        <Section title="Graph">
          <KnowledgeGraph herbId={selectedHerb} depth={depth} />
        </Section>
      )}
    </PageWrapper>
  );
}
