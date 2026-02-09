import React, { useEffect } from 'react';
import { 
  Star, GitFork, Eye, AlertCircle, Code2, 
  CheckCircle, ArrowRight, MessageSquare, FolderOpen,
  Clock, Github, ExternalLink, Copy, Check,
  TrendingUp, Zap, Scale, Terminal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScoreRing from '../components/ScoreRing';
import ScoreBreakdown from '../components/ScoreBreakdown';
import StatCard from '../components/StatCard';
import ReadmeViewer from '../components/ReadmeViewer';
import InsightsPanel from '../components/InsightsPanel';
import ContributorsPanel from '../components/ContributorsPanel';
import LanguageChart from '../components/LanguageChart';
import RadarAnalysisChart from '../components/RadarAnalysisChart';
import ProductionReadinessCard from '../components/ProductionReadinessCard';
import ShareButton from '../components/ShareButton';
import NotesWidget from '../components/NotesWidget';
import { useRepo } from '../contexts/RepoContext';

const DashboardPage: React.FC = () => {
  const { data, setData, loading, setLoading } = useRepo();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);
  const [reanalyzing, setReanalyzing] = React.useState(false);

  // Detect if data is from old format (missing new fields)
  const isOutdatedData = data && (
    !data.radarAnalysis || 
    !data.productionReadiness || 
    !data.contributors || 
    !data.languages
  );

  useEffect(() => {
    if (!loading && !data) {
      navigate('/');
    }
  }, [loading, data, navigate]);

  const handleInsightsUpdate = (newInsights: any[]) => {
    if (data) {
      const updatedData = { ...data, insights: newInsights };
      setData(updatedData);
    }
  };

  const handleCopyUrl = () => {
    if (data?.url) {
      navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReanalyze = async () => {
    if (!data?.url) return;
    
    setReanalyzing(true);
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/analyze-repo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: data.url })
      });
      
      if (!response.ok) throw new Error('Failed to re-analyze');
      
      const newData = await response.json();
      setData(newData);
    } catch (error) {
      console.error('Re-analyze failed:', error);
      alert('Failed to re-analyze repository');
    } finally {
      setReanalyzing(false);
      setLoading(false);
    }
  };

  if (loading || !data) return null;

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Outdated Data Banner */}
      {isOutdatedData && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white px-4 py-3 flex items-center justify-center gap-4 shadow-lg backdrop-blur-sm">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">
            This analysis is from an older version. Some features may be missing.
          </span>
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {reanalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Re-analyzing...
              </>
            ) : (
              <>
                <TrendingUp size={16} />
                Re-analyze Now
              </>
            )}
          </button>
        </div>
      )}

      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#1a1a2e_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,#0f172a_0%,transparent_50%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
      
      <main className={`relative flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#0a0a0c]/80 backdrop-blur-sm ${isOutdatedData ? 'pt-12' : ''}`}>
        {/* Hero Section */}
        <header className="relative px-8 pt-8 pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb / Meta */}
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                <Code2 size={12} className="inline mr-1.5" />
                {data.stats?.language || 'Unknown'}
              </span>
              {data.stats?.license && (
                <span className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs border border-white/10 flex items-center gap-1.5">
                  <Scale size={12} />
                  {data.stats.license}
                </span>
              )}
              <span className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs border border-white/10 flex items-center gap-1.5">
                <Clock size={12} />
                {data.stats?.pushedAt ? formatRelativeTime(data.stats.pushedAt) : 'N/A'}
              </span>
            </div>

            {/* Main Hero Content */}
            <div className="flex flex-col xl:flex-row xl:items-start gap-8">
              {/* Left: Repository Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shrink-0">
                    <Github size={28} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-3xl md:text-4xl font-bold mb-1.5 truncate">
                      <span className="text-gray-400">{data.owner}/</span>
                      <span className="text-white">{data.name}</span>
                    </h1>
                    {/* URL with copy */}
                    <button 
                      onClick={handleCopyUrl}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer group"
                    >
                      <span className="truncate max-w-md">{data.url}</span>
                      {copied ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </div>
                </div>
                
                {data.summary && (
                  <p className="text-gray-400 text-lg max-w-2xl leading-relaxed mb-6">
                    {data.summary}
                  </p>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => navigate('/chat')}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
                  >
                    <MessageSquare size={18} />
                    Chat with Repo
                  </button>
                  <button 
                    onClick={() => navigate('/files')}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10 hover:border-white/20 cursor-pointer"
                  >
                    <FolderOpen size={18} />
                    Explore Files
                  </button>
                  <a 
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all border border-white/10 hover:border-white/20"
                  >
                    <ExternalLink size={18} />
                    Open on GitHub
                  </a>
                  <ShareButton 
                    repoUrl={data.url} 
                    owner={data.owner} 
                    name={data.name} 
                  />
                </div>
              </div>

              {/* Right: Score Ring */}
              <div className="flex flex-col items-center shrink-0">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/20">
                  <div className="text-center mb-3">
                    <span className="text-xs uppercase tracking-widest text-gray-500">Repository Health</span>
                  </div>
                  <ScoreRing score={data.overallScore} />
                  <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
                    <Terminal size={12} className="text-indigo-400" />
                    <span>AI-Powered Analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <section className="px-8 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={Star}
                label="Stars"
                value={data.stats?.stars?.toLocaleString() || '0'}
                iconColor="text-yellow-400"
              />
              <StatCard 
                icon={GitFork}
                label="Forks"
                value={data.stats?.forks?.toLocaleString() || '0'}
                iconColor="text-blue-400"
              />
              <StatCard 
                icon={Eye}
                label="Watchers"
                value={data.stats?.watchers?.toLocaleString() || '0'}
                iconColor="text-purple-400"
              />
              <StatCard 
                icon={AlertCircle}
                label="Open Issues"
                value={data.stats?.openIssues || '0'}
                iconColor="text-orange-400"
              />
            </div>
          </div>
        </section>

        {/* Main Grid Content */}
        <section className="px-8 pb-8 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Score Breakdown - Full width on mobile, 7 cols on large */}
              <div className="lg:col-span-7">
                <ScoreBreakdown breakdown={data.breakdown} />
              </div>

              {/* Strengths & Improvements - Side cards */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Tech Stack */}
                <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <Code2 size={16} />
                    </div>
                    <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Tech Stack</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.techStack && data.techStack.length > 0 ? (
                      data.techStack.map((tech, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-300 text-sm border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                        >
                          {tech}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No technologies detected</span>
                    )}
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <TrendingUp size={16} />
                    </div>
                    <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Strengths</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {data.strengths && data.strengths.length > 0 ? (
                      data.strengths.slice(0, 4).map((strength, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm group">
                          <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-gray-300 group-hover:text-white transition-colors">{strength}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 text-sm">No strengths identified</li>
                    )}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <Zap size={16} />
                    </div>
                    <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Improvements</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {data.improvements && data.improvements.length > 0 ? (
                      data.improvements.slice(0, 4).map((improvement, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm group">
                          <ArrowRight size={16} className="text-amber-400 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          <span className="text-gray-300 group-hover:text-white transition-colors">{improvement}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 text-sm">No improvements needed</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Contributors & Languages Row */}
              <div className="lg:col-span-7">
                <ContributorsPanel contributors={data.contributors || []} />
              </div>

              <div className="lg:col-span-5">
                <LanguageChart languages={data.languages || []} />
              </div>

              {/* Radar Analysis & Production Readiness Row */}
              <div className="lg:col-span-8">
                <RadarAnalysisChart radarAnalysis={data.radarAnalysis || []} />
              </div>

              <div className="lg:col-span-4">
                <ProductionReadinessCard productionReadiness={data.productionReadiness} />
              </div>

              {/* AI Insights - Full Width */}
              <div className="lg:col-span-12 min-h-[400px]">
                <InsightsPanel 
                  insights={data.insights} 
                  data={data}
                  onInsightsUpdate={handleInsightsUpdate}
                />
              </div>

              {/* README Section - Full Width */}
              <div className="lg:col-span-12">
                <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Code2 size={16} />
                    </div>
                    <h2 className="text-sm uppercase tracking-wider text-gray-400 font-medium">README.md</h2>
                  </div>
                  <ReadmeViewer content={data.readme} />
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <NotesWidget />
    </div>
  );
};

export default DashboardPage;
