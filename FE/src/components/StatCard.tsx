import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<Props> = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  iconColor = 'text-indigo-400'
}) => {
  return (
    <div className="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-5 overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1">
      {/* Subtle gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
      
      <div className="relative z-10">
        <div className={`inline-flex p-2.5 rounded-xl bg-white/5 ${iconColor} mb-3 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={20} />
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-gray-500 mb-1">{label}</span>
          <span className="text-2xl font-bold text-white">{value}</span>
          {subValue && (
            <span className="text-sm text-gray-400 mt-0.5">{subValue}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
