import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ScoreBreakdown as IScoreBreakdown } from '../types';

interface Props {
  breakdown: IScoreBreakdown;
}

const ScoreBreakdown: React.FC<Props> = ({ breakdown }) => {
  const data = [
    { name: 'Docs', score: breakdown.documentation, color: '#6366f1' },
    { name: 'Structure', score: breakdown.structure, color: '#3b82f6' },
    { name: 'Commits', score: breakdown.commitHealth, color: '#10b981' },
    { name: 'Testing', score: breakdown.testing, color: '#f59e0b' },
  ];

  return (
    <div className="bg-[#16161aa0] backdrop-blur-md p-6 rounded-lg h-full border border-white/5 shadow-lg flex flex-col">
      <h3 className="mb-4 text-gray-400 text-sm uppercase tracking-wider font-medium">
        Score Breakdown
      </h3>
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={80} 
              tick={{ fill: '#a1a1aa', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: '#16161a', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScoreBreakdown;
