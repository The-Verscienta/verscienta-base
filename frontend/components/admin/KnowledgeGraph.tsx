'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface GraphNode {
  id: string;
  label: string;
  type: 'herb' | 'ingredient' | 'target' | 'condition';
  color: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface KnowledgeGraphProps {
  herbId: string;
  depth?: number;
}

// Lazy-loaded ForceGraph component
let ForceGraph2DComponent: any = null;

export default function KnowledgeGraph({ herbId, depth = 2 }: KnowledgeGraphProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [ForceGraph, setForceGraph] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamically load react-force-graph-2d
  useEffect(() => {
    if (ForceGraph2DComponent) {
      setForceGraph(() => ForceGraph2DComponent);
      return;
    }
    import('react-force-graph-2d').then((mod) => {
      ForceGraph2DComponent = mod.default;
      setForceGraph(() => mod.default);
    });
  }, []);

  const fetchGraph = useCallback(async () => {
    if (!herbId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/knowledge-graph?herb=${herbId}&depth=${depth}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch graph data');
      }
      const data: GraphData = await res.json();
      setGraphData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [herbId, depth]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: 500,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-earth-50 rounded-xl border border-earth-200">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-sage-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-earth-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-red-50 rounded-xl border border-red-200">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Error loading graph</p>
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={fetchGraph}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-earth-50 rounded-xl border border-earth-200">
        <p className="text-earth-500">No graph data available for this herb.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <div
          ref={containerRef}
          className="rounded-xl border border-earth-200 overflow-hidden bg-white"
          style={{ height: 500 }}
        >
          {ForceGraph && (
            <ForceGraph
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              nodeLabel={(node: GraphNode) => `${node.label} (${node.type})`}
              nodeColor={(node: GraphNode) => node.color}
              nodeRelSize={6}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              linkLabel={(link: GraphLink) => (link as any).label || ''}
              onNodeClick={(node: GraphNode) => setSelectedNode(node)}
              nodeCanvasObjectMode={() => 'after'}
              nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const label = node.label;
                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#1a1a1a';
                ctx.fillText(label, node.x, node.y + 10);
              }}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-sm text-earth-600">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Herb
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> Ingredient
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Target
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Condition
          </span>
        </div>
      </div>

      {/* Sidebar */}
      {selectedNode && (
        <div className="w-72 bg-white border border-earth-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">{selectedNode.label}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-earth-400 hover:text-earth-600"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-earth-500 mb-2">
            Type: <span className="font-medium capitalize">{selectedNode.type}</span>
          </p>
          <p className="text-sm text-earth-500">
            ID: <span className="font-mono text-xs">{selectedNode.id}</span>
          </p>
        </div>
      )}
    </div>
  );
}
