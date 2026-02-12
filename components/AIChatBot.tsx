
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Globe, Brain, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const AIChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Toggles
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

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10); // Context window
      const response = await geminiService.chat(input, history, {
        search: useSearch,
        thinking: useThinking
      });

      const aiMsg: ChatMessage = {
        id: uuidv4(),
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        isSearch: useSearch,
        isThinking: useThinking,
        groundingLinks: response.links
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'model',
        text: `Error: ${e.message}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 right-6 z-50 w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-500 transition-all border border-emerald-400/20 group"
      >
        <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full animate-pulse border-2 border-[#0c120c]" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] md:inset-auto md:bottom-24 md:right-6 md:w-96 md:h-[600px] bg-[#0c120c] border border-slate-800 md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h3 className="text-white font-serif font-bold">Conservatory Guide</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-gradient-to-b from-slate-900/20 to-transparent">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-6">
                <Brain className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-sm text-slate-400">Ask me anything about your collection, chemistry, or aquaculture trends.</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  m.role === 'user' 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'bg-slate-800 border border-slate-700 text-slate-200'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  
                  {m.groundingLinks && m.groundingLinks.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Sources
                      </p>
                      {m.groundingLinks.map((link, i) => (
                        <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 truncate">
                          <ExternalLink className="w-2 h-2" /> {link.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 flex gap-2 items-center">
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                  <span className="text-xs text-slate-400 italic">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900/50 border-t border-slate-800 space-y-3">
            <div className="flex gap-2">
              <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                  useSearch ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                <Globe className="w-3 h-3" /> Grounded Search
              </button>
              <button 
                onClick={() => setUseThinking(!useThinking)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                  useThinking ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
                disabled={useSearch} // Grounding and Thinking don't mix well in current models
              >
                <Brain className="w-3 h-3" /> Deep Reasoning
              </button>
            </div>
            
            <div className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                className="w-full bg-black/40 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1.5 p-2 bg-emerald-600 rounded-lg text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
