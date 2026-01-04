
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
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const initialSuggestions = ["Optimize Day", "Study Help", "Motivation"];

  useEffect(() => {
    const data = api.getData();
    if (data.chatHistory && data.chatHistory.length > 0) {
      setMessages(data.chatHistory);
    } else {
      setMessages([{ 
        id: '1', 
        role: 'model', 
        text: `Dr. Rudhh online. Ready for tactical briefing.` 
      }]);
    }
    setDynamicSuggestions(initialSuggestions);
  }, []);

  useEffect(() => {
    if (messages.length > 0) api.updateChatHistory(messages);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (overriddenInput?: string) => {
    const textToSend = (overriddenInput || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const botMsgId = (Date.now() + 1).toString();
    const tempBotMsg: ChatMessage = { 
      id: botMsgId, 
      role: 'model', 
      text: 'Linking...', 
      modelUsed: isThinkingMode ? 'PRO' : 'FLASH' 
    };
    setMessages(prev => [...prev, tempBotMsg]);

    try {
      const contextHistory = messages.slice(-4).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const { modelName, groundingChunks } = await gemini.chatWithRudhhStream(
        textToSend, 
        contextHistory, 
        isThinkingMode,
        tasks,
        (text, thinking) => {
          setMessages(prev => prev.map(m => 
            m.id === botMsgId ? { ...m, text, thinkingProcess: thinking } : m
          ));
        }
      );

      setDynamicSuggestions(["Next step", "Simplify", "Explain"]);
      
      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { ...m, modelUsed: modelName, groundingChunks } : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { ...m, text: "Connection reset. Try again." } : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isThinkingMode, messages, tasks]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] animate-fadeIn">
      {/* Tactical Status */}
      <div className={`p-4 rounded-3xl border mb-4 flex items-center justify-between transition-colors ${
        isThinkingMode ? 'bg-violet-950/20 border-violet-500/30' : 'bg-emerald-950/10 border-emerald-500/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
            isThinkingMode ? 'bg-violet-600 text-white animate-pulse' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
          }`}>DR</div>
          <div>
            <h4 className="font-black text-[10px] text-white uppercase tracking-widest">Instant Link: {isThinkingMode ? 'Deep' : 'Flash'}</h4>
            <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">v3.3 Optimized</p>
          </div>
        </div>
        <button 
          onClick={() => setIsThinkingMode(!isThinkingMode)}
          className={`px-3 py-1.5 rounded-lg text-[8px] font-black border uppercase tracking-tighter ${
            isThinkingMode ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-500 border-slate-700'
          }`}
        >
          {isThinkingMode ? 'PRO' : 'FLASH'}
        </button>
      </div>

      {/* Terminal */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              m.role === 'user' ? 'bg-primary text-white rounded-br-none shadow-lg' : 'glass-card border-white/5 rounded-bl-none bg-slate-900/40'
            }`}>
              {m.thinkingProcess && (
                <div className="mb-2 bg-violet-600/5 border border-violet-500/10 p-2 rounded-xl text-[9px] text-slate-500 italic">
                  {m.thinkingProcess}
                </div>
              )}
              <div className="text-[12px] leading-relaxed font-medium text-slate-100">
                {m.text}
              </div>
              {m.role === 'model' && m.text && !isLoading && (
                <div className="mt-3 pt-2 border-t border-white/5 flex gap-3">
                  <button onClick={() => gemini.speakResponse(m.text)} className="text-[8px] font-black text-primary uppercase">Listen</button>
                  <span className="text-[6px] text-slate-600 uppercase ml-auto">{m.modelUsed}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {!isLoading && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {dynamicSuggestions.map((label, idx) => (
            <button 
              key={idx}
              onClick={() => handleSend(label)}
              className="bg-slate-900 border border-white/5 text-slate-400 text-[8px] font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:text-primary"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-[2rem] border border-white/10 shadow-2xl">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="SEND COMMAND..."
          className="flex-1 bg-transparent border-none p-3 text-sm focus:outline-none placeholder:text-slate-800 uppercase font-black text-white"
        />
        <button 
          onClick={() => handleSend()} 
          disabled={isLoading || !input.trim()} 
          className={`w-10 h-10 flex items-center justify-center rounded-full ${isThinkingMode ? 'bg-violet-600' : 'bg-primary'}`}
        >
          <span className="text-sm font-bold">➜</span>
        </button>
      </div>
    </div>
  );
};

export default AiLabScreen;
