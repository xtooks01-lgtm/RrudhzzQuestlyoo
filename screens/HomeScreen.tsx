
import React, { useState, useMemo, useEffect } from 'react';
import { Task, UserProfile } from '../types';
import TaskCard from '../components/TaskCard';
import { soundService } from '../services/soundService';

interface HomeScreenProps {
  user: UserProfile;
  tasks: Task[];
  onTasksUpdate: (tasksOrUpdater: Task[] | ((prev: Task[]) => Task[])) => void;
  onComplete: (xp: number, isMajorQuest: boolean) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, tasks, onTasksUpdate, onComplete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [mode, setMode] = useState<'manual' | 'duration'>('duration');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [end, setEnd] = useState('');
  const [duration, setDuration] = useState(60);
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (mode === 'duration') {
      setEnd(calculateEndFromDuration(start, duration));
    }
  }, [start, duration, mode]);

  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks
      .filter(t => t.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks]);

  function calculateEndFromDuration(startTime: string, durMin: number) {
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + durMin, 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  const checkOverlap = (newStart: string, newEnd: string) => {
    return todayTasks.some(t => {
      return (newStart >= t.startTime && newStart < t.endTime) ||
             (newEnd > t.startTime && newEnd <= t.endTime) ||
             (newStart <= t.startTime && newEnd >= t.endTime);
    });
  };

  const handleCreateQuest = (force: boolean = false) => {
    const finalEnd = mode === 'duration' ? calculateEndFromDuration(start, duration) : (end || calculateEndFromDuration(start, 60));
    
    // Improved validation: Ignore start/end order if it's likely a midnight wrap,
    // as long as the inputs are not empty and title is present.
    const isValid = title.trim() !== '' && start !== '' && finalEnd !== '';

    if (!isValid) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (!force && checkOverlap(start, finalEnd)) {
      setShowOverlapWarning(true);
      return;
    }

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: title.toUpperCase(),
      startTime: start,
      endTime: finalEnd,
      isCompleted: false,
      isLate: false,
      xpValue: 50,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    onTasksUpdate(prev => [...prev, newTask]);
    soundService.playAdd();
    setIsAdding(false);
    setShowOverlapWarning(false);
    setTitle('');
  };

  const toggleTask = (id: string) => {
    onTasksUpdate(prev => prev.map(t => {
      if (t.id === id) {
        const now = new Date();
        const [h, m] = t.endTime.split(':').map(Number);
        const endD = new Date();
        endD.setHours(h, m, 0, 0);
        
        // Handle next-day tasks correctly
        const [sh, sm] = t.startTime.split(':').map(Number);
        if (h < sh) endD.setDate(endD.getDate() + 1);

        const isLate = now > endD;
        const finalXP = isLate ? 0 : t.xpValue;
        onComplete(finalXP, true);
        
        return { ...t, isCompleted: true, isLate, completedAt: now.toISOString() };
      }
      return t;
    }));
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-32">
      <header className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Operations</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Full-Day Timetable</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary hover:brightness-110 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 border border-white/10"
        >
          New Mission
        </button>
      </header>

      <div className="space-y-4 px-1">
        {todayTasks.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center glass-card rounded-3xl border-dashed border-2 border-white/5 opacity-50">
             <span className="text-3xl mb-4">⚓</span>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center px-8">No missions scheduled for this timeline.</p>
          </div>
        ) : (
          todayTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onToggle={toggleTask} 
              onStart={() => {}}
              onDelete={(id) => onTasksUpdate(prev => prev.filter(t => t.id !== id))} 
            />
          ))
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className={`glass-card tactical-border w-full max-w-md p-8 rounded-3xl border-white/10 ${shake ? 'animate-shake' : ''}`}>
            <h4 className="text-lg font-black text-white uppercase mb-8 tracking-tighter italic">Establish Schedule</h4>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Objective</label>
                <input 
                  autoFocus 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="CODE NAME" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white uppercase font-bold focus:border-primary outline-none" 
                />
              </div>

              <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-white/5">
                <button 
                  onClick={() => setMode('duration')} 
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'duration' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500'}`}
                >
                  Duration
                </button>
                <button 
                  onClick={() => setMode('manual')} 
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === 'manual' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500'}`}
                >
                  Manual
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Start Time</label>
                  <input 
                    type="time" 
                    value={start} 
                    onChange={e => setStart(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-primary outline-none" 
                  />
                </div>
                {mode === 'manual' ? (
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">End Time</label>
                    <input 
                      type="time" 
                      value={end} 
                      onChange={e => setEnd(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-primary outline-none" 
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Presets (min)</label>
                    <div className="relative">
                      <select 
                        value={duration} 
                        onChange={e => setDuration(Number(e.target.value))} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold focus:border-primary outline-none appearance-none"
                      >
                        <option value={30}>30 Min</option>
                        <option value={60}>60 Min</option>
                        <option value={90}>90 Min</option>
                        <option value={120}>120 Min</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showOverlapWarning && (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 text-center">Conflict detected in this time slot.</p>
                <button 
                  onClick={() => handleCreateQuest(true)} 
                  className="w-full text-[10px] font-black text-white bg-amber-600 px-4 py-3 rounded-xl uppercase tracking-widest hover:brightness-110"
                >
                  Force Deployment
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-10">
              <button 
                onClick={() => handleCreateQuest(false)} 
                className="w-full bg-primary text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all hover:brightness-110"
              >
                Schedule Mission
              </button>
              <button 
                onClick={() => { setIsAdding(false); setShowOverlapWarning(false); }} 
                className="w-full p-2 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default HomeScreen;
