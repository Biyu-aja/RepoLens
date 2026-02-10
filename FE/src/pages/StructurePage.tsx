
import React, { useState } from 'react';
import { useRepo } from '../contexts/RepoContext';
import RepoMap from '../components/RepoMap';
import DependencyGraph from '../components/DependencyGraph';
import { LayoutGrid, Network, Info } from 'lucide-react';

type ViewMode = 'file-map' | 'dependency-graph';

const StructurePage: React.FC = () => {
  const { data, loading } = useRepo();
  const [viewMode, setViewMode] = useState<ViewMode>('file-map');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No repository data available.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#0a0a0c]/50 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            {viewMode === 'file-map' ? <LayoutGrid size={20} /> : <Network size={20} />}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {viewMode === 'file-map' ? 'File Structure Map' : 'Dependency Graph'}
            </h1>
            <p className="text-xs text-gray-500">
              {viewMode === 'file-map' 
                ? 'Visualizing directory hierarchy and file sizes' 
                : 'Visualizing import relationships between files'}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-[#161b22] p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setViewMode('file-map')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === 'file-map' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid size={16} />
            File Map
          </button>
          <button
            onClick={() => setViewMode('dependency-graph')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === 'dependency-graph' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Network size={16} />
            Dependencies
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-hidden relative">
        <div className="w-full h-full rounded-2xl border border-white/5 overflow-hidden bg-[#0d1117] shadow-xl relative">
            {viewMode === 'file-map' ? (
                <RepoMap data={data} />
            ) : (
                <div className="w-full h-full relative">
                    <div className="absolute top-4 right-4 z-20 max-w-xs bg-black/60 backdrop-blur p-3 rounded-lg border border-white/10 text-xs text-gray-400 pointer-events-none">
                        <div className="flex gap-2 items-start">
                            <Info size={14} className="mt-0.5 shrink-0 text-indigo-400" />
                            <p>
                                Analyzing imports from top source files. Darker lines indicate dependencies. 
                                Large nodes are frequently imported (high coupling).
                            </p>
                        </div>
                    </div>
                    <DependencyGraph data={data} />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StructurePage;
