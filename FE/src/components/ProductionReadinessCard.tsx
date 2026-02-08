import React from 'react';
import { Rocket, CheckCircle2, XCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import type { ProductionReadiness } from '../types';

interface Props {
  productionReadiness: ProductionReadiness;
}

const ProductionReadinessCard: React.FC<Props> = ({ productionReadiness }) => {
  if (!productionReadiness) {
    return (
      <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Rocket size={16} />
          </div>
          <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Production Readiness</h3>
        </div>
        <p className="text-gray-500 text-sm">No production readiness data available</p>
      </div>
    );
  }

  const { score, reasons } = productionReadiness;
  
  // Determine status level
  const getStatus = () => {
    if (score >= 80) return { label: 'Production Ready', color: 'emerald', icon: CheckCircle2 };
    if (score >= 60) return { label: 'Nearly Ready', color: 'amber', icon: AlertTriangle };
    return { label: 'Needs Work', color: 'red', icon: XCircle };
  };
  
  const status = getStatus();
  const StatusIcon = status.icon;

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20'
    },
    amber: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20'
    },
    red: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      glow: 'shadow-red-500/20'
    }
  };

  const colors = colorClasses[status.color as keyof typeof colorClasses];

  return (
    <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
          <Rocket size={16} />
        </div>
        <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Production Readiness</h3>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${colors.bg} ${colors.border} border mb-4`}>
        <StatusIcon size={18} className={colors.text} />
        <span className={`font-semibold ${colors.text}`}>{status.label}</span>
      </div>

      {/* Score Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Readiness Score</span>
          <span className={`text-lg font-bold ${colors.text}`}>{score}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
              score >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
              'bg-gradient-to-r from-red-500 to-red-400'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Reasons */}
      <div className="space-y-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Assessment</span>
        <ul className="space-y-1.5">
          {reasons.map((reason, index) => {
            const isPositive = reason.startsWith('✓') || reason.toLowerCase().includes('available') || reason.toLowerCase().includes('present') || reason.toLowerCase().includes('configured');
            
            return (
              <li 
                key={index} 
                className="flex items-start gap-2 text-sm group hover:bg-white/[0.02] -mx-2 px-2 py-1.5 rounded-lg transition-colors"
              >
                <ChevronRight 
                  size={14} 
                  className={`mt-0.5 shrink-0 ${isPositive ? 'text-emerald-500' : 'text-gray-600'}`} 
                />
                <span className={isPositive ? 'text-gray-300' : 'text-gray-400'}>
                  {reason}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ProductionReadinessCard;
