
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, UserProfile, Task } from '../types';
import * as gemini from '../services/geminiService';
import { api } from '../services/mockApi';

interface AiLabScreenProps {
  user: UserProfile;
  tasks: Task[];
}

const AiLabScreen: React.FC<AiLabScreenProps> = ({ user, tasks }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickCommands = [
    { label: "Optimize My Day", prompt: "Dr. Rudhh, look at my schedule and suggest one tactical improvement for today." },
    { label: "Study Strategy", prompt: "Suggest a scientifically proven study method for one of my active academic tasks." },
    { label: "Motivation Check", prompt: "I am feeling low energy. Provide a tactical psychological boost to keep me in the mission." }
  ];

  useEffect(() => {
    const data = api.getData();
    if (data.chatHistory && data.chatHistory.length > 0) {
      setMessages(data.chatHistory);
    } else {
      setMessages([{ 
        id: '1', 
        role: 'model', 
        text: `Commander ${user.name || 'Hero'}, I am Dr. Rudhh. Your cognitive throughput is currently my primary focus. How shall we refine your operational schedule?` 
      }]);
    }
  }, [user.name]);

  useEffect(() => {
    if (messages.length > 0) api.updateChatHistory(messages);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = useCallback(async (overriddenInput?: string) => {
    const textToSend = (overriddenInput || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const contextHistory = messages.slice(-8).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await gemini.chatWithRudhh(
        textToSend, 
        contextHistory, 
        isThinkingMode,
        tasks
      );
      
      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text,
        modelUsed: response.modelName,
        groundingChunks: response.groundingChunks,
        thinkingProcess: response.thinking
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Neural link timeout. Signal weak. Re-engaging..."
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isThinkingMode, messages, tasks]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] animate-fadeIn">
      {/* Dr. Rudhh Header & Mode Switch */}
      <div className={`p-4 rounded-3xl border transition-all duration-700 mb-4 flex items-center justify-between ${
        isThinkingMode 
          ? 'bg-violet-950/20 border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.1)]' 
          : 'bg-emerald-950/10 border-emerald-500/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
            isThinkingMode ? 'bg-violet-600 text-white animate-pulse' : 'bg-emerald-600 text-white'
          }`}>
            DR
          </div>
          <div>
            <h4 className="font-black text-[11px] text-white uppercase tracking-widest">Tactical Mentor: Dr. Rudhh</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isThinkingMode ? 'bg-violet-400 animate-ping' : 'bg-emerald-500'}`} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${isThinkingMode ? 'text-violet-400' : 'text-emerald-500'}`}>
                {isThinkingMode ? 'Deep Neural Strategy Active' : 'Low Latency Direct Link'}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsThinkingMode(!isThinkingMode)}
          className={`px-3 py-2 rounded-xl text-[8px] font-black border uppercase tracking-tighter transition-all ${
            isThinkingMode 
              ? 'bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/20' 
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {isThinkingMode ? 'FAST LITE' : 'NEURAL PRO'}
        </button>
      </div>

      {/* Main Chat Interface */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar pb-6 scroll-smooth">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[88%] p-5 rounded-3xl transition-all ${
              m.role === 'user' 
                ? 'bg-primary text-white rounded-br-none shadow-xl border border-white/10' 
                : 'glass-card border-white/5 rounded-bl-none shadow-2xl bg-slate-900/40'
            }`}>
              {/* Thinking Trace (Internal Reasoning Visibility) */}
              {m.thinkingProcess && (
                <div className="mb-4 bg-violet-600/5 border border-violet-500/10 p-3 rounded-2xl">
                  <p className="text-[7px] font-black text-violet-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                    <span className="w-1 h-1 bg-violet-400 rounded-full animate-pulse" />
                    Neural Trace Log
                  </p>
                  <p className="text-[10px] text-slate-400 italic leading-relaxed font-medium">
                    {m.thinkingProcess}
                  </p>
                </div>
              )}
              
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium tracking-tight text-slate-100">
                {m.text}
              </div>

              {/* Grounding Info (Search results) */}
              {m.groundingChunks && m.groundingChunks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/5">
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-2">Validated Intelligence</p>
                  <div className="flex flex-col gap-2">
                    {m.groundingChunks.map((chunk, i) => chunk.web && (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] font-bold text-primary/80 hover:text-primary transition-colors flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5"
                      >
                        <span className="opacity-40">0{i+1}</span>
                        <span className="truncate">{chunk.web.title || 'Intel Source'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar for AI Messages */}
              {m.role === 'model' && (
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 opacity-50 hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => gemini.speakResponse(m.text)} 
                    className="text-[9px] font-black text-primary hover:text-white uppercase tracking-widest flex items-center gap-2"
                  >
                    Play Audio Briefing
                  </button>
                  <span className="text-[7px] text-slate-600 font-bold uppercase">
                    {m.modelUsed?.includes('flash-lite') ? 'LITE CORE v2.5' : 'PRO NEURAL v3.0'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-card p-4 px-6 rounded-3xl text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
              </span>
              Dr. Rudhh is synthesizing...
            </div>
          </div>
        )}
      </div>

      {/* Quick Command Chips */}
      {!isLoading && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 px-1">
          {quickCommands.map((cmd, idx) => (
            <button 
              key={idx}
              onClick={() => handleSend(cmd.prompt)}
              className="whitespace-nowrap bg-slate-900 border border-white/5 hover:border-primary/50 text-slate-400 hover:text-primary text-[8px] font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl transition-all active:scale-95"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Console */}
      <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-[2rem] border border-white/5 shadow-2xl focus-within:border-primary/50 transition-colors">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="ENTER COMMAND..."
          className="flex-1 bg-transparent border-none p-4 text-sm focus:outline-none placeholder:text-slate-800 uppercase font-black tracking-widest text-white"
        />
        <button 
          onClick={() => handleSend()} 
          disabled={isLoading || !input.trim()} 
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-lg disabled:opacity-20 ${
            isThinkingMode ? 'bg-violet-600 shadow-violet-500/20' : 'bg-primary shadow-primary/20'
          }`}
        >
          <span className="text-lg font-bold">➜</span>
        </button>
      </div>
    </div>
  );
};

export default AiLabScreen;
