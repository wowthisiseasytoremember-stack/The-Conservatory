
import React from 'react';
import { Leaf, Activity, LayoutGrid, Settings, AlertCircle, LogOut } from 'lucide-react';
import { ConnectionStatus } from '../services/connectionService';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: 'feed' | 'entities';
  setActiveTab: (tab: 'feed' | 'entities') => void;
  connectionStatus: ConnectionStatus;
  onOpenSettings: () => void;
  onLogout: () => void;
  photoIdentifyComponent: React.ReactNode;
  voiceButtonComponent: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children, activeTab, setActiveTab, connectionStatus,
  onOpenSettings, onLogout, photoIdentifyComponent, voiceButtonComponent
}) => {
  return (
    <div className="min-h-screen bg-[#0c120c] flex flex-col max-w-2xl mx-auto border-x border-slate-900 shadow-2xl relative">
      {/* Header */}
      <header className="p-6 pt-10 flex justify-between items-end bg-gradient-to-b from-[#111811] to-transparent shrink-0">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
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
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">
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
              activeTab === 'feed' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Feed</span>
          </button>

          <div className="w-20" /> {/* Voice Spacer */}

          <button 
            onClick={() => setActiveTab('entities')}
            className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'entities' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Collection</span>
          </button>
        </div>
      </nav>

      {/* Primary Voice CTA */}
      <div className="pointer-events-none fixed inset-0 flex items-end justify-center z-50">
        <div className="pointer-events-auto pb-8">
          {voiceButtonComponent}
        </div>
      </div>
    </div>
  );
};
