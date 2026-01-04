
import React, { useState, useRef, useEffect } from 'react';
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

  useEffect(() => {
    const data = api.getData();
    if (data.chatHistory && data.chatHistory.length > 0) {
      setMessages(data.chatHistory);
    } else {
      setMessages([{ 
        id: '1', 
        role: 'model', 
        text: `Hero, I am Dr. Rudhh. Your cognitive performance is my priority. How shall we optimize your schedule today?` 
      }]);
    }
  }, [user.name]);

  useEffect(() => {
    if (messages.length > 0) {
      api.updateChatHistory(messages);
    }
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const contextHistory = messages.slice(-8).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await gemini.chatWithRudhh(
        input, 
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
        text: "Tactical link timeout. Re-engage when signal stabilizes."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] animate-fadeIn">
      {/* Dr. Rudhh Tactical Banner */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 backdrop-blur-xl mb-6 ${
        isThinkingMode 
          ? 'bg-violet-950/30 border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]' 
          : 'bg-emerald-950/20 border-emerald-500/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all shadow-lg ${
            isThinkingMode ? 'bg-violet-600 text-white animate-pulse' : 'bg-emerald-600 text-white'
          }`}>
            DR
          </div>
          <div>
            <span className="font-black text-[10px] text-white uppercase tracking-[0.2em] block">Dr. Rudhh</span>
            <span className={`text-[8px] font-bold uppercase flex items-center gap-1.5 ${isThinkingMode ? 'text-violet-400' : 'text-emerald-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isThinkingMode ? 'bg-violet-400 animate-ping' : 'bg-emerald-500'}`} />
              {isThinkingMode ? 'Deep Neural Reasoning' : 'Fast Tactical Link'}
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsThinkingMode(!isThinkingMode)}
          className={`px-4 py-2 rounded-xl text-[9px] font-black border transition-all uppercase tracking-widest ${
            isThinkingMode 
              ? 'bg-violet-600/20 text-violet-400 border-violet-500/50' 
              : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'
          }`}
        >
          {isThinkingMode ? 'Standard Link' : 'Think Deeply'}
        </button>
      </div>

      {/* Message Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar pb-6">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-5 rounded-3xl ${
              m.role === 'user' 
                ? 'bg-primary text-white rounded-br-none shadow-xl border border-white/10' 
                : 'glass-card border-white/5 rounded-bl-none shadow-2xl relative bg-slate-900/40'
            }`}>
              {/* Thinking Detail - Neural Processing visibility */}
              {m.thinkingProcess && (
                <details className="mb-4 group">
                  <summary className="list-none cursor-pointer flex items-center gap-2 text-[7px] font-black text-violet-400 uppercase tracking-[0.3em] opacity-60 hover:opacity-100 transition-opacity">
                    <span className="group-open:rotate-90 transition-transform">▶</span> Neural Processing Log
                  </summary>
                  <div className="mt-3 p-3 bg-black/40 rounded-2xl border border-violet-500/10">
                    <p className="text-[10px] text-slate-400 italic leading-relaxed font-medium">
                      {m.thinkingProcess}
                    </p>
                  </div>
                </details>
              )}
              
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium tracking-tight">
                {m.text}
              </div>

              {/* Grounding Sources */}
              {m.groundingChunks && m.groundingChunks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Intelligence Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {m.groundingChunks.map((chunk, i) => chunk.web && (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[8px] font-bold text-primary/70 hover:text-primary transition-colors flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5"
                      >
                        🔗 {chunk.web.title || 'Intel'}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Footer */}
              {m.role === 'model' && (
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => gemini.speakResponse(m.text)} 
                    className="text-[9px] font-black text-primary hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    Listen
                    <div className="flex gap-0.5">
                      <div className="w-[1.5px] h-2 bg-primary/40 animate-pulse" />
                      <div className="w-[1.5px] h-3 bg-primary/40 animate-pulse delay-75" />
                    </div>
                  </button>
                  <span className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter">
                    {m.modelUsed?.includes('flash-lite') ? 'LITE LINK' : 'PRO NEURAL'} v3.1
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-card p-4 px-6 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
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

      {/* Input Panel */}
      <div className="mt-4 flex items-center gap-3 bg-slate-950/60 p-2 rounded-3xl border border-white/5 backdrop-blur-3xl shadow-2xl">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="SEND COMMAND..."
          className="flex-1 bg-transparent border-none p-4 text-sm focus:outline-none placeholder:text-slate-700 uppercase font-black tracking-widest text-white"
        />
        <button 
          onClick={handleSend} 
          disabled={isLoading || !input.trim()} 
          className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black disabled:opacity-20 transition-all active:scale-90 shadow-lg ${
            isThinkingMode ? 'bg-violet-600 shadow-violet-500/20' : 'bg-primary shadow-primary/20'
          }`}
        >
          ➜
        </button>
      </div>
    </div>
  );
};

export default AiLabScreen;
