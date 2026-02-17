
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { MainLayout } from './components/MainLayout';
import { ToastContainer, toastManager } from './components/Toast';
import { HomeScreen } from './components/screens/HomeScreen';
import { HabitatDiorama } from './components/screens/HabitatDiorama';
import { SpeciesPlacard } from './components/screens/SpeciesPlacard';
import { ParameterDetail } from './components/screens/ParameterDetail';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { Entity, RackContainer, IdentifyResult, BiomeTheme } from './types';
import { ConnectionStatus } from './services/connectionService';

const App: React.FC = () => {
  const location = useLocation();
  const { 
    events, entities, groups, pendingAction, user, liveTranscript,
    activeHabitatId, researchProgress, activeBiomeTheme,
    processVoiceInput, commitPendingAction, discardPending, 
    updateSlot, updateEntity, addGroup, testConnection, login, logout,
    createActionFromVision, setActiveHabitat, deepResearchAll, resetResearchProgress,
    clearDatabase
  } = useConservatory();
  
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'loading'; duration?: number }>>([]);

  useEffect(() => {
    // @ts-ignore
    window.processVoiceInput = processVoiceInput;
    // @ts-ignore
    window.__openEntityDetail = (entityId: string) => {
      const entity = entities.find(e => e.id === entityId);
      if (entity) setEditingEntity(entity);
    };
    
    const checkDb = async () => {
      const result = await testConnection();
      setConnectionStatus(result.code || 'unknown');
    };
    checkDb();
    const interval = setInterval(checkDb, 30000);
    return () => clearInterval(interval);
  }, [testConnection, user, processVoiceInput, entities]);

  // Subscribe to toast manager
  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const handlePhotoConfirm = (result: IdentifyResult) => {
    createActionFromVision(result);
  };

  const handleRackConfirm = (containers: RackContainer[]) => {
    containers.forEach(c => {
      processVoiceInput(`Create a new habitat: ${c.size_estimate} tank located at ${c.shelf_level} shelf, ${c.horizontal_position}. It has ${c.primary_species.map(s => s.common_name).join(', ')}.`);
    });
  };

  // Subscription to toast manager moved up or handled by store

  // Get route title for header
  const getRouteTitle = () => {
    if (location.pathname === '/home') return 'Home';
    if (location.pathname.startsWith('/habitat/')) return 'Habitat';
    if (location.pathname.startsWith('/species/')) return 'Species';
    if (location.pathname.startsWith('/parameter/')) return 'Parameter';
    if (location.pathname === '/settings') return 'Settings';
    return 'The Conservatory';
  };

  if (!user) {
    return <LoginView onLogin={login} />;
  }

  return (
    <MainLayout
      connectionStatus={connectionStatus}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onLogout={logout}
      biomeTheme={activeBiomeTheme}
      liveTranscript={liveTranscript}
      routeTitle={getRouteTitle()}
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

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/habitat/:id" element={<HabitatDiorama />} />
        <Route path="/species/:id" element={<SpeciesPlacard />} />
        <Route path="/parameter/:habitatId/:metric" element={<ParameterDetail />} />
        <Route path="/settings" element={<SettingsScreen />} />
        {/* Legacy routes for backward compatibility */}
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
            groups={groups}
            activeHabitatId={activeHabitatId}
            onSetActiveHabitat={setActiveHabitat}
            onEditEntity={setEditingEntity} 
          />
        } />
      </Routes>

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

      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={(id) => toastManager.dismiss(id)} 
      />
    </MainLayout>
  );
};

export default App;
