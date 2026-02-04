import React, { useEffect, useState } from 'react';
import { Sparkles, MessageCircle, Loader2, RefreshCw, Bot } from 'lucide-react';
import type { AIInsight, RepoAnalysis } from '../types';

interface Props {
  insights: AIInsight[];
  data?: RepoAnalysis;
  onInsightsUpdate?: (insights: AIInsight[]) => void;
}

const API_URL = 'http://localhost:3001/api';

// Skeleton loading component
const InsightSkeleton: React.FC = () => (
  <div className="bg-white/5 rounded-md p-4 border border-white/10 animate-pulse">
    <div className="flex gap-3 mb-2">
      <div className="w-4 h-4 bg-white/10 rounded mt-0.5" />
      <div className="h-4 bg-white/10 rounded w-3/4" />
    </div>
    <div className="pl-7 space-y-2">
      <div className="h-3 bg-white/10 rounded w-full" />
      <div className="h-3 bg-white/10 rounded w-5/6" />
    </div>
  </div>
);

const InsightsPanel: React.FC<Props> = ({ insights: initialInsights, data, onInsightsUpdate }) => {
  const [insights, setInsights] = useState<AIInsight[]>(initialInsights);
  const [loading, setLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
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
        setAiGenerated(true);
        onInsightsUpdate?.(result.insights);
      }
    } catch (err: any) {
      console.error('Error generating insights:', err);
      setError(err.message);
      // Keep showing the initial insights on error
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate AI insights on first load
  useEffect(() => {
    if (data && !aiGenerated && initialInsights.length > 0) {
      generateAIInsights();
    }
  }, [data]);

  return (
    <div className="bg-[#16161aa0] backdrop-blur-md border border-white/5 rounded-lg flex flex-col h-full overflow-hidden shadow-lg">
      <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-indigo-500/5">
        <Sparkles size={18} className="text-warning" />
        <h3 className="font-medium text-white flex-1">AI Insights</h3>
        {aiGenerated && (
          <span className="text-xs text-primary flex items-center gap-1">
            <Bot size={12} />
            Gemini
          </span>
        )}
        {data && !loading && (
          <button
            onClick={generateAIInsights}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Regenerate insights"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
      
      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary text-sm mb-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Generating AI insights...</span>
            </div>
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button
              onClick={generateAIInsights}
              className="text-xs px-3 py-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {insights.map((insight, index) => (
              <div 
                key={index} 
                className="bg-white/5 rounded-md p-4 border border-white/10 hover:bg-white/10 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex gap-3 mb-2">
                  <MessageCircle size={16} className="text-primary mt-0.5 shrink-0" />
                  <p className="font-medium text-gray-100 text-sm">{insight.question}</p>
                </div>
                <p className="pl-7 text-gray-400 text-sm leading-relaxed">
                  {insight.answer}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;
