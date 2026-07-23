import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useConservatoryStore } from './services/store/useConservatoryStore';
import { useEntities, useEvents, useUpdateEntity } from './services/store/queryHooks';
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
import { MainLayout } from './components/MainLayout';
import { ToastContainer, toastManager } from './components/Toast';
import { HomeScreen } from './components/screens/HomeScreen';
import { HabitatDiorama } from './components/screens/HabitatDiorama';
import { SpeciesPlacard } from './components/screens/SpeciesPlacard';
import { ParameterDetail } from './components/screens/ParameterDetail';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { BlueprintScreen } from './components/screens/BlueprintScreen';
import { PlaygroundScreen } from './components/screens/PlaygroundScreen';
import { Entity, RackContainer, IdentifyResult, BiomeTheme } from './types';
import { ConnectionStatus } from './services/connectionService';

const App: React.FC = () => {
  const location = useLocation();
  const { data: entities = [] } = useEntities();
  const { data: events = [] } = useEvents();
  const updateEntityMutation = useUpdateEntity();
  
  const { 
    pendingAction, liveTranscript,
    activeHabitatId, researchProgress,
    processVoiceInput, commitAction, setPendingAction, setActiveHabitatId
  } = useConservatoryStore();
  
  // Local UI State
  const [user, setUser] = useState<any>({ uid: 'dev-user' }); // Simple dev auth for now
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'loading'; duration?: number }>>([]);

  const activeBiomeTheme: BiomeTheme = 'default';

  useEffect(() => {
    // Global Error Hardening
    const handleError = (event: ErrorEvent) => {
      console.error('[App] Global Error:', event.error);
      toastManager.error(`Unexpected Error: ${event.message}`, 5000);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('[App] Unhandled Rejection:', event.reason);
      toastManager.error(`Source Error: ${event.reason?.message || 'Check connection'}`, 5000);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    // @ts-ignore
    window.processVoiceInput = (text: string) => processVoiceInput(text, entities);
    // @ts-ignore
    window.__openEntityDetail = (entityId: string) => {
      const entity = entities.find(e => e.id === entityId);
      if (entity) setEditingEntity(entity);
    };
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [entities, processVoiceInput]);

  // Subscribe to toast manager
  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const handlePhotoConfirm = (result: IdentifyResult) => {
    // Vision logic to be moved to Zustand
  };

  const getRouteTitle = () => {
    if (location.pathname === '/home') return 'Home';
    if (location.pathname.startsWith('/habitat/')) return 'Habitat';
    if (location.pathname.startsWith('/species/')) return 'Species';
    if (location.pathname === '/settings') return 'Settings';
    return 'The Conservatory';
  };

  if (!user) {
    return <LoginView onLogin={() => setUser({ uid: 'dev-user' })} />;
  }

  return (
    <MainLayout
      connectionStatus={connectionStatus}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onLogout={() => setUser(null)}
      biomeTheme={activeBiomeTheme}
      liveTranscript={liveTranscript}
      routeTitle={getRouteTitle()}
      photoIdentifyComponent={
        <PhotoIdentify onConfirm={handlePhotoConfirm} />
      }
      voiceButtonComponent={
        <VoiceButton 
           onActive={() => {}} 
           onResult={(text) => processVoiceInput(text, entities)} 
        />
      }
    >
      {/* Confirmation UI */}
      {pendingAction && (
        <ConfirmationCard 
          action={pendingAction} 
          onCommit={() => commitAction(pendingAction, entities)}
          onDiscard={() => setPendingAction(null)}
          onUpdate={(path, val) => {
            // Pending action update logic
          }}
        />
      )}

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/habitat/:id" element={<HabitatDiorama />} />
        <Route path="/species/:id" element={<SpeciesPlacard />} />
        <Route path="/parameter/:habitatId/:metric" element={<ParameterDetail />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/blueprint" element={<BlueprintScreen />} />
        <Route path="/playground" element={<PlaygroundScreen />} />
        
        <Route path="/feed" element={
          <EventFeed 
            events={events} 
            entities={entities}
            onEntityClick={setEditingEntity}
          />
        } />
        <Route path="/entities" element={
          <EntityList 
            entities={entities} 
            groups={[]}
            activeHabitatId={activeHabitatId}
            onSetActiveHabitat={setActiveHabitatId}
            onEditEntity={setEditingEntity} 
          />
        } />
      </Routes>

      {/* Detail Modal */}
      {editingEntity && (
        <EntityDetailModal 
          entity={editingEntity}
          groups={[]}
          onClose={() => setEditingEntity(null)}
          onUpdate={(updates) => {
            updateEntityMutation.mutate({ id: editingEntity.id, updates });
            setEditingEntity({ ...editingEntity, ...updates });
          }}
          onAddGroup={async (name) => ({ id: 'new', name })}
        />
      )}

      {/* Deep Research Loader Overlay */}
      {(researchProgress.isActive || (researchProgress.completedEntities > 0 && researchProgress.discoveries.length > 0)) && (
        <DeepResearchLoader
          progress={researchProgress}
          onDismiss={() => {}}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={(id) => toastManager.dismiss(id)} 
      />
    </MainLayout>
  );
};

export default App;
