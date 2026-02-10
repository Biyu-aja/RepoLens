import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { Loader2, ZoomIn, ZoomOut, RefreshCw, Maximize2, Lightbulb, Zap } from 'lucide-react';
import type { RepoAnalysis } from '../types';

interface Props {
  data: RepoAnalysis;
}

interface GraphNode {
  id: string;
  name: string;
  group: number; // 0: root, 1: dir, 2: file
  val: number; // size
  color?: string;
  fullPath: string;
  type: 'tree' | 'blob';
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

type ThemeMode = 'standard' | 'neon';

const RepoMap: React.FC<Props> = ({ data }) => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('neon'); // Default to neon
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const graphRef = useRef<any>(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Process flat structure into graph data
  const processStructure = (items: any[]) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const idMap = new Set<string>();

    const rootId = 'root';
    nodes.push({
      id: rootId,
      name: data.name,
      group: 0,
      val: 20,
      color: '#ffffff',
      fullPath: '',
      type: 'tree'
    });
    idMap.add(rootId);

    // Limit to preventing freezing on large repos
    // Take a smaller subset to ensure smooth performance
    const limitedItems = items.length > 150 ? items.slice(0, 150) : items;

    limitedItems.forEach((item: any) => {
        const parts = item.path.split('/');
        let currentPath = '';
        let parentId = rootId;

        parts.forEach((part: string, index: number) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const isFile = index === parts.length - 1 && item.type === 'blob';
            const id = currentPath;

            if (!idMap.has(id)) {
                // Determine group/color based on type/extension
                let group = 1;
                let color = theme === 'neon' ? '#a78bfa' : '#a78bfa';
                let val = 5;

                if (isFile) {
                    group = 2;
                    // Scale size based on file size (logarithmic)
                    const size = item.size || 100;
                    val = Math.max(2, Math.min(12, Math.log10(size) * 3));

                    if (id.endsWith('.ts') || id.endsWith('.tsx')) color = '#3b82f6'; // blue
                    else if (id.endsWith('.js') || id.endsWith('.jsx')) color = '#eab308'; // yellow
                    else if (id.endsWith('.css') || id.endsWith('.scss')) color = '#ec4899'; // pink
                    else if (id.endsWith('.html')) color = '#f97316'; // orange
                    else if (id.endsWith('.json')) color = '#10b981'; // green
                    else if (id.endsWith('.md')) color = '#fff';
                    else if (id.startsWith('.')) color = '#6b7280'; // dotfiles
                    else color = '#9ca3af'; // gray
                } else {
                    // Directories
                    if (id === 'src') color = '#ef4444'; // red for src
                    else if (id === 'components') color = '#22d3ee'; // cyan
                    else if (id === 'pages') color = '#d946ef'; // magenta
                    else if (id === 'server' || id === 'api') color = '#f59e0b'; // amber
                }

                nodes.push({
                    id,
                    name: part,
                    group,
                    val,
                    color,
                    fullPath: currentPath,
                    type: isFile ? 'blob' : 'tree'
                });
                idMap.add(id);
            }

            // Add link from parent
            links.push({ source: parentId, target: id });
            parentId = id;
        });
    });

    const uniqueLinks = new Set<string>();
    const uniqueLinksArray: GraphLink[] = [];
    
    links.forEach(link => {
        const key = `${link.source}|${link.target}`;
        if (!uniqueLinks.has(key)) {
            uniqueLinks.add(key);
            uniqueLinksArray.push(link);
        }
    });

