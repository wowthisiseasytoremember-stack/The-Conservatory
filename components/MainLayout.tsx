
import React from 'react';
import { Leaf, Activity, LayoutGrid, Settings, AlertCircle, LogOut } from 'lucide-react';
import { ConnectionStatus } from '../services/connectionService';

export type BiomeTheme = 'default' | 'blackwater' | 'tanganyika' | 'paludarium' | 'marine';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: 'feed' | 'entities';
  setActiveTab: (tab: 'feed' | 'entities') => void;
  connectionStatus: ConnectionStatus;
  onOpenSettings: () => void;
  onLogout: () => void;
  photoIdentifyComponent: React.ReactNode;
  voiceButtonComponent: React.ReactNode;
  biomeTheme?: BiomeTheme;
  liveTranscript?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children, activeTab, setActiveTab, connectionStatus,
  onOpenSettings, onLogout, photoIdentifyComponent, voiceButtonComponent,
  biomeTheme = 'default', liveTranscript
}) => {
  return (
    <div
      className={`min-h-screen flex flex-col max-w-2xl mx-auto border-x border-slate-900 shadow-2xl relative theme-${biomeTheme}`}
      data-biome={biomeTheme}
      style={{ backgroundColor: 'var(--bio-bg-primary)', color: 'var(--bio-text-primary)' }}
    >
      {/* Header */}
      <header
        className="p-6 pt-10 flex justify-between items-end shrink-0"
        style={{ background: `linear-gradient(to bottom, var(--bio-header-gradient-from), var(--bio-header-gradient-to))` }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--bio-accent)' }}>
            <Leaf className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">The Conservatory</span>
            <div className={`flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-tighter transition-all ${
              connectionStatus === 'connected' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {connectionStatus === 'connected' ? (
                <>
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </>
              ) : (
                <>
                  <div className="w-1 h-1 rounded-full bg-red-500" />
                  Offline
                </>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight" style={{ color: 'var(--bio-text-primary)' }}>
            {activeTab === 'feed' ? 'Activity' : 'Collection'}
          </h1>
        </div>
        <div className="flex gap-2">
          {photoIdentifyComponent}
          <div className="flex flex-col gap-2">
             <button 
                onClick={onOpenSettings}
                className={`p-3 rounded-full border transition-all ${
                  ['error', 'api_disabled', 'permission_denied'].includes(connectionStatus)
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                {['error', 'api_disabled', 'permission_denied'].includes(connectionStatus) ? <AlertCircle className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
              </button>
              <button onClick={onLogout} className="p-3 bg-slate-800/80 rounded-full border border-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar pb-32">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto px-6 pb-6 z-40 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-2 flex items-center justify-around shadow-2xl pointer-events-auto">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'feed' ? 'text-emerald-400' : 'text-slate-500'
            }`}
            style={activeTab === 'feed' ? { background: 'var(--bio-accent-muted)', color: 'var(--bio-accent)' } : {}}
          >
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Feed</span>
          </button>

          <div className="w-20" /> {/* Voice Spacer */}

          <button 
            onClick={() => setActiveTab('entities')}
            className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'entities' ? 'text-emerald-400' : 'text-slate-500'
            }`}
            style={activeTab === 'entities' ? { background: 'var(--bio-accent-muted)', color: 'var(--bio-accent)' } : {}}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Collection</span>
          </button>
        </div>
      </nav>

      {/* Rapid Voice Reflection Overlay */}
      {liveTranscript && (
        <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 z-[60] flex items-center justify-center pointer-events-none px-12">
          <div className="bg-emerald-500/10 backdrop-blur-3xl border border-emerald-500/20 px-8 py-6 rounded-3xl shadow-[0_0_100px_rgba(16,185,129,0.1)] animate-pulse max-w-lg text-center">
            <p className="text-2xl font-serif text-emerald-100/90 leading-relaxed italic">
              "{liveTranscript}"
            </p>
            <div className="mt-4 flex justify-center gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Voice CTA */}
      <div className="pointer-events-none fixed inset-0 flex items-end justify-center z-50">
        <div className="pointer-events-auto pb-8">
          {voiceButtonComponent}
        </div>
      </div>
    </div>
  );
};
