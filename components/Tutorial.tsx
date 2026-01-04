
import React, { useState } from 'react';

interface TutorialProps {
  onComplete: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome Hero!",
      description: "Questly helps you level up your academic life through missions and consistency.",
      icon: "✨"
    },
    {
      title: "Active Missions",
      description: "Quests have timers. Complete them before time runs out to earn full XP. Fail, and you'll lose points!",
      icon: "⌛"
    },
    {
      title: "Rank Up",
      description: "Earn XP to climb the ranks from Iron to Mythic. Build streaks to boost your rewards!",
      icon: "🏆"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="glass-card max-w-sm w-full p-8 rounded-3xl border border-primary/30 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-4xl mb-6">
          {steps[step].icon}
        </div>
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">
          {steps[step].title}
        </h2>
        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
          {steps[step].description}
        </p>
        
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-slate-800'}`} 
            />
          ))}
        </div>

        <div className="flex flex-col w-full gap-3">
          <button 
            onClick={handleNext}
            className="w-full bg-primary text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {step === steps.length - 1 ? "Start Journey" : "Next Step"}
          </button>
          <button 
            onClick={onComplete}
            className="w-full p-2 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
          >
            Skip Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
