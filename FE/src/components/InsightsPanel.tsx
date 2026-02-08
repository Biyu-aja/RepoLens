import React, { useState } from 'react';
import { Sparkles, MessageCircle, Loader2, RefreshCw, Bot, Lightbulb, ChevronRight } from 'lucide-react';
import type { AIInsight, RepoAnalysis } from '../types';

interface Props {
  insights: AIInsight[];
  data?: RepoAnalysis;
  onInsightsUpdate?: (insights: AIInsight[]) => void;
}

const API_URL = 'http://localhost:3001/api';

// Skeleton loading component
const InsightSkeleton: React.FC = () => (
  <div className="bg-white/5 rounded-xl p-5 border border-white/10 animate-pulse">
    <div className="flex gap-3 mb-3">
      <div className="w-8 h-8 bg-white/10 rounded-lg" />
      <div className="flex-1">
        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-white/10 rounded w-full" />
      <div className="h-3 bg-white/10 rounded w-5/6" />
    </div>
  </div>
);

// Individual insight card
const InsightCard: React.FC<{ insight: AIInsight; index: number }> = ({ insight, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Colors for different insights
  const colors = [
    { bg: 'from-indigo-500/10 to-purple-500/10', border: 'border-indigo-500/20', icon: 'text-indigo-400' },
    { bg: 'from-cyan-500/10 to-blue-500/10', border: 'border-cyan-500/20', icon: 'text-cyan-400' },
    { bg: 'from-amber-500/10 to-orange-500/10', border: 'border-amber-500/20', icon: 'text-amber-400' },
    { bg: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
    { bg: 'from-pink-500/10 to-rose-500/10', border: 'border-pink-500/20', icon: 'text-pink-400' },
    { bg: 'from-violet-500/10 to-purple-500/10', border: 'border-violet-500/20', icon: 'text-violet-400' },
  ];
  
  const color = colors[index % colors.length];
  const isLongAnswer = insight.answer.length > 150;
  const displayAnswer = isExpanded || !isLongAnswer 
    ? insight.answer 
    : insight.answer.slice(0, 150) + '...';

  return (
    <div 
      className={`group relative bg-gradient-to-br ${color.bg} rounded-xl p-5 border ${color.border} hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5`}
    >
      <div className="flex gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-white/5 ${color.icon}`}>
          <Lightbulb size={18} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-white text-sm leading-relaxed">{insight.question}</p>
        </div>
      </div>
      
      <p className="text-gray-400 text-sm leading-relaxed pl-11">
        {displayAnswer}
      </p>
      
      {isLongAnswer && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2 pl-11 transition-colors cursor-pointer"
        >
          {isExpanded ? 'Show less' : 'Read more'}
          <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      )}
    </div>
  );
};

const InsightsPanel: React.FC<Props> = ({ insights: initialInsights, data, onInsightsUpdate }) => {
  const [insights, setInsights] = useState<AIInsight[]>(initialInsights);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAIInsights = async () => {
    if (!data) return;
    
    setLoading(true);
    setError(null);

    try {
      const repoContext = {
        name: data.name,
        owner: data.owner,
        readme: data.readme,
        overallScore: data.overallScore,
        breakdown: data.breakdown,
        insights: initialInsights
      };

      const response = await fetch(`${API_URL}/generate-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoContext })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI insights');
      }

      const result = await response.json();
      if (result.insights && result.insights.length > 0) {
        setInsights(result.insights);
        onInsightsUpdate?.(result.insights);
      }
    } catch (err: any) {
      console.error('Error generating insights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync with prop changes
  React.useEffect(() => {
    if (initialInsights && initialInsights.length > 0) {
      setInsights(initialInsights);
    }
  }, [initialInsights]);

  return (
    <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] backdrop-blur-md border border-white/5 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-gradient-to-r from-amber-500/5 via-indigo-500/5 to-purple-500/5">
        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400">
          <Sparkles size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">AI Insights</h3>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Bot size={10} />
            Powered by Gemini
          </span>
        </div>
        {data && !loading && (
          <button
            onClick={generateAIInsights}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            <RefreshCw size={12} />
            Regenerate
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-indigo-400 text-sm mb-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Generating AI insights...</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <InsightSkeleton />
              <InsightSkeleton />
              <InsightSkeleton />
              <InsightSkeleton />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-4">
              <MessageCircle size={32} />
            </div>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={generateAIInsights}
              className="text-sm px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30 transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="p-4 rounded-full bg-white/5 text-gray-600 mb-4">
              <Sparkles size={32} />
            </div>
            <p className="text-gray-400 text-sm mb-2">No insights available yet</p>
            <p className="text-gray-600 text-xs">Click regenerate to generate AI insights</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;
