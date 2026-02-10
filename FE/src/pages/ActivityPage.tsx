
import React, { useEffect, useState } from 'react';
import { useRepo } from '../contexts/RepoContext';
import { Activity, Clock, Calendar, TrendingUp } from 'lucide-react';
import PunchCardGraph from '../components/PunchCardGraph';
import CommitHistoryChart from '../components/CommitHistoryChart';

interface ActivityData {
  punchCard: number[][]; // [day, hour, count]
  codeFrequency: number[][]; // [timestamp, additions, deletions]
  timeline: { date: string; count: number }[];
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
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_URL}/api/activity/pulse`, {
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

    if (repoLoading || loading) {
        return (
            <div className="flex h-full items-center justify-center text-gray-400">
                <Activity className="animate-pulse mr-2" />
                <span>Loading activity pulse...</span>
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
        <div className="flex flex-col h-full bg-[#0a0a0c] overflow-y-auto custom-scrollbar">
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
                            Timeline History (Tanggal)
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
                </section>

                {/* Punch Card Graph */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                         <div>
                             <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                Working Habits (Pola Jam Kerja)
                             </h2>
                             <p className="text-xs text-gray-500 mt-1 ml-3.5">
                                Agregasi/gabungan semua aktivitas berdasarkan hari dan jam.
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
