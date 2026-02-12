import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Globe, Brain, Sparkles, ExternalLink, Loader2, Info } from 'lucide-react';
import { useConservatory } from '../services/store';

export const AIChatBot: React.FC = () => {
  const { messages, sendMessage, clearMessages } = useConservatory();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Intelligence Toggles
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      await sendMessage(currentInput, {
        search: useSearch,
        thinking: useThinking
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 right-6 z-50 w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-500 transition-all border border-emerald-400/20 group"
        aria-label="Open AI Chat"
      >
        <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full animate-pulse border-2 border-[#0c120c]" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] md:inset-auto md:bottom-24 md:right-6 md:w-[420px] md:h-[650px] bg-[#0c120c] border border-slate-800 md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Sparkles className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-white font-serif font-bold text-lg">Conservatory Guide</h3>
                <div className="flex items-center gap-2 text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  G3-Pro Intelligence Active
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={clearMessages}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-red-400 transition-colors"
                title="Clear History"
              >
                <X className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gradient-to-b from-slate-900/20 to-transparent">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-10 space-y-4">
                <div className="p-6 bg-slate-800/30 rounded-full border border-slate-700">
                  <Brain className="w-12 h-12 text-slate-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-200 font-bold uppercase tracking-widest">Awaiting Input</p>
                  <p className="text-xs text-slate-400">Ask about biology, system design, or current trends.</p>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl p-4 text-sm shadow-xl ${
                  m.role === 'user' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed font-sans">{m.text}</div>
                  
                  {m.groundingLinks && m.groundingLinks.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                      <p className="text-[10px] uppercase font-bold text-cyan-500 flex items-center gap-1.5">
                        <Globe className="w-3 h-3" /> Grounded Search Results
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {m.groundingLinks.map((link, i) => (
                          <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 p-1.5 rounded-lg border border-transparent hover:border-cyan-500/20 flex items-center gap-2 transition-all">
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{link.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.isThinking && !m.isSearch && (
                    <div className="mt-3 flex items-center gap-1.5 text-[9px] text-amber-500/60 font-bold uppercase tracking-tighter">
                      <Brain className="w-3 h-3" /> Processed via Deep Thinking Mode
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-3 items-center shadow-lg">
                  <div className="relative">
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                    {useThinking && <Brain className="absolute inset-0 m-auto w-2 h-2 text-amber-500" />}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-200 font-bold block">
                      {useSearch ? 'Searching Google...' : useThinking ? 'Thinking Deeply...' : 'Processing...'}
                    </span>
                    <span className="text-[10px] text-slate-500 italic block animate-pulse">
                      Consulting The Conservatory Knowledge Base
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls & Input */}
          <div className="p-6 bg-slate-900/90 border-t border-slate-800 space-y-4 backdrop-blur-xl">
            <div className="flex gap-3">
              <button 
                onClick={() => { setUseSearch(!useSearch); setUseThinking(false); }}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${
                  useSearch ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/10' : 'bg-slate-800 border-slate-700 text-slate-500 grayscale'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Grounded
              </button>
              <button 
                onClick={() => { setUseThinking(!useThinking); setUseSearch(false); }}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${
                  useThinking ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10' : 'bg-slate-800 border-slate-700 text-slate-500 grayscale'
                }`}
              >
                <Brain className="w-3.5 h-3.5" /> Reasoning
              </button>
            </div>
            
            <div className="relative group">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={useSearch ? "Ask for recent news or care guides..." : "Ask a complex question..."}
                className="w-full bg-black/60 border border-slate-800 rounded-2xl pl-5 pr-14 py-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600 shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 p-3 bg-emerald-600 rounded-xl text-white hover:bg-emerald-500 disabled:opacity-50 disabled:grayscale transition-all shadow-xl active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 px-1 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              <Info className="w-3 h-3" /> Powered by Gemini-3-Pro
            </div>
          </div>
        </div>
      )}
    </>
  );
};
