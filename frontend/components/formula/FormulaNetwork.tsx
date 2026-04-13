'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormulaNetworkResponse, NetworkNode, NetworkLink } from '@/app/api/formulas/[id]/network/route';

interface FormulaNetworkProps {
  formulaId: string;
}

// Module-level cache for the force graph constructor
let ForceGraph2D: any = null;

export function FormulaNetwork({ formulaId }: FormulaNetworkProps) {
  const [data, setData] = useState<FormulaNetworkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [ForceGraph, setForceGraph] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/formulas/${formulaId}/network`)
      .then(r => r.json())
      .then((d: FormulaNetworkResponse) => setData(d))
      .catch(() => setData({ nodes: [], links: [] }))
      .finally(() => setLoading(false));
  }, [formulaId]);

  useEffect(() => {
    if (ForceGraph2D) {
      setForceGraph(() => ForceGraph2D);
      return;
    }
    import('react-force-graph-2d').then(mod => {
      ForceGraph2D = mod.default;
      setForceGraph(() => mod.default);
    });
  }, []);

  const [width, setWidth] = useState(600);
  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading || !data || data.nodes.length < 3) return null;

  const graphData = {
    nodes: data.nodes.map((n: NetworkNode) => ({
      ...n,
      color: n.type === 'current' ? '#d97706' : '#527a5f',
      val: n.type === 'current' ? 8 : 4,
    })),
    links: data.links.map((l: NetworkLink) => ({
      ...l,
      color: '#94a3b8',
    })),
  };

  return (
    <section className="bg-white dark:bg-earth-900 rounded-2xl shadow-lg border border-earth-200 dark:border-earth-700 overflow-hidden">
      <div className="p-6 border-b border-earth-100 dark:border-earth-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🕸️</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-earth-100">Formula Network</h2>
            <p className="text-sm text-earth-600 dark:text-earth-300">
              {data.nodes.length - 1} related formulas share herbs with this one. Click any node to navigate.
            </p>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full" style={{ height: 320 }}>
        {ForceGraph && (
          <ForceGraph
            graphData={graphData}
            width={width}
            height={320}
            backgroundColor="transparent"
            nodeLabel={(node: any) => node.label}
            nodeColor={(node: any) => node.color}
            nodeVal={(node: any) => node.val}
            linkColor={() => '#94a3b820'}
            linkLabel={(link: any) => link.label}
            linkDirectionalArrowLength={0}
            onNodeClick={(node: any) => {
              if (node.type === 'related') {
                router.push(`/formulas/${node.id}`);
              }
            }}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.label as string;
              const fontSize = node.type === 'current' ? 14 / globalScale : 11 / globalScale;
              const r = node.type === 'current' ? 8 : 5;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = node.color;
              ctx.fill();
              if (globalScale >= 0.8) {
                ctx.font = `${fontSize}px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = node.type === 'current' ? '#92400e' : '#374151';
                const shortLabel = label.length > 24 ? label.slice(0, 22) + '…' : label;
                ctx.fillText(shortLabel, node.x, node.y + r + 2);
              }
            }}
          />
        )}
      </div>

      <div className="px-6 py-3 border-t border-earth-100 dark:border-earth-800 flex items-center gap-4 text-xs text-earth-500 dark:text-earth-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> This formula
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sage-600 inline-block" /> Related formula
        </span>
        <span className="ml-auto">Links = shared herb</span>
      </div>
    </section>
  );
}

export function FormulaNetworkSkeleton() {
  return (
    <div className="bg-white dark:bg-earth-900 rounded-2xl shadow-lg border border-earth-200 dark:border-earth-700 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-earth-200 dark:bg-earth-700 rounded" />
        <div className="h-6 bg-earth-200 dark:bg-earth-700 rounded w-44" />
      </div>
      <div className="h-64 bg-earth-100 dark:bg-earth-800 rounded-xl" />
    </div>
  );
}
