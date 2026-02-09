import React, { useState } from 'react';
import { Share2, Copy, Check, X, Link2 } from 'lucide-react';
import { useRepo } from '../contexts/RepoContext';

interface Props {
  repoUrl: string;
  owner: string;
  name: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ShareButton: React.FC<Props> = ({ repoUrl, owner, name }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { data } = useRepo();

  const generateShareLink = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/share/encode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repoUrl, 
          owner, 
          name,
          notes: data?.notes // Include notes in payload
        })
      });

      if (!response.ok) throw new Error('Failed to generate link');

      const dataRes = await response.json();
      // Build full share URL
      const fullUrl = `${window.location.origin}${dataRes.shareUrl}`;
      setShareUrl(fullUrl);
      setIsOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExport = () => {
    if (!data) return;

    // 1. Get Chat Sessions
    // Use data.owner/name if available to match ChatPage logic (source of truth)
    const storeOwner = data.owner || owner;
    const storeName = data.name || name;
    
    const sessionsKey = `chat_sessions_${storeOwner}_${storeName}`;
    const sessionsRaw = localStorage.getItem(sessionsKey);
    let chats: any[] = [];

    if (sessionsRaw) {
      try {
        const sessions = JSON.parse(sessionsRaw);
        // 2. Get content for each session
        chats = sessions.map((session: any) => {
          const contentKey = `chat_session_${storeOwner}_${storeName}_${session.id}`;
          const contentRaw = localStorage.getItem(contentKey);
          return {
            ...session,
            data: contentRaw ? JSON.parse(contentRaw) : null
          };
        });
      } catch (e) {
        console.error('Failed to export chats', e);
      }
    }

    const exportData = {
      version: '1.1', // Bump version
      exportedAt: new Date().toISOString(),
      data: data,
      chats: chats // Include chats
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repolens-${owner}-${name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Share Button */}
      <button
        onClick={generateShareLink}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-all group disabled:opacity-50"
      >
        <Share2 size={16} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium">{loading ? 'Generating...' : 'Share'}</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="bg-[#16161a] rounded-2xl border border-white/10 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Link2 size={18} />
                </div>
                <h3 className="font-semibold text-white">Share Analysis</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-sm text-gray-400 mb-4">
                Share this link with others to let them view the analysis for <span className="text-white font-medium">{owner}/{name}</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data?.notes && data.notes.length > 0 && (
                    <span className="text-emerald-400 text-xs flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded">
                      <Check size={12} /> {data.notes.length} note{data.notes.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="text-blue-400 text-xs flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded">
                    <Check size={12} /> Chat History
                  </span>
                </div>
              </p>

              {error ? (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              ) : (
                <>
                  {/* URL Input */}
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50"
                    />
                    <button
                      onClick={copyToClipboard}
                      className={`p-3 rounded-xl transition-all ${
                        copied 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>

                  {/* Copy Status */}
                  {copied && (
                    <p className="text-xs text-emerald-400 mt-2 text-center mb-4">
                      Link copied to clipboard!
                    </p>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#16161a] px-2 text-gray-500">Or export as file</span>
                    </div>
                  </div>

                  <button
                    onClick={handleExport}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-all"
                  >
                    <Share2 size={16} className="rotate-180" /> 
                    {/* Using Share2 rotated as a download-like symbol since I didn't import Download yet, better to stick to imported icons or standard ones. Wait, I should import Download. */}
                    <span>Download Analysis JSON</span>
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/5 bg-white/[0.02]">
              <p className="text-xs text-gray-500 text-center">
                Anyone with this link or file can view this repository analysis
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;
