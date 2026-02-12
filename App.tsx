
import React, { useState, useEffect } from 'react';
import { useConservatory } from './services/store';
import { VoiceButton } from './components/VoiceButton';
import { EventFeed } from './components/EventFeed';
import { EntityList } from './components/EntityList';
import { PhotoIdentify } from './components/PhotoIdentify';
import { EntityDetailModal } from './components/EntityDetailModal';
import { ConfirmationCard } from './components/ConfirmationCard';
import { DevTools } from './components/DevTools';
import { AIChatBot } from './components/AIChatBot';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { Leaf, LayoutGrid, Activity, Settings, AlertCircle, ExternalLink, ShieldAlert, LogOut, LogIn, Wifi, WifiOff } from 'lucide-react';
import { IdentifyResult, Entity, RackContainer } from './types';

const App: React.FC = () => {
  const { 
    events, entities, groups, pendingAction, user,
    processVoiceInput, commitPendingAction, discardPending, 
    updateSlot, updateEntity, addGroup, testConnection, login, logout
  } = useConservatory();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'entities'>('feed');
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error' | 'api_disabled' | 'offline' | 'permission_denied' | 'auth_required'>('unknown');

  useEffect(() => {
    const checkDb = async () => {
      if (!user) {
        setConnectionStatus('auth_required');
        return;
      }
      const result = await testConnection();
      if (result.success) {
        setConnectionStatus('connected');
      } else if (result.code === 'API_DISABLED') {
        setConnectionStatus('api_disabled');
      } else if (result.code === 'PERMISSION_DENIED') {
        setConnectionStatus('permission_denied');
      } else if (result.code === 'OFFLINE') {
        setConnectionStatus('offline');
      } else if (result.code === 'AUTH_REQUIRED') {
        setConnectionStatus('auth_required');
      } else {
        setConnectionStatus('error');
      }
    };
    checkDb();
    
    // Refresh connection status every 30 seconds
    const interval = setInterval(checkDb, 30000);
    return () => clearInterval(interval);
  }, [testConnection, user]);

  const handlePhotoConfirm = (result: IdentifyResult) => {
    processVoiceInput(`I observed a ${result.common_name} (${result.species}). Reasoning: ${result.reasoning}`);
  };

  const handleRackConfirm = (containers: RackContainer[]) => {
    containers.forEach(c => {
      processVoiceInput(`Create a new habitat: ${c.size_estimate} tank located at ${c.shelf_level} shelf, ${c.horizontal_position}. It has ${c.primary_species.map(s => s.common_name).join(', ')}.`);
    });
  };

  // Login Screen
  if (!user) {
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
            onClick={() => login()}
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
  }

  return (
    <div className="min-h-screen bg-[#0c120c] flex flex-col max-w-2xl mx-auto border-x border-slate-900 shadow-2xl relative">
      <DevTools />
      <AIChatBot />

      {isSettingsOpen && (
        <FirebaseConfigModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {/* Confirmation UI */}
      {pendingAction && (
        <ConfirmationCard 
          action={pendingAction} 
          onCommit={commitPendingAction}
          onDiscard={discardPending}
          onUpdate={updateSlot}
        />
      )}

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
          <PhotoIdentify onConfirmObservation={handlePhotoConfirm} onConfirmRack={handleRackConfirm} />
          <div className="flex flex-col gap-2">
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-3 rounded-full border transition-all ${
                  connectionStatus === 'error' || connectionStatus === 'api_disabled' || connectionStatus === 'permission_denied'
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
              >
                {connectionStatus === 'error' || connectionStatus === 'api_disabled' || connectionStatus === 'permission_denied' ? <AlertCircle className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
              </button>
              <button onClick={() => logout()} className="p-3 bg-slate-800/80 rounded-full border border-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar pb-32">
        {activeTab === 'feed' ? (
          <EventFeed events={events} />
        ) : (
          <EntityList 
            entities={entities} 
            groups={groups}
            onSelectEntity={(e) => setEditingEntity(e)} 
          />
        )}
      </main>

      {/* Detail Modal */}
      {editingEntity && (
        <EntityDetailModal 
          entity={editingEntity}
          groups={groups}
          onClose={() => setEditingEntity(null)}
          onUpdate={(updates) => {
            updateEntity(editingEntity.id, updates);
            setEditingEntity({ ...editingEntity, ...updates });
          }}
          onAddGroup={addGroup}
        />
      )}

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
          <VoiceButton onTranscription={(text) => processVoiceInput(text)} />
        </div>
      </div>
    </div>
  );
};

export default App;
