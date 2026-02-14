
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
import { DeepResearchLoader } from './components/DeepResearchLoader';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { LoginView } from './components/LoginView';
import { MainLayout, BiomeTheme } from './components/MainLayout';
import { Entity, RackContainer, IdentifyResult } from './types';
import { ConnectionStatus } from './services/connectionService';

const App: React.FC = () => {
  const { 
    events, entities, groups, pendingAction, user, liveTranscript,
    activeHabitatId, researchProgress,
    processVoiceInput, commitPendingAction, discardPending, 
    updateSlot, updateEntity, addGroup, testConnection, login, logout,
    createActionFromVision, setActiveHabitat, deepResearchAll, resetResearchProgress
  } = useConservatory();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'entities'>('feed');
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');

  useEffect(() => {
    // @ts-ignore
    window.processVoiceInput = processVoiceInput;
    
    const checkDb = async () => {
      const result = await testConnection();
      setConnectionStatus(result.code || 'unknown');
    };
    checkDb();
    const interval = setInterval(checkDb, 30000);
    return () => clearInterval(interval);
  }, [testConnection, user, processVoiceInput]);

  const handlePhotoConfirm = (result: IdentifyResult) => {
    createActionFromVision(result);
  };

  const handleRackConfirm = (containers: RackContainer[]) => {
    containers.forEach(c => {
      processVoiceInput(`Create a new habitat: ${c.size_estimate} tank located at ${c.shelf_level} shelf, ${c.horizontal_position}. It has ${c.primary_species.map(s => s.common_name).join(', ')}.`);
    });
  };

  if (!user) {
    return <LoginView onLogin={login} />;
  }

  // Determine the biome theme based on the active habitat's traits
  const activeHabitat = entities.find(e => e.id === activeHabitatId);
  let biomeTheme: BiomeTheme = 'default';
  
  if (activeHabitat) {
    const traits = activeHabitat.traits || [];
    if (traits.some(t => t.parameters?.salinity === 'marine')) biomeTheme = 'marine';
    else if (traits.some(t => t.type === 'TERRESTRIAL' && (t.parameters?.humidity || 0) > 70)) biomeTheme = 'paludarium';
    else if (traits.some(t => t.parameters?.salinity === 'brackish')) biomeTheme = 'tanganyika'; // Using tanganyika as proxy for clear/rocky/brackish
    else if (traits.some(t => t.parameters?.pH && t.parameters.pH < 6.5)) biomeTheme = 'blackwater';
  }

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      connectionStatus={connectionStatus}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onLogout={logout}
      biomeTheme={biomeTheme}
      liveTranscript={liveTranscript}
      photoIdentifyComponent={
        <PhotoIdentify onConfirm={handlePhotoConfirm} />
      }
      voiceButtonComponent={
        <VoiceButton 
           onActive={() => {}} 
           onResult={processVoiceInput} 
        />
      }
    >
      <DevTools />

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
          activeHabitatId={activeHabitatId}
          onSetActiveHabitat={setActiveHabitat}
          onEditEntity={setEditingEntity} 
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
      {/* Deep Research Loader Overlay */}
      {(researchProgress.isActive || (researchProgress.completedEntities > 0 && researchProgress.discoveries.length > 0)) && (
        <DeepResearchLoader
          progress={researchProgress}
          onDismiss={resetResearchProgress}
        />
      )}
    </MainLayout>
  );
};

export default App;
