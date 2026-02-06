import React, { useEffect } from 'react';
import { 
  Layout, Shield, Zap, Book
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScoreBreakdown from '../components/ScoreBreakdown';
import ReadmeViewer from '../components/ReadmeViewer';
import InsightsPanel from '../components/InsightsPanel';
import { useRepo } from '../contexts/RepoContext';

const DashboardPage: React.FC = () => {
  const { data, setData, loading } = useRepo();
  const navigate = useNavigate();

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

  if (loading || !data) return null;

  const getGrade = (score: number) => {
    if (score >= 90) return { label: 'A', color: 'text-green-400' };
    if (score >= 80) return { label: 'B', color: 'text-blue-400' };
    if (score >= 70) return { label: 'C', color: 'text-yellow-400' };
    return { label: 'D', color: 'text-red-400' };
  };

  const grade = getGrade(data.overallScore);

  return (
    <div className="flex h-full w-full overflow-hidden relative bg-[radial-gradient(circle_at_top_right,#131318_0%,#0a0a0c_100%)]">
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-6 md:p-8 pb-20 md:pb-8">
            <header className="flex justify-between items-start mb-8 pb-6 border-b border-white/5 animate-[fadeIn_0.5s_ease-out]">
              <div>
                <h1 className="text-2xl font-bold mb-1">{data.owner} / <span className="text-primary">{data.name}</span></h1>
                <div className="flex gap-4 text-gray-400 text-sm">
                  <span className="flex items-center gap-1"><Shield size={14} /> main</span>
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
                  <InsightsPanel 
                    insights={data.insights} 
                    data={data}
                    onInsightsUpdate={handleInsightsUpdate}
                  />
                </div>
              </div>

               {/* README */}
               <div className="mt-8">
                   <h2 className="text-xl font-bold mb-4">README</h2>
                   <div className="bg-bg-card rounded-xl border border-white/10 overflow-hidden">
                       <ReadmeViewer content={data.readme} />
                   </div>
               </div>
            </div>
      </main>
    </div>
  );
};

export default DashboardPage;
