import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, GitBranch, Shield, Zap, Book, 
  ChevronLeft, ChevronRight, Home, MessageSquare, FileText 
} from 'lucide-react';
import type { RepoAnalysis } from '../types';
import ScoreBreakdown from '../components/ScoreBreakdown';
import ReadmeViewer from '../components/ReadmeViewer';
import InsightsPanel from '../components/InsightsPanel';
import ChatPanel from '../components/ChatPanel';

type SidebarTab = 'readme' | 'chat';

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<RepoAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('readme');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('repo_analysis');
    if (!stored) {
      navigate('/');
      return;
    }
    try {
      setData(JSON.parse(stored));
    } catch (e) {
      navigate('/');
    }
  }, [navigate]);

  if (!data) return null;

  const getGrade = (score: number) => {
    if (score >= 90) return { label: 'A', color: 'text-green-400' };
    if (score >= 80) return { label: 'B', color: 'text-blue-400' };
    if (score >= 70) return { label: 'C', color: 'text-yellow-400' };
    return { label: 'D', color: 'text-red-400' };
  };

  const grade = getGrade(data.overallScore);

  const toggleSidebar = (tab: SidebarTab) => {
    if (activeTab === tab) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setActiveTab(tab);
      setSidebarOpen(true);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden relative dashboard-layout">
      {/* Activity Bar (Leftmost Navigation) */}
      <div className="w-[50px] bg-[#101014] border-r border-white/10 flex flex-col items-center pt-4 z-40 shrink-0 md:flex-col md:h-full flex-row h-[50px] w-full md:w-[50px] fixed bottom-0 md:relative md:bottom-auto justify-between md:justify-start px-4 md:px-0">
        <div className="flex flex-row md:flex-col gap-4 md:gap-0">
           <button 
            className="w-10 h-10 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all mb-2 cursor-pointer" 
            title="Home"
            onClick={() => navigate('/')}
          >
            <Home size={24} />
          </button>
        </div>
        
        <div className="flex flex-row md:flex-col gap-4 md:gap-0">
          <button 
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-all mb-2 cursor-pointer ${activeTab === 'readme' && sidebarOpen ? 'text-white bg-primary' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            title="README"
            onClick={() => toggleSidebar('readme')}
          >
            <FileText size={24} />
          </button>
          
          <button 
            className={`w-10 h-10 rounded-md flex items-center justify-center transition-all mb-2 cursor-pointer ${activeTab === 'chat' && sidebarOpen ? 'text-white bg-primary' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            title="Chat with Repo"
            onClick={() => toggleSidebar('chat')}
          >
            <MessageSquare size={24} />
          </button>
        </div>
      </div>

      {/* Sidebar Panel */}
      <div className={`relative flex flex-col shrink-0 z-20 bg-bg-card transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarOpen ? 'w-full h-[calc(100%-50px)] absolute md:relative md:h-full md:w-[400px] border-r border-white/10' : 'w-0 border-r-0'}`}>
        <div className="flex-1 overflow-hidden relative">
            {activeTab === 'readme' && <ReadmeViewer content={data.readme} />}
            {activeTab === 'chat' && <ChatPanel data={data} />}
        </div>
       
        <button 
          className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-bg-card border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary cursor-pointer z-30 shadow-md hidden md:flex" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top_right,#131318_0%,#0a0a0c_100%)] p-6 md:p-8 pb-20 md:pb-8">
        <header className="flex justify-between items-start mb-8 pb-6 border-b border-white/5 animate-[fadeIn_0.5s_ease-out]">
          <div>
            <h1 className="text-2xl font-bold mb-1">{data.owner} / <span className="text-primary">{data.name}</span></h1>
            <div className="flex gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1"><GitBranch size={14} /> main</span>
              <span className="flex items-center gap-1">Analyzed {new Date(data.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
          <div>
            <div className="text-right bg-white/5 py-2 px-4 rounded-md border border-white/5">
              <span className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Production Readiness</span>
              <div className="flex items-baseline justify-end gap-2">
                <span className={`text-2xl font-extrabold leading-none ${grade.color}`}>{grade.label}</span>
                <span className="text-sm text-gray-400">{data.overallScore}/100</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-6 animate-[fadeIn_0.5s_ease-out]">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-bg-card p-4 rounded-lg border border-white/10 flex items-center gap-4 hover:-translate-y-0.5 transition-transform hover:bg-bg-card-hover">
              <div className="w-10 h-10 rounded-md flex items-center justify-center bg-blue-500/10 text-blue-400">
                <Book size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Documentation</span>
                <span className="text-lg font-semibold">{data.breakdown.documentation}%</span>
              </div>
            </div>
            <div className="bg-bg-card p-4 rounded-lg border border-white/10 flex items-center gap-4 hover:-translate-y-0.5 transition-transform hover:bg-bg-card-hover">
              <div className="w-10 h-10 rounded-md flex items-center justify-center bg-purple-500/10 text-purple-400">
                <Layout size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Structure</span>
                <span className="text-lg font-semibold">{data.breakdown.structure}%</span>
              </div>
            </div>
            <div className="bg-bg-card p-4 rounded-lg border border-white/10 flex items-center gap-4 hover:-translate-y-0.5 transition-transform hover:bg-bg-card-hover">
              <div className="w-10 h-10 rounded-md flex items-center justify-center bg-green-500/10 text-green-400">
                <Zap size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Health</span>
                <span className="text-lg font-semibold">{data.breakdown.commitHealth}%</span>
              </div>
            </div>
            <div className="bg-bg-card p-4 rounded-lg border border-white/10 flex items-center gap-4 hover:-translate-y-0.5 transition-transform hover:bg-bg-card-hover">
              <div className="w-10 h-10 rounded-md flex items-center justify-center bg-orange-500/10 text-orange-400">
                <Shield size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Testing</span>
                <span className="text-lg font-semibold">{data.breakdown.testing}%</span>
              </div>
            </div>
          </div>

          {/* Main Visuals Row */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:h-[400px]">
            <div className="h-full">
              <ScoreBreakdown breakdown={data.breakdown} />
            </div>
            <div className="h-full">
              <InsightsPanel insights={data.insights} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
