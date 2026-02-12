import React, { useState } from 'react';
import { Users, Scale, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface Contributor {
    name: string;
    avatar: string;
    commits: number;
    additions: number;
    deletions: number;
    linesChanged: number;
}

interface Props {
    contributors: Contributor[];
    equityScore: number;
}

const ContributionBalance: React.FC<Props> = ({ contributors, equityScore }) => {
    const [expanded, setExpanded] = useState(false);
    const INITIAL_SHOW = 10;

    if (!contributors || contributors.length === 0) return null;

    const maxCommits = Math.max(...contributors.map(c => c.commits));
    const totalCommits = contributors.reduce((sum, c) => sum + c.commits, 0);
    const visibleContributors = expanded ? contributors : contributors.slice(0, INITIAL_SHOW);
    const hasMore = contributors.length > INITIAL_SHOW;

    // Color logic based on equity score
    const getScoreColor = () => {
        if (equityScore >= 75) return { text: 'text-emerald-400', bg: 'bg-emerald-500', ring: 'stroke-emerald-400', label: 'Well Balanced', icon: CheckCircle2 };
        if (equityScore >= 50) return { text: 'text-amber-400', bg: 'bg-amber-500', ring: 'stroke-amber-400', label: 'Moderate', icon: Scale };
        return { text: 'text-red-400', bg: 'bg-red-500', ring: 'stroke-red-400', label: 'Imbalanced', icon: AlertTriangle };
    };

    const scoreInfo = getScoreColor();
    const ScoreIcon = scoreInfo.icon;

    // Ring SVG params
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (equityScore / 100) * circumference;

    return (
        <div className="bg-[#161b22] rounded-xl border border-white/5 overflow-hidden">
            {/* Header with Equity Score */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Users size={16} className="text-cyan-400" />
                    <div>
                        <span className="text-sm font-medium text-white">{contributors.length} contributors</span>
                        <span className="text-xs text-gray-500 ml-2">· {totalCommits.toLocaleString()} total commits</span>
                    </div>
                </div>
                
                {/* Equity Score Mini Ring */}
                <div className="flex items-center gap-3">
                    <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                            <circle 
                                cx="40" cy="40" r={radius} fill="none" 
                                className={scoreInfo.ring}
                                strokeWidth="5" 
                                strokeLinecap="round"
                                strokeDasharray={circumference} 
                                strokeDashoffset={offset}
                                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-lg font-bold ${scoreInfo.text}`}>{equityScore}</span>
                            <span className="text-[8px] text-gray-500 uppercase tracking-wider">equity</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`flex items-center gap-1 text-xs font-medium ${scoreInfo.text}`}>
                            <ScoreIcon size={12} />
                            {scoreInfo.label}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Team Balance</div>
                    </div>
                </div>
            </div>

            {/* Contributor Bars */}
            <div className="divide-y divide-white/5">
                {visibleContributors.map((contributor, index) => {
                    const commitPercentage = totalCommits > 0 ? (contributor.commits / totalCommits) * 100 : 0;
                    const barWidth = maxCommits > 0 ? (contributor.commits / maxCommits) * 100 : 0;

                    return (
                        <div key={contributor.name} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group">
                            {/* Rank */}
                            <span className="text-xs text-gray-600 w-5 text-center font-mono">
                                {index + 1}
                            </span>

                            {/* Avatar */}
                            {contributor.avatar ? (
                                <img 
                                    src={contributor.avatar} 
                                    alt={contributor.name}
                                    className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0 border border-white/10">
                                    {contributor.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Name + Bar */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-white font-medium truncate">
                                        {contributor.name}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                        {contributor.commits} commits · {commitPercentage.toFixed(1)}%
                                    </span>
                                </div>
                                
                                {/* Stacked bar */}
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-700 ease-out"
                                        style={{ 
                                            width: `${barWidth}%`,
                                            background: `linear-gradient(90deg, 
                                                ${index === 0 ? '#6366f1' : index === 1 ? '#8b5cf6' : index === 2 ? '#a78bfa' : '#64748b'}, 
                                                ${index === 0 ? '#818cf8' : index === 1 ? '#a78bfa' : index === 2 ? '#c4b5fd' : '#94a3b8'}
                                            )`
                                        }}
                                    />
                                </div>
                                
                                {/* Lines detail on hover */}
                                <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-emerald-500/70">
                                        +{contributor.additions.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-red-500/70">
                                        -{contributor.deletions.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Show More / Show Less */}
            {hasMore && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/[0.03] transition-colors border-t border-white/5"
                >
                    {expanded ? (
                        <><ChevronUp size={14} /> Show Less</>
                    ) : (
                        <><ChevronDown size={14} /> Show {contributors.length - INITIAL_SHOW} More</>
                    )}
                </button>
            )}
        </div>
    );
};

export default ContributionBalance;
