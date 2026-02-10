import React, { useState } from 'react';
import { 
  Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from 'recharts';
import { Target, AlertTriangle, CheckCircle } from 'lucide-react';
import type { RadarCategory } from '../types';

interface Props {
  radarAnalysis: RadarCategory[];
}

// Custom tooltip showing gap reason
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const diff = data.ideal - data.score;
    const isGood = diff <= 10;
    
    return (
      <div className="bg-[#1a1a1e] border border-white/10 rounded-xl p-4 shadow-2xl max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          {isGood ? (
            <CheckCircle size={16} className="text-emerald-400" />
          ) : (
            <AlertTriangle size={16} className="text-amber-400" />
          )}
          <span className="font-medium text-white">{data.category}</span>
        </div>
        
        <div className="flex items-center gap-4 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-400">{data.score}</div>
            <div className="text-xs text-gray-500">Actual</div>
          </div>
          <div className="text-gray-600">/</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{data.ideal}</div>
            <div className="text-xs text-gray-500">Ideal</div>
          </div>
          {diff > 0 && (
            <div className="text-center">
              <div className="text-lg font-medium text-amber-400">-{diff}</div>
              <div className="text-xs text-gray-500">Gap</div>
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t border-white/10">
          <p className="text-sm text-gray-400">{data.gap}</p>
        </div>
      </div>
    );
  }
  return null;
};

const RadarAnalysisChart: React.FC<Props> = ({ radarAnalysis }) => {
  const [selectedCategory, setSelectedCategory] = useState<RadarCategory | null>(null);

  if (!radarAnalysis || radarAnalysis.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Target size={16} />
          </div>
          <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Radar Analysis</h3>
        </div>
        <p className="text-gray-500 text-sm">No radar analysis available</p>
      </div>
    );
  }

  // Calculate overall gap score
  const totalGap = radarAnalysis.reduce((sum, r) => sum + (r.ideal - r.score), 0);
  const avgGap = Math.round(totalGap / radarAnalysis.length);

  return (
    <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Target size={16} />
          </div>
          <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Radar Analysis</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-indigo-400">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            Actual
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Ideal
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Chart */}
        <div className="flex-1 h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={radarAnalysis}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={false}
              />
              {/* Ideal scores (background) */}
              <Radar 
                name="Ideal" 
                dataKey="ideal" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.1}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              {/* Actual scores (foreground) */}
              <Radar 
                name="Actual" 
                dataKey="score" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RechartsRadarChart>
          </ResponsiveContainer>
        </div>

        {/* Gap Analysis */}
        <div className="lg:w-56 space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Gap Analysis</div>
          {radarAnalysis.map((item, index) => {
            const gap = item.ideal - item.score;
            const isGood = gap <= 10;
            
            return (
              <button
                key={index}
                onClick={() => setSelectedCategory(selectedCategory?.category === item.category ? null : item)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                  selectedCategory?.category === item.category 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 truncate">{item.category}</span>
                  <span className={`text-xs font-medium ${isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {gap > 0 ? `-${gap}` : '✓'}
                  </span>
                </div>
                {selectedCategory?.category === item.category && (
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    {item.gap}
                  </p>
                )}
              </button>
            );
          })}
          
          {/* Average Gap */}
          <div className="pt-2 mt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Avg Gap from Ideal</span>
              <span className={`text-sm font-bold ${avgGap <= 15 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {avgGap} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarAnalysisChart;
