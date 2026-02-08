import React, { useEffect, useState } from 'react';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const ScoreRing: React.FC<Props> = ({ score, size = 180, strokeWidth = 12 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Get grade info
  const getGrade = (score: number) => {
    if (score >= 90) return { label: 'A+', color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' };
    if (score >= 80) return { label: 'A', color: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' };
    if (score >= 70) return { label: 'B', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' };
    if (score >= 60) return { label: 'C', color: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' };
    return { label: 'D', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
  };

  const grade = getGrade(score);

  // Animate score on mount
  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={grade.color} />
            <stop offset="100%" stopColor={grade.color} stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-5xl font-extrabold"
          style={{ color: grade.color }}
        >
          {grade.label}
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold text-white">{animatedScore}</span>
          <span className="text-lg text-gray-500">/100</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreRing;
