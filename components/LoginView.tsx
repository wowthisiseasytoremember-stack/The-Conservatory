import React from 'react';
import { Leaf, LogIn, UserPlus } from 'lucide-react';

interface LoginViewProps {
  onLogin: (asGuest?: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 paper-texture">
      <div className="text-center space-y-12 animate-in fade-in zoom-in duration-1000 max-w-lg">
        <div className="flex flex-col items-center gap-6">
           <div className="w-32 h-32 bg-botanical/5 rounded-full flex items-center justify-center border border-botanical/10 shadow-2xl shadow-botanical/10 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 to-transparent rounded-full animate-pulse" />
              <Leaf className="w-16 h-16 text-botanical" />
           </div>
           <div className="space-y-2">
              <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground leading-tight italic">
                The <span className="text-gold">Conservatory</span>
              </h1>
              <p className="text-botanical/60 uppercase tracking-[0.5em] text-[10px] font-bold">
                Digital Cabinet of Curiosities
              </p>
           </div>
        </div>

        <div className="max-w-xs mx-auto text-muted-foreground font-body text-base leading-relaxed italic">
          An AI-powered archive for the serious steward. 
          Protect life, document wonder, and bridge the ancestral gap.
        </div>

        <button 
          onClick={onLogin}
          className="w-full bg-botanical hover:bg-botanical-light text-primary-foreground py-5 rounded-2xl font-bold flex items-center justify-center gap-4 transition-all shadow-2xl shadow-botanical/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-10" />
          <span className="relative z-10 text-lg">Enter the Archives</span>
        </button>

        <div className="pt-8 flex flex-col items-center gap-4 opacity-40">
          <div className="h-px w-12 bg-border" />
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-bold">
            Private Access • Established 2026
          </p>
        </div>
      </div>
    </div>
  );
};
