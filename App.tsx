
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
import { Leaf, LayoutGrid, Activity, Settings, AlertCircle } from 'lucide-react';
import { IdentifyResult, Entity, RackContainer } from './types';

const App: React.FC = () => {
  const { 
    events, entities, groups, pendingAction, 
    processVoiceInput, commitPendingAction, discardPending, 
    updateSlot, updateEntity, addGroup, testConnection 
  } = useConservatory();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'entities'>('feed');
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  
  // Settings / Config State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  // Check connection on mount to prompt setup if needed
  useEffect(() => {
    const checkDb = async () => {
      const result = await testConnection();
      if (result.success) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    };
    checkDb();
  }, [testConnection]);

  const handlePhotoConfirm = (result: IdentifyResult) => {
    // Feed the vision result back into the voice parser for consistency
    processVoiceInput(`I observed a ${result.common_name} (${result.species}). Reasoning: ${result.reasoning}`);
  };

  const handleRackConfirm = (containers: RackContainer[]) => {
    // Convert rack scan into a batch of natural language commands
    containers.forEach(c => {
      processVoiceInput(`Create a new habitat: ${c.size_estimate} tank located at ${c.shelf_level} shelf, ${c.horizontal_position}. It has ${c.primary_species.map(s => s.common_name).join(', ')}.`);
    });
  };

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
          </div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">
            {activeTab === 'feed' ? 'Activity' : 'Collection'}
          </h1>
        </div>
        <div className="flex gap-2">
          <PhotoIdentify onConfirmObservation={handlePhotoConfirm} onConfirmRack={handleRackConfirm} />
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-3 rounded-full border transition-all ${
              connectionStatus === 'error' 
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            {connectionStatus === 'error' ? <AlertCircle className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
          </button>
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

          <div className="w-20" /> {/* Spacer for Voice Button */}

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
