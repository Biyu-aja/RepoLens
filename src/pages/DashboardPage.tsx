import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, GitBranch, Shield, Zap, Book, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RepoAnalysis } from '../types';
import ScoreBreakdown from '../components/ScoreBreakdown';
import ReadmeViewer from '../components/ReadmeViewer';
import InsightsPanel from '../components/InsightsPanel';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<RepoAnalysis | null>(null);
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

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <ReadmeViewer content={data.readme} />
        <button 
          className="sidebar-toggle" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Toggle Readme"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Main Content */}
      <main className="main-content">
        <header className="dashboard-header animate-fade-in">
          <div className="header-left">
            <h1 className="repo-name">{data.owner} / <span className="highlight">{data.name}</span></h1>
            <div className="repo-meta">
              <span className="meta-tag"><GitBranch size={14} /> main</span>
              <span className="meta-tag">Analyzed {new Date(data.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="header-right">
            <div className="grade-box">
              <span className="grade-label">Production Readiness</span>
              <div className="grade-score">
                <span className={`grade-letter ${grade.color}`}>{grade.label}</span>
                <span className="grade-value">{data.overallScore}/100</span>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-grid animate-fade-in">
          {/* Quick Stats Row */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon bg-blue-500/10 text-blue-400">
                <Book size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Documentation</span>
                <span className="stat-value">{data.breakdown.documentation}%</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-purple-500/10 text-purple-400">
                <Layout size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Structure</span>
                <span className="stat-value">{data.breakdown.structure}%</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-green-500/10 text-green-400">
                <Zap size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Health</span>
                <span className="stat-value">{data.breakdown.commitHealth}%</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-orange-500/10 text-orange-400">
                <Shield size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Testing</span>
                <span className="stat-value">{data.breakdown.testing}%</span>
              </div>
            </div>
          </div>

          {/* Main Visuals Row */}
          <div className="visuals-row">
            <div className="chart-section">
              <ScoreBreakdown breakdown={data.breakdown} />
            </div>
            <div className="insights-section">
              <InsightsPanel insights={data.insights} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