    return { nodes, links: uniqueLinksArray };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(`${API_URL}/api/files/structure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner: data.owner, repo: data.name })
        });

        if (!response.ok) throw new Error('Failed to fetch file structure');
        
        const structure = await response.json();
        const graph = processStructure(structure);
        setGraphData(graph);
        
        setTimeout(() => {
             if (graphRef.current) {
                 graphRef.current.zoomToFit(400);
             }
        }, 1000);

    } catch (err: any) {
        console.error('RepoMap error:', err);
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

  // Handle Resize
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

  const handleZoomIn = () => {
      if (graphRef.current) {
          graphRef.current.zoom(graphRef.current.zoom() * 1.2, 400);
      }
  };

  const handleZoomOut = () => {
      if (graphRef.current) {
          graphRef.current.zoom(graphRef.current.zoom() / 1.2, 400);
      }
  };

  const handleCenter = () => {
     if (graphRef.current) {
         graphRef.current.zoomToFit(400);
     }
  };

  // Custom Neon Renderer
  const drawNode = (node: any, ctx: any, globalScale: any) => {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

    const label = node.name;
    const size = node.val;
    
    // Draw Glow (Simplified for performance)
    if (theme === 'neon' && Number.isFinite(node.x) && Number.isFinite(node.y)) {
        const glowSize = size * 2; 
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowSize, 0, 2 * Math.PI, false);
        const color = node.color || '#a78bfa';
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.2; // Quick transparency instead of gradient
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset
    }

    // Draw Core
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || '#a78bfa';
    ctx.fill();

    // Text Label on hover or if root
    if (globalScale >= 2.5 || node.group === 0 || (node.group === 1 && globalScale > 1.5)) {
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        // Stroke text for readability
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1 / globalScale;
        ctx.strokeText(label, node.x, node.y + size + 2);
        ctx.fillText(label, node.x, node.y + size + 2);
    }
  };

  if (loading && !graphData) {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-[#0d1117] rounded-xl border border-white/5">
              <Loader2 className="animate-spin text-indigo-400 mb-2" size={32} />
              <span className="text-gray-400 text-sm">Building repository map...</span>
          </div>
      );
  }

  if (error) {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-[#0d1117] rounded-xl border border-white/5 p-6 text-center">
              <div className="p-3 bg-red-500/10 rounded-full text-red-400 mb-3">
                  <RefreshCw size={24} />
              </div>
              <h3 className="text-white font-medium mb-1">Failed to load map</h3>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button 
                  onClick={fetchData}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
              >
                  Try Again
              </button>
          </div>
      );
  }

  return (
    <div className="relative flex flex-col h-full min-h-[500px] bg-[#0d1117] rounded-xl border border-white/5 overflow-hidden group">
        <div className="absolute top-4 left-4 z-10 p-2 bg-[#161b22]/90 backdrop-blur-sm rounded-lg border border-white/10 pointer-events-none">
            <h3 className="text-white font-medium text-sm flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${theme === 'neon' ? 'bg-indigo-400 shadow-[0_0_10px_#6366f1]' : 'bg-indigo-500'}`}></div>
                Repository Map
            </h3>
            <p className="text-[10px] text-gray-500 mt-1 pl-4">
                {graphData?.nodes.length} nodes • {graphData?.links.length} links
            </p>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-10 bg-[#161b22]/90 backdrop-blur-sm rounded-lg border border-white/10 p-1 flex gap-1">
            <button
                onClick={() => setTheme('standard')}
                className={`p-1.5 rounded-md transition-all ${theme === 'standard' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                title="Standard Theme"
            >
                <Lightbulb size={16} />
            </button>
            <button
                onClick={() => setTheme('neon')}
                className={`p-1.5 rounded-md transition-all ${theme === 'neon' ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-gray-500 hover:text-gray-300'}`}
                title="Neon Theme"
            >
                <Zap size={16} />
            </button>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            <button 
                onClick={handleZoomIn}
                className="p-2 bg-[#161b22] hover:bg-[#1f2937] text-gray-300 rounded-lg border border-white/10 transition-colors shadow-lg"
                title="Zoom In"
            >
                <ZoomIn size={18} />
            </button>
            <button 
                onClick={handleZoomOut}
                className="p-2 bg-[#161b22] hover:bg-[#1f2937] text-gray-300 rounded-lg border border-white/10 transition-colors shadow-lg"
                title="Zoom Out"
            >
                <ZoomOut size={18} />
            </button>
            <button 
                onClick={handleCenter}
                className="p-2 bg-[#161b22] hover:bg-[#1f2937] text-gray-300 rounded-lg border border-white/10 transition-colors shadow-lg"
                title="Fit to Screen"
            >
                <Maximize2 size={18} />
            </button>
        </div>

        <div ref={containerRef} className="flex-1 w-full h-full cursor-move">
            {graphData && dimensions.width > 0 && (
                <ForceGraph2D
                    ref={graphRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    onNodeClick={(node: any) => {
                        if (node.type === 'blob') {
                            navigate('/files', { state: { filePath: node.fullPath } });
                        } else if (node.type === 'tree') {
                            navigate('/files', { state: { folderPath: node.fullPath } });
                        }
                    }}
                    graphData={graphData}
                    nodeLabel={theme === 'standard' ? 'name' : undefined}
                    nodeCanvasObject={theme === 'neon' ? drawNode : undefined}
                    nodeColor={(node: any) => node.color}
                    nodeRelSize={6}
                    linkColor={() => theme === 'neon' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}
                    backgroundColor="#0d1117"
                    d3AlphaDecay={0.02}
                    d3VelocityDecay={0.3}
                    cooldownTicks={100}
                />
            )}
        </div>
    </div>
  );
};

export default RepoMap;
