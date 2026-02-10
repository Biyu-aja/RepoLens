
import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Loader2, ZoomIn, ZoomOut, Maximize2, Zap } from 'lucide-react';
import type { RepoAnalysis } from '../types';

interface Props {
  data: RepoAnalysis;
}

interface Node {
  id: string;
  name: string;
  type: 'file' | 'external';
  val: number;
  color?: string;
  incomingCount: number;
  outgoingCount: number;
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

type ThemeMode = 'standard' | 'neon';

const DependencyGraph: React.FC<Props> = ({ data }) => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme] = useState<ThemeMode>('neon');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const graphRef = useRef<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`${API_URL}/api/files/dependencies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner: data.owner, repo: data.name })
        });

        if (!response.ok) throw new Error('Failed to fetch dependencies');
        
        const rawData = await response.json();
        
        // Process data to add metrics
        const nodesMap = new Map<string, Node>();
        rawData.nodes.forEach((n: any) => {
            nodesMap.set(n.id, { 
                ...n, 
                val: 1, 
                incomingCount: 0, 
                outgoingCount: 0 
            });
        });

        // Calculate degrees
        rawData.links.forEach((l: any) => {
            const source = nodesMap.get(l.source);
            const target = nodesMap.get(l.target);
            if (source) source.outgoingCount++;
            if (target) target.incomingCount++;
        });

        // Update sizes based on connections (centrality)
        nodesMap.forEach(node => {
            node.val = Math.min(20, Math.max(3, (node.incomingCount * 2) + 2));
            // Color logic: 
            // Many incoming = Core/Shared (Orange/Red)
            // Many outgoing = Controller/Orchestrator (Blue)
            // Leaf = Green
            if (node.incomingCount > 5) node.color = '#f97316'; // Orange
            else if (node.outgoingCount > 5) node.color = '#3b82f6'; // Blue
            else if (node.incomingCount > 0 && node.outgoingCount > 0) node.color = '#a78bfa'; // Purple
            else node.color = '#10b981'; // Green
        });

        setGraphData({
            nodes: Array.from(nodesMap.values()),
            links: rawData.links
        });
        
    } catch (err: any) {
        console.error('DependencyGraph error:', err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
        fetchData();
    }
  }, [data]);

  useEffect(() => {
    const updateDimensions = () => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.2, 400);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.2, 400);
  const handleCenter = () => graphRef.current?.zoomToFit(400);

  // Custom Neon Renderer
  const drawNode = (node: any, ctx: any, globalScale: any) => {
    const label = node.name;
    const size = node.val;
    
    // Glow
    if (theme === 'neon') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 2, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.color || '#a78bfa';
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // Core
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || '#a78bfa';
    ctx.fill();

    // Text Label
    if (globalScale >= 2.5 || node.val > 8) {
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.fillText(label, node.x, node.y + size + 2);
        ctx.shadowBlur = 0;
    }
  };

  return (
    <div className="relative flex flex-col h-full min-h-[500px] bg-[#0d1117] rounded-xl border border-white/5 overflow-hidden group">
        <div className="absolute top-4 left-4 z-10 p-2 bg-[#161b22]/90 backdrop-blur-sm rounded-lg border border-white/10 pointer-events-none">
            <h3 className="text-white font-medium text-sm flex items-center gap-2">
                <div className="bg-indigo-500 p-1 rounded">
                    <Zap size={12} className="text-white" />
                </div>
                Dependency Graph
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 pl-1">
                {graphData?.nodes.length || 0} files • {graphData?.links.length || 0} dependencies
            </p>
            <div className="mt-2 text-[10px] text-gray-400 flex flex-col gap-1">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"/> Core (High Impact)</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"/> Controller (High Deps)</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Leaf (Independent)</div>
            </div>
            {error && (
                <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 p-1 rounded">
                    {error}
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            <button onClick={handleZoomIn} className="p-2 bg-[#161b22] hover:bg-[#1f2937] text-gray-300 rounded-lg border border-white/10 shadow-lg"><ZoomIn size={18} /></button>
            <button onClick={handleZoomOut} className="p-2 bg-[#161b22] hover:bg-[#1f2937] text-gray-300 rounded-lg border border-white/10 shadow-lg"><ZoomOut size={18} /></button>
            <button onClick={handleCenter} className="p-2 bg-[#161b22] hover:bg-[#1f2937] text-gray-300 rounded-lg border border-white/10 shadow-lg"><Maximize2 size={18} /></button>
        </div>

        <div ref={containerRef} className="flex-1 w-full h-full cursor-move">
            {loading && (
                 <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="animate-spin text-indigo-400 mb-2" size={32} />
                    <span className="text-gray-400 text-sm">Analyzing dependencies (checking top 30 files)...</span>
                </div>
            )}
            
            {!loading && graphData && dimensions.width > 0 && (
                <ForceGraph2D
                    ref={graphRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeLabel="name"
                    nodeCanvasObject={theme === 'neon' ? drawNode : undefined}
                    nodeColor={(node: any) => node.color}
                    nodeRelSize={6}
                    linkColor={() => 'rgba(255,255,255,0.1)'}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    backgroundColor="#0d1117"
                    d3AlphaDecay={0.02}
                    d3VelocityDecay={0.3}
                />
            )}
        </div>
    </div>
  );
};

export default DependencyGraph;
