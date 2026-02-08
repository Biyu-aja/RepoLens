import React from 'react';
import { Users, ExternalLink } from 'lucide-react';
import type { Contributor } from '../types';

interface Props {
  contributors: Contributor[];
}

const ContributorsPanel: React.FC<Props> = ({ contributors }) => {
  if (!contributors || contributors.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
            <Users size={16} />
          </div>
          <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Contributors</h3>
        </div>
        <p className="text-gray-500 text-sm">No contributor data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#16161a] to-[#0f0f12] rounded-2xl border border-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
            <Users size={16} />
          </div>
          <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium">Top Contributors</h3>
        </div>
        <span className="text-xs text-gray-500">{contributors.length} shown</span>
      </div>

      <div className="space-y-3">
        {contributors.slice(0, 6).map((contributor, index) => (
          <a
            key={contributor.login}
            href={contributor.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-white/5 transition-all"
          >
            {/* Rank */}
            <span className="w-5 text-xs text-gray-600 font-mono">#{index + 1}</span>
            
            {/* Avatar */}
            <img
              src={contributor.avatarUrl}
              alt={contributor.login}
              className="w-9 h-9 rounded-full border-2 border-white/10 group-hover:border-violet-500/50 transition-colors"
            />
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-medium text-sm truncate group-hover:text-violet-300 transition-colors">
                  {contributor.login}
                </span>
                <ExternalLink size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xs text-gray-500">
                {contributor.contributions.toLocaleString()} commits
              </span>
            </div>
            
            {/* Percentage Bar */}
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${contributor.percentage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-400 w-8 text-right">
                {contributor.percentage}%
              </span>
            </div>
          </a>
        ))}
      </div>

      {contributors.length > 6 && (
        <div className="mt-3 pt-3 border-t border-white/5 text-center">
          <span className="text-xs text-gray-500">
            +{contributors.length - 6} more contributors
          </span>
        </div>
      )}
    </div>
  );
};

export default ContributorsPanel;
