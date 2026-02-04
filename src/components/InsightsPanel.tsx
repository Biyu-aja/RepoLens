import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';
import type { AIInsight } from '../types';

interface Props {
  insights: AIInsight[];
}

const InsightsPanel: React.FC<Props> = ({ insights }) => {
  return (
    <div className="bg-[#16161aa0] backdrop-blur-md border border-white/5 rounded-lg flex flex-col h-full overflow-hidden shadow-lg">
      <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-indigo-500/5">
        <Sparkles size={18} className="text-warning" />
        <h3 className="font-medium text-white">Repository Insights</h3>
      </div>
      
      <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          {insights.map((insight, index) => (
            <div key={index} className="bg-white/5 rounded-md p-4 border border-white/10 hover:bg-white/10 transition-colors">
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
      </div>
    </div>
  );
};

export default InsightsPanel;
