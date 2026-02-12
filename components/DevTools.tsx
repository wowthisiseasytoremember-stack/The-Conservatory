
import React, { useState } from 'react';
import { useConservatory } from '../services/store';
import { geminiService } from '../services/geminiService';
import { Terminal, X, Zap, Database, Bot, Copy, Check, Loader2, Play, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { AdvisoryReport } from '../types';

export const DevTools: React.FC = () => {
  const { processVoiceInput, testConnection } = useConservatory();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'contractor'>('scenarios');
  const [dbStatus, setDbStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Advisory State
  const [intent, setIntent] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [report, setReport] = useState<AdvisoryReport | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTestConnection = async () => {
    setDbStatus('testing');
    setDbError(null);
    const result = await testConnection();
    setDbStatus(result.success ? 'success' : 'fail');
    if (!result.success && result.error) {
        setDbError(result.error);
    }
    if (result.success) {
        setTimeout(() => setDbStatus('idle'), 3000);
    }
  };

  const handleAskAdvisor = async () => {
    if (!intent.trim()) return;
    setIsThinking(true);
    setReport(null);
    try {
        const result = await geminiService.getAdvisoryReport(intent);
        setReport(result);
    } catch (e) {
        console.error(e);
        // Error state handled by UI showing empty/error message if needed
    } finally {
        setIsThinking(false);
    }
  };

  const handleCopyPrompt = () => {
    if (report) {
        navigator.clipboard.writeText(report.ide_prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const scenarios = [
    { 
      label: "New Tank", 
      cmd: "Create a 20 gallon freshwater tank in the living room called The Shallows." 
    },
    { 
      label: "Log Fish", 
      cmd: "I just added 12 Neon Tetras and 5 Cherry Shrimp to The Shallows." 
    },
    { 
      label: "Log Parameters", 
      cmd: "Log a water change for The Shallows. pH is 6.8 and temperature is 78 degrees." 
    },
    { 
      label: "Ambiguous", 
      cmd: "Add 2 snails to the tank." 
    }
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-slate-800/50 p-2 rounded-full border border-slate-700 hover:bg-slate-700 hover:text-emerald-400 text-slate-500 transition-colors"
        title="Open Dev Tools"
      >
        <Terminal className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className={`fixed top-4 right-4 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 animate-in slide-in-from-right-10 flex flex-col gap-4 transition-all duration-300 ${report ? 'w-[480px]' : 'w-80'}`}>
      {/* Header & Tabs */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
           <button 
             onClick={() => setActiveTab('scenarios')}
             className={`p-1.5 rounded-md transition-all ${activeTab === 'scenarios' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
             title="Test Scenarios"
           >
             <Zap className="w-4 h-4" />
           </button>
           <button 
             onClick={() => setActiveTab('contractor')}
             className={`p-1.5 rounded-md transition-all ${activeTab === 'contractor' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
             title="Advisory Service"
           >
             <Bot className="w-4 h-4" />
           </button>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {activeTab === 'scenarios' ? (
        /* Scenarios View */
        <div className="space-y-4">
             {/* DB Test Button */}
             <div className="space-y-2">
                 <button 
                   onClick={handleTestConnection}
                   className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                     dbStatus === 'idle' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' :
                     dbStatus === 'testing' ? 'bg-amber-500/20 text-amber-500 animate-pulse' :
                     dbStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                     'bg-red-500/20 text-red-400'
                   }`}
                 >
                   <Database className="w-3 h-3" />
                   {dbStatus === 'idle' && "Test DB Connection"}
                   {dbStatus === 'testing' && "Verifying..."}
                   {dbStatus === 'success' && "Ping/Pong Verified"}
                   {dbStatus === 'fail' && "Connection Failed"}
                 </button>
                 {dbError && (
                     <div className="bg-red-950/30 border border-red-500/20 p-2 rounded text-[10px] text-red-300 flex gap-2 items-start">
                         <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                         <span className="break-words">{dbError}</span>
                     </div>
                 )}
             </div>

             {/* Scenario List */}
             <div className="space-y-2">
                {scenarios.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => processVoiceInput(s.cmd)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 border border-transparent text-xs text-slate-300 transition-all group"
                  >
                    <div className="font-bold mb-0.5">{s.label}</div>
                    <div className="text-[10px] text-slate-500 truncate group-hover:text-emerald-500/70">"{s.cmd}"</div>
                  </button>
                ))}
             </div>
        </div>
      ) : (
        /* Advisory View */
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <h4 className="text-emerald-400 font-bold text-xs flex items-center gap-2 mb-1">
                    <Bot className="w-3 h-3" /> Architectural Advisor
                </h4>
                <p className="text-[10px] text-emerald-500/70 leading-relaxed">
                   Consult on feature implementation. I analyze the intent against the current Entity/Event schema and return a safe implementation plan.
                </p>
            </div>

            <div className="space-y-2">
                <textarea 
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="E.g., 'How do I add support for tracking fertilization schedules?'"
                    className="w-full bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none placeholder:text-slate-600 min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAskAdvisor();
                        }
                    }}
                />
                
                {!report && (
                    <button 
                        onClick={handleAskAdvisor}
                        disabled={isThinking || !intent.trim()}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors"
                    >
                        {isThinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                        Generate Advisory Report
                    </button>
                )}
            </div>

            {report && (
                <div className="space-y-4 pt-2 border-t border-slate-800 animate-in slide-in-from-bottom-2">
                    
                    {/* Status Bar */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Report Status</span>
                        {report.persistence_status === 'SECURE' ? (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <ShieldCheck className="w-3 h-3" /> Audit Log Secure
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                <ShieldAlert className="w-3 h-3" /> Audit Log Failed
                            </div>
                        )}
                    </div>

                    {/* Strategy */}
                    <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">Strategy</h5>
                        <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                            {report.strategy}
                        </p>
                    </div>

                    {/* Impact Analysis */}
                    <div className="space-y-1">
                        <h5 className="text-xs font-bold text-amber-400">Impact Analysis</h5>
                        <p className="text-xs text-amber-500/80 leading-relaxed bg-amber-900/10 p-2 rounded-lg border border-amber-500/20">
                            {report.impact_analysis}
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">Implementation Steps</h5>
                        <ul className="text-xs text-slate-400 list-disc list-inside space-y-1 ml-1">
                            {report.implementation_steps.map((step, i) => (
                                <li key={i}>{step}</li>
                            ))}
                        </ul>
                    </div>

                    {/* IDE Prompt Action */}
                    <button 
                        onClick={handleCopyPrompt}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Prompt Copied!" : "Copy Master IDE Prompt"}
                    </button>
                    
                    <button 
                        onClick={() => { setReport(null); setIntent(''); }}
                        className="w-full py-2 text-xs text-slate-500 hover:text-white transition-colors"
                    >
                        Start New Query
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};
