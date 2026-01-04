
import React from 'react';
import { UserProfile, RankName } from '../types';
import { INITIAL_BADGES, XP_PER_TIER } from '../components/constants';

interface ProfileScreenProps {
  user: UserProfile;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user }) => {
  const getRankStyle = (rank: RankName) => {
    switch(rank) {
      case 'Iron': return 'from-slate-600 to-slate-400 text-slate-100';
      case 'Bronze': return 'from-amber-800 to-amber-600 text-amber-100';
      case 'Silver': return 'from-slate-400 to-slate-200 text-slate-900';
      case 'Gold': return 'from-yellow-600 to-yellow-400 text-yellow-950';
      case 'Platinum': return 'from-teal-500 to-teal-300 text-teal-950';
      case 'Diamond': return 'from-blue-600 to-indigo-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]';
      case 'Mythic': return 'from-purple-600 via-rose-500 to-indigo-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-shimmer';
      default: return 'from-slate-800 to-slate-600';
    }
  };

  const currentTierXP = user.rankXP % XP_PER_TIER;
  const progressPercent = (currentTierXP / XP_PER_TIER) * 100;

  return (
    <div className="flex flex-col gap-8 animate-fadeIn pb-32">
      <section className="flex flex-col items-center pt-8">
        <div className="relative group">
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all" />
          <div className="relative w-36 h-36 rounded-3xl rotate-3 group-hover:rotate-0 transition-transform duration-500 border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-2xl">
            <img 
              src={user.profilePicture || `https://picsum.photos/seed/${user.name}/200`} 
              alt="Avatar" 
              className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700"
            />
          </div>
          <div className="absolute -bottom-3 -right-3 gradient-bg text-white w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-slate-950 font-black text-sm shadow-xl">
            {user.level}
          </div>
        </div>
        <h2 className={`text-3xl font-black mt-8 uppercase tracking-tighter italic ${user.currentRank === 'Mythic' ? 'mythic-text' : 'text-white'}`}>
          {user.name}
        </h2>
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] mt-1">Profile ID: {Math.random().toString(16).substr(2, 6).toUpperCase()}</p>
      </section>

      <section className="glass-card tactical-border p-8 rounded-3xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Current Rank</h3>
          <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gradient-to-br shadow-xl ${getRankStyle(user.currentRank)}`}>
            {user.currentRank} {user.currentTier}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end">
             <div>
               <p className="text-4xl font-black tracking-tighter leading-none text-white">{user.rankXP} <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">PTS</span></p>
               <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-2">Points to next level: {XP_PER_TIER - currentTierXP}</p>
             </div>
          </div>
          
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
            <div 
              className={`h-full transition-all duration-1000 ${
                user.currentRank === 'Mythic' ? 'bg-gradient-to-r from-purple-500 via-rose-500 to-indigo-500 animate-shimmer' : 'bg-primary'
              }`} 
              style={{ width: `${progressPercent}%` }}
            />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-6 rounded-3xl border border-white/5">
           <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Day Streak</p>
           <p className="text-2xl font-black text-orange-500">{user.streak} <span className="text-[10px]">DAYS</span></p>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-white/5">
           <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Tasks Finished</p>
           <p className="text-2xl font-black text-emerald-400">{user.totalCompleted}</p>
        </div>
      </div>

      <section className="px-2">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">My Badges</h3>
        <div className="grid grid-cols-2 gap-4">
          {INITIAL_BADGES.slice(0, 4).map((badge) => {
            const isUnlocked = user.badges.some(b => b.id === badge.id);
            return (
              <div 
                key={badge.id} 
                className={`glass-card p-5 rounded-3xl flex flex-col gap-3 transition-all duration-500 border ${isUnlocked ? 'border-primary/30' : 'border-slate-900 opacity-30 grayscale'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black ${isUnlocked ? 'bg-primary/20 text-primary' : 'bg-slate-950 text-slate-800'}`}>
                  {badge.icon}
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-white mb-1">{badge.name}</h4>
                  <p className="text-[8px] text-slate-500 font-bold leading-tight">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer { background-size: 200% 100%; animation: shimmer 2s linear infinite; }
      `}</style>
    </div>
  );
};

export default ProfileScreen;
