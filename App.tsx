
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
import { LoginView } from './components/LoginView';
import { MainLayout } from './components/MainLayout';
import { IdentifyResult, Entity, RackContainer } from './types';
import { ConnectionStatus } from './services/connectionService';

const App: React.FC = () => {
  const { 
    events, entities, groups, pendingAction, user,
    processVoiceInput, commitPendingAction, discardPending, 
    updateSlot, updateEntity, addGroup, testConnection, login, logout
  } = useConservatory();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'entities'>('feed');
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');

    // @ts-ignore
    window.processVoiceInput = processVoiceInput;
    
    const checkDb = async () => {
      const result = await testConnection();
      setConnectionStatus(result.code || 'unknown');
    };
    checkDb();
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

  if (!user) {
    return <LoginView onLogin={login} />;
  }

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      connectionStatus={connectionStatus}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onLogout={logout}
      photoIdentifyComponent={
        <PhotoIdentify onConfirmObservation={handlePhotoConfirm} onConfirmRack={handleRackConfirm} />
      }
      voiceButtonComponent={
        <VoiceButton onTranscription={(text) => processVoiceInput(text)} />
      }
    >
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

      {/* Content */}
      {activeTab === 'feed' ? (
        <EventFeed events={events} />
      ) : (
        <EntityList 
          entities={entities} 
          groups={groups}
          onSelectEntity={(e) => setEditingEntity(e)} 
        />
      )}

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
    </MainLayout>
  );
};

export default App;
