import React from 'react';
import { Leaf, Settings, AlertCircle, LogOut } from 'lucide-react';
import { ConnectionStatus } from '../services/connectionService';
import { BiomeTheme } from '../types';
import { Z_INDEX } from '../src/constants';

interface MainLayoutProps {
  children: React.ReactNode;
  connectionStatus: ConnectionStatus;
  onOpenSettings: () => void;
  onLogout: () => void;
  photoIdentifyComponent: React.ReactNode;
  voiceButtonComponent: React.ReactNode;
  biomeTheme?: BiomeTheme;
  liveTranscript?: string;
  routeTitle?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children, connectionStatus,
  onOpenSettings, onLogout, photoIdentifyComponent, voiceButtonComponent,
  liveTranscript, routeTitle = 'The Conservatory'
}) => {
  return (
    <div
      className="min-h-screen w-full flex flex-col bg-background text-foreground relative paper-texture"
    >
      {/* Header */}
      <header
        className="p-6 pt-10 flex justify-between items-center shrink-0 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-30"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-botanical rounded-xl flex items-center justify-center shadow-lg shadow-botanical/20">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-botanical">Archive</span>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-tighter transition-all ${
                connectionStatus === 'connected' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                  : 'bg-red-500/10 border-red-500/20 text-red-600'
              }`}>
                {connectionStatus === 'connected' ? (
                  <>
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Synchronized
                  </>
                ) : (
                  <>
                    <div className="w-1 h-1 rounded-full bg-red-500" />
                    Local Only
                  </>
                )}
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight italic text-foreground">
              {routeTitle}
            </h1>
          </div>
        </div>

        <div className="flex gap-3">
          {photoIdentifyComponent}
          <button 
            onClick={onOpenSettings}
            className={`p-3 rounded-xl border transition-all ${
              ['error', 'api_disabled', 'permission_denied'].includes(connectionStatus)
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {['error', 'api_disabled', 'permission_denied'].includes(connectionStatus) ? <AlertCircle className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
          </button>
          <button 
            onClick={onLogout} 
            className="p-3 bg-muted rounded-xl border border-border text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-8 pb-32">
        {children}
      </main>

      {/* Rapid Voice Reflection Overlay */}
      {liveTranscript && (
        <div className={`fixed inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none px-12 z-50`}>
          <div className="bg-botanical/95 backdrop-blur-3xl border border-gold/30 px-10 py-8 rounded-[2rem] shadow-[0_0_100px_rgba(25,46,34,0.3)] animate-in fade-in zoom-in duration-300 max-w-lg text-center">
            <p className="text-3xl font-display text-primary-foreground leading-relaxed italic">
              "{liveTranscript}"
            </p>
            <div className="mt-6 flex justify-center gap-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-gold/60 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Voice CTA */}
      <div className="pointer-events-none fixed inset-0 flex items-end justify-center z-40">
        <div className="pointer-events-auto pb-10">
          {voiceButtonComponent}
        </div>
      </div>
    </div>
  );
};
