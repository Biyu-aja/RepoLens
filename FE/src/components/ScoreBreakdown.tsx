import React, { useEffect, useState } from 'react';
import { FileText, FolderTree, Code2, TestTube } from 'lucide-react';
import type { ScoreBreakdown as IScoreBreakdown } from '../types';

interface Props {
  breakdown: IScoreBreakdown;
}

interface ScoreItemProps {
  label: string;
  score: number;
  color: string;
  icon: React.ReactNode;
  delay: number;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ label, score, color, icon, delay }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        setAnimatedScore(Math.round(score * eased));
        setAnimatedWidth(score * eased);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [score, delay]);

  // Get score color tint
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-400';
    if (s >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="group p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
          <span className="text-gray-300 font-medium">{label}</span>
        </div>
        <span className={`text-xl font-bold ${getScoreColor(score)}`}>
          {animatedScore}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${animatedWidth}%`,
            background: `linear-gradient(90deg, ${color}, ${color}aa)`
          }}
        />
      </div>
    </div>
  );
};

const ScoreBreakdown: React.FC<Props> = ({ breakdown }) => {
  const items = [
    { 
      label: 'Documentation', 
      score: breakdown.documentation, 
      color: '#8b5cf6',
      icon: <FileText size={18} />
    },
    { 
      label: 'Structure', 
      score: breakdown.structure, 
      color: '#3b82f6',
      icon: <FolderTree size={18} />
    },
    { 
      label: 'Code Quality', 
      score: breakdown.codeQuality, 
      color: '#10b981',
      icon: <Code2 size={18} />
    },
    { 
      label: 'Testing', 
      score: breakdown.testing, 
      color: '#f59e0b',
      icon: <TestTube size={18} />
    },
  ];

  // Calculate average
  const average = Math.round(
    (breakdown.documentation + breakdown.structure + breakdown.codeQuality + breakdown.testing) / 4
  );

  return (
    <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] backdrop-blur-md p-6 rounded-2xl h-full border border-white/5 shadow-xl flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-gray-400 text-sm uppercase tracking-wider font-medium">
          Score Breakdown
        </h3>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className="text-xs text-gray-400">Average</span>
          <span className="text-sm font-bold text-white">{average}</span>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, index) => (
          <ScoreItem 
            key={item.label}
            {...item}
            delay={index * 100}
          />
        ))}
      </div>
    </div>
  );
};

export default ScoreBreakdown;
