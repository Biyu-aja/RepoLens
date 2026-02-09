import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Github, Loader2, ArrowRight, Clock, Trash2, ExternalLink, Upload } from 'lucide-react';
import { analyzeRepository } from '../services/analyzer';
import { useRepo } from '../contexts/RepoContext';
import type { RepoAnalysis } from '../types';

const HISTORY_KEY = 'repo_analysis_history';
const MAX_HISTORY = 10;

const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<RepoAnalysis[]>([]);
  const navigate = useNavigate();
  const { setData } = useRepo();

  // Load history on mount
  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  const saveToHistory = (data: RepoAnalysis) => {
    // Remove duplicate if exists (same repo)
    const filtered = history.filter(h => h.id !== data.id);
    // Add new at the beginning, limit to MAX_HISTORY
    const newHistory = [data, ...filtered].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const data = await analyzeRepository(url);
      // Save to history
      saveToHistory(data);
      // Update context (this also saves to localStorage)
      setData(data);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = (item: RepoAnalysis) => {
    // Update context (this also saves to localStorage)
    setData(item);
    navigate('/dashboard');
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.version && json.data) {
          const repoData = json.data;
          
          // 1. Restore Repo Data
          setData(repoData);
          
          // 2. Restore Chat History (if available)
          if (json.chats && Array.isArray(json.chats)) {
            const { owner, name } = repoData;
            
            // Restore sessions list
            const sessionsList = json.chats.map(({ data, ...session }: any) => session);
            localStorage.setItem(`chat_sessions_${owner}_${name}`, JSON.stringify(sessionsList));
            
            // Restore individual session content
            json.chats.forEach((chat: any) => {
               if (chat.data && chat.id) {
                 localStorage.setItem(`chat_session_${owner}_${name}_${chat.id}`, JSON.stringify(chat.data));
               }
            });
            // console.log(`Restored ${json.chats.length} chat sessions`);
            alert(`Analysis imported successfully!\nRestored ${json.chats.length} chat sessions.`);
          } else {
            alert('Analysis imported successfully!');
          }

          // 3. Save to History
          if (repoData.id && repoData.owner) {
             saveToHistory(repoData);
          }
          
          navigate('/dashboard');
        } else {
          alert('Invalid RepoLens analysis file');
        }
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to parse analysis file');
      }
    };
    reader.readAsText(file);
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-20 p-4 relative overflow-auto">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl pointer-events-none z-[-1]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-info/10 rounded-full blur-[100px]" />
      </div>

      <div className="text-center max-w-2xl w-full animate-[fadeIn_0.5s_ease-out]">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl">
            <Github className="w-12 h-12 text-indigo-400" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Repo<span className="text-primary">Lens</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 leading-relaxed">
          Instantly analyze GitHub repositories for code quality, structure, and production readiness.
        </p>

        <form onSubmit={handleAnalyze} className="w-full max-w-md mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
          <div className="relative flex items-center bg-bg-main rounded-lg p-2 border border-white/10 group-hover:border-white/20 transition-all shadow-2xl">
            <Search className="w-5 h-5 text-gray-400 ml-3" />
            <input
              type="text"
              placeholder="github.com/username/repository"
              className="w-full bg-transparent border-none focus:outline-none text-white px-4 py-2 placeholder-gray-600"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              disabled={loading || !url}
              type="submit"
              className="bg-primary hover:brightness-110 text-white px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Analyze <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          
        </form>
        
        {/* Import File Option - moved outside form to avoid stacking issues */}
        <div className="mt-4 text-center relative z-10">
            <label className="text-sm text-gray-400 hover:text-primary cursor-pointer transition-colors flex items-center justify-center gap-2 py-2">
              <Upload size={14} />
              <span>Or upload analysis file</span>
              <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleImport}
            />
            </label>
        </div>

        <div className="mt-12 flex gap-8 justify-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>AI-Powered Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-info" />
            <span>Instant Insights</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Privacy Focus</span>
          </div>
        </div>

        {/* Recent Analysis History */}
        {history.length > 0 && (
          <div className="mt-16 w-full max-w-xl mx-auto animate-[fadeIn_0.7s_ease-out]">
            <div className="flex items-center gap-2 mb-4 text-gray-400">
              <Clock size={16} />
              <span className="text-sm font-medium">Recent Analyses</span>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenHistory(item)}
                  className="group relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-lg cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{item.owner}</span>
                        <span className="text-gray-500">/</span>
                        <span className="font-semibold text-primary">{item.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${getGradeColor(item.overallScore)}`}>
                      {item.overallScore}
                    </span>
                    <ExternalLink size={16} className="text-gray-500 group-hover:text-primary transition-colors" />
                    <button
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title="Remove from history"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
