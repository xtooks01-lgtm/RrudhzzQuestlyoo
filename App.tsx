
import React, { useState, useEffect, useCallback } from 'react';
import { Task, UserProfile, DailyProgress } from './types';
import { api } from './services/mockApi';
import Navigation from './components/Navigation';
import HomeScreen from './screens/HomeScreen';
import ProgressScreen from './screens/ProgressScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import AiLabScreen from './screens/AiLabScreen';
import Onboarding from './components/Onboarding';
import Tutorial from './components/Tutorial';
import { XP_PER_LEVEL } from './components/constants';
import { soundService } from './services/soundService';

const LogoQ = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" stroke="url(#logo-gradient)" strokeWidth="8" />
    <path d="M50 30V50L65 65" stroke="url(#logo-gradient)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#2563eb" />
      </linearGradient>
    </defs>
  </svg>
);

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<DailyProgress[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const loadData = () => {
      try {
        const data = api.getData();
        setTasks(data.tasks || []);
        setUser(data.user);
        setHistory(data.history || []);
        setIsDataLoaded(true);
      } catch (err) {
        console.error("Critical Launch Error:", err);
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (user && isDataLoaded) api.updateUser(user);
  }, [user, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) api.updateTasks(tasks);
  }, [tasks, isDataLoaded]);

  const handleTaskXP = useCallback((xpValue: number, isMajorQuest: boolean = false) => {
    if (!user) return;
    
    if (xpValue > 0) {
      soundService.playComplete();
    } else {
      soundService.playDelete();
    }
    
    setUser(prev => {
      if (!prev) return null;
      let newXP = prev.xp + xpValue;
      let newRankXP = prev.rankXP + xpValue;
      
      if (newXP < 0) newXP = 0;
      if (newRankXP < 0) newRankXP = 0;

      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      if (newLevel > (prev.level || 1)) soundService.playBadge();

      return { 
        ...prev, 
        xp: newXP, 
        rankXP: newRankXP, 
        level: newLevel,
        totalCompleted: prev.totalCompleted + (xpValue >= 0 ? 1 : 0) 
      };
    });
  }, [user]);

  const completeTutorial = () => {
    if (user) {
      setUser({ ...user, tutorialComplete: true });
    }
  };

  if (!isDataLoaded) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (user && !user.onboardingComplete) {
    return (
      <Onboarding 
        onComplete={(newUser, initialTasks) => { 
          setUser({ ...newUser, tutorialComplete: false }); 
          setTasks(initialTasks); 
        }} 
      />
    );
  }

  if (!user) return null;

  const currentLevelXP = user.xp % XP_PER_LEVEL;
  const levelProgress = (currentLevelXP / XP_PER_LEVEL) * 100;

  return (
    <div className="min-h-screen max-w-lg mx-auto relative overflow-x-hidden bg-[#020617] text-slate-100 flex flex-col">
      {user && !user.tutorialComplete && <Tutorial onComplete={completeTutorial} />}
      
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-950/20 via-[#020617] to-blue-950/20 pointer-events-none" />
      
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-40 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <LogoQ className="w-8 h-8" />
          <span className="text-xl font-black tracking-tighter uppercase italic">Questly</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
             <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Lvl {user.level}</span>
             <div className="w-16 h-1 bg-slate-900 rounded-full mt-1 overflow-hidden">
               <div className="h-full bg-primary transition-all duration-500" style={{ width: `${levelProgress}%` }} />
             </div>
          </div>
        </div>
      </header>

      <main className="p-6 pt-4 pb-32 flex-1 relative z-10">
        {activeTab === 'home' && <HomeScreen user={user} tasks={tasks} onTasksUpdate={setTasks} onComplete={handleTaskXP} />}
        {activeTab === 'guide' && <AiLabScreen user={user} tasks={tasks} />}
        {activeTab === 'progress' && <ProgressScreen user={user} history={history} tasks={tasks} />}
        {activeTab === 'profile' && <ProfileScreen user={user} />}
        {activeTab === 'settings' && <SettingsScreen user={user} onUpdateUser={setUser} />}
      </main>

      <Navigation currentTab={activeTab} setTab={setActiveTab} />

      <style>{`
        :root { --primary: #7c3aed; }
        .bg-primary { background-color: #7c3aed; }
        .text-primary { color: #7c3aed; }
        .glass-card { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default App;
