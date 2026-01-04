
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Task } from '../types';
import { soundService } from '../services/soundService';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, onStart }) => {
  const [status, setStatus] = useState<'pending' | 'active' | 'expired' | 'completed'>('pending');
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(0);
  
  const criticalSoundPlayedRef = useRef(false);
  const failureSoundPlayedRef = useRef(false);

  const updateTimer = useCallback(() => {
    if (task.isCompleted) {
      setStatus('completed');
      setTimeLeft('QUEST COMPLETE');
      setProgress(100);
      return;
    }

    const now = new Date();
    const [sh, sm] = task.startTime.split(':').map(Number);
    const [eh, em] = task.endTime.split(':').map(Number);
    
    const startD = new Date();
    startD.setHours(sh, sm, 0, 0);
    
    let endD = new Date();
    endD.setHours(eh, em, 0, 0);

    // Handle cross-midnight logic
    if (eh < sh || (eh === sh && em < sm)) {
      endD.setDate(endD.getDate() + 1);
    }

    if (now < startD) {
      setStatus('pending');
      setTimeLeft(`Starts ${task.startTime}`);
      setProgress(0);
    } else if (now >= startD && now <= endD) {
      const total = endD.getTime() - startD.getTime();
      const elapsed = now.getTime() - startD.getTime();
      const currentProgress = (elapsed / total) * 100;
      
      setStatus('active');
      setProgress(currentProgress);

      const diff = endD.getTime() - now.getTime();
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}m ${s}s remaining`);

      if (currentProgress > 90 && !criticalSoundPlayedRef.current) {
        soundService.playCritical(); 
        criticalSoundPlayedRef.current = true;
      }
    } else {
      if (!task.isCompleted && !failureSoundPlayedRef.current) {
        soundService.playWarning();
        failureSoundPlayedRef.current = true;
      }
      setStatus('expired');
      setTimeLeft('MISSION BYPASSED (0 XP)');
      setProgress(100);
    }
  }, [task.id, task.isCompleted, task.startTime, task.endTime]); // Removed 'status' to prevent infinite loop

  useEffect(() => {
    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateTimer]);

  const isCritical = useMemo(() => status === 'active' && progress > 90, [status, progress]);

  const cardStyle = useMemo(() => {
    if (status === 'completed') return 'border-emerald-500/30 bg-emerald-500/5';
    if (status === 'expired') return 'border-rose-500/50 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.2)]';
    if (status === 'active') return isCritical ? 'border-rose-500/60 bg-rose-500/10 animate-pulse' : 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/5';
    return 'border-white/5 bg-slate-900/20';
  }, [status, isCritical]);

  return (
    <div className={`relative flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-500 ${cardStyle}`}>
      {status === 'expired' && !task.isCompleted && (
        <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[7px] font-black px-3 py-1 rounded-full z-10 shadow-lg animate-bounce tracking-[0.2em] uppercase border border-rose-400/50">
          Tactical Alert
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-white/5 pr-4">
          <span className="text-[10px] font-black text-slate-500 tracking-tighter uppercase">{task.startTime}</span>
          <div className="h-4 w-[1px] bg-slate-800 my-1" />
          <span className="text-[10px] font-black text-slate-700 tracking-tighter uppercase">{task.endTime}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold uppercase tracking-tight truncate ${status === 'completed' ? 'text-emerald-400 line-through opacity-60' : 'text-white'}`}>
            {task.title}
          </h3>
          <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2 ${
            isCritical ? 'text-rose-500' :
            status === 'active' ? 'text-primary' : 
            status === 'expired' ? 'text-rose-500 animate-pulse' : 
            status === 'completed' ? 'text-emerald-500' : 'text-slate-500'
          }`}>
            {status === 'active' && isCritical && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
            {timeLeft}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!task.isCompleted && (
            <button 
              onClick={() => onToggle(task.id)}
              disabled={status === 'expired'}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border shadow-inner ${
                status === 'expired' 
                ? 'bg-rose-950/60 text-rose-500 border-rose-500/40 cursor-not-allowed opacity-50' 
                : 'bg-primary text-white border-primary/20 shadow-lg shadow-primary/20 hover:brightness-110'
              }`}
            >
              <span className="text-xl font-bold">✓</span>
            </button>
          )}
          <button 
            onClick={() => onDelete(task.id)}
            className="p-2 text-slate-700 hover:text-rose-500 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {(status === 'active' || (status === 'expired' && !task.isCompleted)) && (
        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
          <div 
            className={`h-full transition-all duration-1000 ${
              status === 'expired' ? 'bg-rose-900/50' : 
              isCritical ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]' : 'bg-primary shadow-[0_0_8px_rgba(139,92,246,0.4)]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default TaskCard;
