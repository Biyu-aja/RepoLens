import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Code2 } from 'lucide-react';
import type { LanguageInfo } from '../types';

interface Props {
  languages: LanguageInfo[];
}

// GitHub language colors (subset of most common)
const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  // Default fallback
  default: '#6366f1'
};

const getLanguageColor = (language: string): string => {
  return languageColors[language] || languageColors.default;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1a1a1e] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-white font-medium text-sm">{data.name}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          {data.percentage}% • {(data.bytes / 1024).toFixed(1)} KB
        </p>
      </div>
    );
  }
  return null;
};

const LanguageChart: React.FC<Props> = ({ languages }) => {
  if (!languages || languages.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
            <Code2 size={16} />
          </div>
          <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Languages</h3>
        </div>
        <p className="text-gray-500 text-sm">No language data available</p>
      </div>
    );
  }

  // Filter out languages with < 1% for chart clarity
  const chartData = languages.filter(lang => lang.percentage >= 1);
  const otherPercentage = languages
    .filter(lang => lang.percentage < 1)
    .reduce((sum, lang) => sum + lang.percentage, 0);
  
  if (otherPercentage > 0) {
    chartData.push({ name: 'Other', bytes: 0, percentage: otherPercentage });
  }

  return (
    <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
          <Code2 size={16} />
        </div>
        <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Languages</h3>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="w-28 h-28 shrink-0">
            <PieChart width={112} height={112}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={45}
                paddingAngle={2}
                dataKey="percentage"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getLanguageColor(entry.name)}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {languages.slice(0, 5).map((lang) => (
            <div key={lang.name} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getLanguageColor(lang.name) }}
              />
              <span className="text-sm text-gray-300 flex-1 truncate">{lang.name}</span>
              <span className="text-xs text-gray-500 font-mono">{lang.percentage}%</span>
            </div>
          ))}
          {languages.length > 5 && (
            <div className="text-xs text-gray-600">
              +{languages.length - 5} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LanguageChart;
