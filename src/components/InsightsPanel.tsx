import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';
import type { AIInsight } from '../types';

interface Props {
  insights: AIInsight[];
}

const InsightsPanel: React.FC<Props> = ({ insights }) => {
  return (
    <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.05)' }}>
        <Sparkles size={18} className="text-warning" />
        <h3 className="font-medium text-white">Repository Insights</h3>
      </div>
      
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {insights.map((insight, index) => (
            <div key={index} style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1rem',
              border: '1px solid var(--color-border)'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <MessageCircle size={16} className="text-primary" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontWeight: 500, color: '#f4f4f5', fontSize: '0.9rem' }}>{insight.question}</p>
              </div>
              <p style={{ paddingLeft: '1.75rem', color: '#a1a1aa', fontSize: '0.875rem', lineHeight: 1.5 }}>
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
