import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Link2 } from 'lucide-react';
import { useRepo } from '../contexts/RepoContext';

import API_URL from '../config';

const SharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setData, setLoading: setGlobalLoading } = useRepo();
  const [status, setStatus] = useState<'loading' | 'decoding' | 'analyzing' | 'error'>('loading');
  const [message, setMessage] = useState('Decoding share link...');
  const [error, setError] = useState('');
  const [repoInfo, setRepoInfo] = useState<{ owner: string; name: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No share token provided');
      setStatus('error');
      return;
    }

    const processShareLink = async () => {
      try {
        // Step 1: Decode the token
        setStatus('decoding');
        setMessage('Decoding share link...');

        const decodeRes = await fetch(`${API_URL}/api/share/decode/${token}`);
        if (!decodeRes.ok) throw new Error('Invalid or expired share link');

        const { repoUrl, owner, name, notes } = await decodeRes.json();
        setRepoInfo({ owner, name });

        // Step 2: Analyze the repository
        setStatus('analyzing');
        setMessage(`Analyzing ${owner}/${name}...`);
        setGlobalLoading(true);

        const analyzeRes = await fetch(`${API_URL}/api/analyze-repo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: repoUrl })
        });

        if (!analyzeRes.ok) throw new Error('Failed to analyze repository');

        const analysisData = await analyzeRes.json();
        // Merge shared notes with fresh analysis data
        setData({ ...analysisData, notes: notes || [] });
        setGlobalLoading(false);

        // Step 3: Navigate to dashboard
        navigate('/dashboard', { replace: true });

      } catch (err: any) {
        console.error('Share link error:', err);
        setError(err.message || 'Failed to load shared analysis');
        setStatus('error');
        setGlobalLoading(false);
      }
    };

    processShareLink();
  }, [token, navigate, setData, setGlobalLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1a1a2e_0%,transparent_70%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {status === 'error' ? (
          <>
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
              <AlertCircle size={48} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Share Link Error</h1>
            <p className="text-gray-400 mb-6 max-w-md">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
            >
              Go to Home
            </button>
          </>
        ) : (
          <>
            {/* Loading Animation */}
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Link2 size={32} className="text-indigo-400" />
              </div>
              <div className="absolute -bottom-2 -right-2">
                <Loader2 size={24} className="text-indigo-400 animate-spin" />
              </div>
            </div>

            {/* Status Message */}
            <h1 className="text-2xl font-bold text-white mb-2">
              {status === 'decoding' ? 'Processing Share Link' : 'Analyzing Repository'}
            </h1>
            <p className="text-gray-400 mb-4">{message}</p>

            {repoInfo && (
              <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300">
                {repoInfo.owner}/{repoInfo.name}
              </div>
            )}

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mt-8">
              <div className={`w-2 h-2 rounded-full ${status === 'decoding' || status === 'analyzing' ? 'bg-indigo-400' : 'bg-gray-600'}`} />
              <div className={`w-12 h-0.5 ${status === 'analyzing' ? 'bg-indigo-400' : 'bg-gray-700'}`} />
              <div className={`w-2 h-2 rounded-full ${status === 'analyzing' ? 'bg-indigo-400' : 'bg-gray-600'}`} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SharePage;
