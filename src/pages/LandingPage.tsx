import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Github, Loader2, ArrowRight } from 'lucide-react';
import { analyzeRepository } from '../services/analyzer';

const LandingPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const data = await analyzeRepository(url);
      localStorage.setItem('repo_analysis', JSON.stringify(data));
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to analyze repository (Mock error)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
      </div>
    </div>
  );
};

export default LandingPage;
