
import React, { useEffect, useState } from 'react';
import { useRepo } from '../contexts/RepoContext';
import API_URL from '../config';
import { Activity, Clock, Calendar, TrendingUp, Moon, Flame, Scale } from 'lucide-react';
import PunchCardGraph from '../components/PunchCardGraph';
import CommitHistoryChart from '../components/CommitHistoryChart';
import ContributionBalance from '../components/ContributionBalance';

interface ActivityData {
  punchCard: number[][]; // [day, hour, count]
  codeFrequency: number[][]; // [timestamp, additions, deletions]
  timeline: { date: string; count: number }[];
  topHustlers: {
    name: string;
    avatar: string;
    lateNightCommits: number;
    totalCommits: number;
    latestLateCommit: string;
  }[];
  contributionBalance: {
    contributors: {
      name: string;
      avatar: string;
      commits: number;
      additions: number;
      deletions: number;
      linesChanged: number;
    }[];
    equityScore: number;
  };
}

const ActivityPage: React.FC = () => {
    const { data, loading: repoLoading } = useRepo();
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Date state for timeline navigation
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (data?.owner && data?.name) {
            // Calculate start and end of selected month
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            const since = new Date(year, month, 1).toISOString();
            const until = new Date(year, month + 1, 0).toISOString();

            fetchActivity(data.owner, data.name, since, until);
        }
    }, [data, currentDate]);

    const fetchActivity = async (owner: string, repo: string, since?: string, until?: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/activity/pulse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner, repo, since, until })
            });
            
            if (!res.ok) throw new Error('Failed to fetch activity');
            
            const result = await res.json();
            setActivity(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handlePrevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate);
        if (newDate.getMonth() === new Date().getMonth() && newDate.getFullYear() === new Date().getFullYear()) return; // Don't go to future
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const isCurrentMonth = currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
    
    // ... existing loading/error check ...

    // Only show full page load if we have no activity data at all
    if (!activity && (repoLoading || loading)) {
        return (
            <div className="flex h-full items-center justify-center bg-[#0a0a0c]">
                <div className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-white/10 bg-[#161b22]/80 shadow-xl">
                    <Activity className="text-indigo-400 animate-pulse" size={32} />
                    <span className="text-gray-300 font-medium tracking-wide">Loading activity pulse...</span>
                </div>
            </div>
        );
    }

    if (!data || error) {
        return (
            <div className="flex h-full items-center justify-center text-red-400">
                <span>{error || 'No repository selected'}</span>
            </div>
        );
    }

    // ... calculations ...

    // Calculate total commits from punch card
    const totalCommitsSample = activity?.punchCard.reduce((sum, item) => sum + item[2], 0) || 0;
    
    // Find busiest day
    const dayCounts = Array(7).fill(0);
    activity?.punchCard.forEach(([day, , count]) => {
        dayCounts[day] += count; // Punch card day 0 is Sunday
    });
    const maxDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const busiestDay = days[maxDayIndex];

    // Find busiest hour
    const hourCounts = Array(24).fill(0);
    activity?.punchCard.forEach(([, hour, count]) => {
        hourCounts[hour] += count;
    });
    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
    const formatHour = (h: number) => {
        if (h === 0) return '12 AM';
        if (h === 12) return '12 PM';
        return h > 12 ? `${h-12} PM` : `${h} AM`;
    }

    return (
        <div className="flex flex-col h-full bg-[#0a0a0c] overflow-y-auto custom-scrollbar relative">

            
            {/* Header */}
            <header className="px-8 py-6 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Repository Pulse</h1>
                        <p className="text-sm text-gray-400">
                            Analyze the heartbeat and working patterns of the development team
                        </p>
                    </div>
                </div>
            </header>

            <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#161b22] p-5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-gray-400 text-sm">
                            <TrendingUp size={16} className="text-emerald-400" />
                            <span>Total Activity Sample</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{totalCommitsSample.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">Commits in analysis period</div>
                    </div>
                    
                    <div className="bg-[#161b22] p-5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-gray-400 text-sm">
                            <Calendar size={16} className="text-indigo-400" />
                            <span>Busiest Day</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{busiestDay}</div>
                        <div className="text-xs text-gray-500 mt-1">Team is most active on this day</div>
                    </div>

                    <div className="bg-[#161b22] p-5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-gray-400 text-sm">
                            <Clock size={16} className="text-amber-400" />
                            <span>Peak Hour (Deep Work)</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{formatHour(maxHour)}</div>
                        <div className="text-xs text-gray-500 mt-1">Most commits happen around this time</div>
                    </div>
                </div>

                {/* Commit History Timeline */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                         <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                            Commit Timeline
                         </h2>
                         
                         <div className="flex items-center gap-2 bg-[#161b22] px-2 py-1 rounded-lg border border-white/5">
                            <button 
                                onClick={handlePrevMonth}
                                className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            </button>
                            
                            <span className="text-sm font-medium text-gray-300 w-32 text-center select-none">
                                {monthLabel}
                            </span>
                            
                            <button 
                                onClick={handleNextMonth}
                                disabled={isCurrentMonth}
                                className={`p-1 rounded-md text-gray-400 transition-colors ${
                                    isCurrentMonth 
                                        ? 'opacity-30 cursor-not-allowed' 
                                        : 'hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </button>
                         </div>
                    </div>
                    
                    <div className="relative">
                        {loading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0c]/40 backdrop-blur-[2px] rounded-xl transition-all">
                                <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] rounded-full border border-white/10 shadow-lg">
                                    <Activity className="text-indigo-400 animate-pulse" size={16} />
                                    <span className="text-sm text-gray-300">Loading timeline...</span>
                                </div>
                            </div>
                        )}
                        {activity?.timeline && activity.timeline.length > 0 ? (
                            <CommitHistoryChart 
                                data={activity.timeline} 
                                year={currentDate.getFullYear()}
                                month={currentDate.getMonth()}
                            />
                        ) : (
                            <div className="p-8 text-center text-gray-500 bg-[#161b22] rounded-xl border border-white/5 border-dashed">
                                No timeline data available for {monthLabel}.
                            </div>
                        )}
                    </div>
                </section>

                {/* Punch Card Graph */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                         <div>
                             <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                Working Habits
                             </h2>
                             <p className="text-xs text-gray-500 mt-1 ml-3.5">
                                Aggregated activity across all days and hours.
                             </p>
                         </div>
                    </div>
                    
                    {activity?.punchCard && activity.punchCard.length > 0 ? (
                        <div className="bg-[#161b22]/50 p-1 rounded-2xl border border-white/5 overflow-hidden">
                             <PunchCardGraph data={activity.punchCard} />
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500 bg-[#161b22] rounded-xl border border-white/5 border-dashed">
                            No activity data available for this repository yet.
                        </div>
                    )}
                </section>

                {/* Contribution Balance */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                         <div>
                             <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-cyan-500 rounded-full"></div>
                                <Scale size={18} className="text-cyan-400" />
                                Contribution Balance
                             </h2>
                             <p className="text-xs text-gray-500 mt-1 ml-3.5">
                                How evenly distributed is the workload across team members.
                             </p>
                         </div>
                    </div>

                    {activity?.contributionBalance && activity.contributionBalance.contributors.length > 0 ? (
                        <ContributionBalance 
                            contributors={activity.contributionBalance.contributors}
                            equityScore={activity.contributionBalance.equityScore}
                        />
                    ) : (
                        <div className="p-8 text-center text-gray-500 bg-[#161b22] rounded-xl border border-white/5 border-dashed">
                            No contributor data available yet. GitHub may be computing statistics.
                        </div>
                    )}
                </section>

                {/* Top Hustler Leaderboard */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                         <div>
                             <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                <Flame size={18} className="text-amber-400" />
                                Top Hustlers
                             </h2>
                             <p className="text-xs text-gray-500 mt-1 ml-3.5">
                                Contributors who commit during unusual hours (10 PM – 6 AM). Based on last 100 commits.
                             </p>
                         </div>
                    </div>

                    {activity?.topHustlers && activity.topHustlers.length > 0 ? (
                        <div className="bg-[#161b22] rounded-xl border border-white/5 overflow-hidden">
                            <div className="divide-y divide-white/5">
                                {activity.topHustlers.map((hustler, index) => {
                                    const medals = ['🥇', '🥈', '🥉'];
                                    const medal = index < 3 ? medals[index] : `#${index + 1}`;
                                    const percentage = hustler.totalCommits > 0 
                                        ? Math.round((hustler.lateNightCommits / hustler.totalCommits) * 100) 
                                        : 0;
                                    const lastLate = hustler.latestLateCommit 
                                        ? new Date(hustler.latestLateCommit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : '';

                                    return (
                                        <div key={hustler.name} className={`flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors ${
                                            index === 0 ? 'bg-amber-500/[0.03]' : ''
                                        }`}>
                                            {/* Rank */}
                                            <div className="text-xl w-8 text-center flex-shrink-0">
                                                {medal}
                                            </div>

                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0">
                                                {hustler.avatar ? (
                                                    <img 
                                                        src={hustler.avatar} 
                                                        alt={hustler.name}
                                                        className={`w-10 h-10 rounded-full border-2 ${
                                                            index === 0 ? 'border-amber-400/60' : 'border-white/10'
                                                        }`}
                                                    />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                                        index === 0 ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-400/60' : 'bg-gray-700 text-gray-300 border-2 border-white/10'
                                                    }`}>
                                                        {hustler.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <Moon size={12} className="absolute -bottom-0.5 -right-0.5 text-indigo-400 bg-[#161b22] rounded-full p-0.5" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold text-sm truncate ${
                                                        index === 0 ? 'text-amber-300' : 'text-white'
                                                    }`}>
                                                        {hustler.name}
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                                                            NIGHT OWL
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Last late commit: {lastLate || 'N/A'}
                                                </div>
                                            </div>

                                            {/* Late commits count + bar */}
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                <div className="w-24">
                                                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                        <span>{hustler.lateNightCommits} late</span>
                                                        <span>{percentage}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right min-w-[60px]">
                                                    <div className="text-sm font-bold text-white">{hustler.lateNightCommits}</div>
                                                    <div className="text-[10px] text-gray-500">/ {hustler.totalCommits}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500 bg-[#161b22] rounded-xl border border-white/5 border-dashed">
                            <Moon size={24} className="mx-auto mb-2 text-gray-600" />
                            No late-night commits detected. This team has healthy work hours! 🎉
                        </div>
                    )}
                </section>

                {/* Insight Text */}
                <section className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 rounded-xl border border-indigo-500/20">
                     <h3 className="text-sm font-semibold text-indigo-300 mb-2">💡 Activity Insight</h3>
                     <p className="text-gray-300 text-sm leading-relaxed">
                        Based on the data, this team prefers to work on 
                        <span className="font-medium text-white"> {busiestDay}s </span> 
                        and hits their stride around <span className="font-medium text-white">{formatHour(maxHour)}</span>. 
                        
                        {(maxHour >= 0 && maxHour <= 5) && (
                            <span className="text-amber-400 ml-1"> Warning: Significant activity detected in early morning hours (Burnout Risk).</span>
                        )}
                        
                        {(maxDayIndex === 0 || maxDayIndex === 6) && (
                            <span className="text-emerald-400 ml-1"> High weekend activity suggests hackathon mode or crunch time.</span>
                        )}
                     </p>
                </section>
            </main>
        </div>
    );
};

export default ActivityPage;
