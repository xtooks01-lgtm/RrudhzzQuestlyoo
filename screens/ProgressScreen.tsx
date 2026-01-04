
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { DailyProgress, UserProfile, Task, RankName } from '../types';
import { XP_PER_TIER } from '../components/constants';
import { GoogleGenAI } from "@google/genai";

interface ProgressScreenProps {
  user: UserProfile;
  history: DailyProgress[];
  tasks: Task[];
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({ user, history, tasks }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const averageTime = useMemo(() => {
    const completedTasks = tasks.filter(t => t.isCompleted && t.completedAt);
    if (completedTasks.length === 0) return '0m';
    
    const totalMs = completedTasks.reduce((acc, t) => {
      const start = new Date(t.createdAt).getTime();
      const end = new Date(t.completedAt!).getTime();
      return acc + (end - start);
    }, 0);
    
    const avgMs = totalMs / completedTasks.length;
    const mins = Math.floor(avgMs / 60000);
    const hours = Math.floor(mins / 60);
    
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m`;
  }, [tasks]);

  const runTacticalAnalysis = async () => {
    setIsAnalyzing(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `Analyze student productivity:
      - Level: ${user.level}
      - Total Completed: ${user.totalCompleted}
      - Stats: ${JSON.stringify(history)}
      - Missions: ${tasks.map(t => t.title).join(', ')}
      Dr. Rudhh briefing: Provide a 2-sentence tactical performance review. Military academic tone. No emojis.`;

      // Requirement: Fast responses for briefings
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: prompt
      });
      setAnalysis(response.text || "Status: Mission parameters met. Maintain operational intensity.");
    } catch (e) {
      setAnalysis("Briefing link corrupted. Re-establish connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRankBadgeColor = (rank: RankName) => {
    switch(rank) {
      case 'Iron': return 'bg-slate-500';
      case 'Bronze': return 'bg-amber-700';
      case 'Silver': return 'bg-slate-300 text-slate-900';
      case 'Gold': return 'bg-yellow-500 text-yellow-950';
      case 'Platinum': return 'bg-teal-400 text-teal-950';
      case 'Diamond': return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
      case 'Mythic': return 'bg-gradient-to-r from-purple-500 via-rose-500 to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]';
      default: return 'bg-slate-700';
    }
  };

  const currentTierXP = user.rankXP % XP_PER_TIER;
  const progressPercent = (currentTierXP / XP_PER_TIER) * 100;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-32">
      <header className="px-2">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Mastery <span className="text-primary">Intelligence</span></h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Data-driven performance analysis</p>
      </header>

      {/* Rank Visualization */}
      <div className="glass-card p-6 rounded-3xl border border-white/5 bg-slate-900/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${getRankBadgeColor(user.currentRank)}`}>
               {user.currentRank[0]}
             </div>
             <div>
               <h3 className="font-black text-white text-lg leading-none uppercase tracking-widest">{user.currentRank} {user.currentTier}</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Operational Tier</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-xl font-black text-primary">{user.rankXP}</p>
             <p className="text-[9px] text-slate-500 font-bold uppercase">Rank Points</p>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
           <div 
             className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-all duration-1000" 
             style={{ width: `${progressPercent}%` }}
           />
        </div>
      </div>

      {/* Dr. Rudhh Tactical Briefing */}
      <div className="glass-card p-5 rounded-3xl border border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Tactical Briefing</h4>
          <button 
            onClick={runTacticalAnalysis}
            disabled={isAnalyzing}
            className="text-[9px] font-black text-white bg-primary px-3 py-1.5 rounded-lg uppercase tracking-widest disabled:opacity-50"
          >
            {isAnalyzing ? 'Decoding...' : 'Request Review'}
          </button>
        </div>
        {analysis ? (
          <p className="text-xs text-slate-300 leading-relaxed italic font-medium">"{analysis}"</p>
        ) : (
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">Connect to Dr. Rudhh for performance review.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-3xl">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Efficiency</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-orange-500">{averageTime}</span>
          </div>
        </div>
        <div className="glass-card p-5 rounded-3xl">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Success Rate</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-blue-500">{user.totalCompleted}</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Weekly Engagement</h2>
        </div>
        <div style={{ height: '200px', width: '100%', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ 
                  backgroundColor: '#020617', 
                  border: '1px solid #1e293b', 
                  borderRadius: '12px',
                  fontSize: '10px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {history.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.count > 3 ? '#8b5cf6' : '#3b82f6'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProgressScreen;
