import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Github, Loader2, ArrowRight } from 'lucide-react';
import { analyzeRepository } from '../services/analyzer';
import './LandingPage.css';

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
    <div className="landing-container">
      <div className="landing-ambience">
        <div className="glow-blob blob-1" />
        <div className="glow-blob blob-2" />
      </div>

      <div className="landing-content">
        <div className="logo-wrapper">
          <div className="logo-icon">
            <Github size={48} color="#818cf8" />
          </div>
        </div>
        
        <h1 className="landing-title">
          Repo<span className="highlight">Lens</span>
        </h1>
        <p className="landing-subtitle">
          Instantly analyze GitHub repositories for code quality, structure, and production readiness.
        </p>

        <form onSubmit={handleAnalyze} className="search-form">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="github.com/username/repository"
              className="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              disabled={loading || !url}
              type="submit"
              className="analyze-btn"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  Analyze <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="features-grid">
          <div className="feature-item">
            <div className="dot" style={{ background: 'var(--color-success)' }} />
            <span>AI-Powered Analysis</span>
          </div>
          <div className="feature-item">
            <div className="dot" style={{ background: 'var(--color-info)' }} />
            <span>Instant Insights</span>
          </div>
          <div className="feature-item">
            <div className="dot" style={{ background: 'var(--color-primary)' }} />
            <span>Privacy Focus</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
