
import React from 'react';
import { Leaf, LogIn } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-[#0c120c] flex flex-col items-center justify-center p-6 max-w-2xl mx-auto">
      <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center gap-4">
           <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
              <Leaf className="w-12 h-12 text-emerald-500" />
           </div>
           <div>
              <h1 className="text-4xl font-serif font-bold text-white tracking-tight">The Conservatory</h1>
              <p className="text-emerald-500/60 uppercase tracking-[0.4em] text-[10px] font-bold mt-2">Digital Twin Management</p>
           </div>
        </div>

        <div className="max-w-xs mx-auto text-slate-400 text-sm leading-relaxed">
          A voice-first aquaculture and plant tracking system with Gemini-powered intelligence.
        </div>

        <button 
          onClick={onLogin}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-900/20 group"
        >
          <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          Sign in with Google
        </button>

        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
          Private Access • Event Sourced Integrity
        </p>
      </div>
    </div>
  );
};
