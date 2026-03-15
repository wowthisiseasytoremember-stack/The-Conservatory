import React, { useState, useEffect } from 'react';
import { useEntities, useUpdateEntity } from './services/store/queryHooks';
import { EntityDetailModal } from './components/EntityDetailModal';
import { ConfirmationCard } from './components/ConfirmationCard';
import { LoginView } from './components/LoginView';
import { ToastContainer, toastManager } from './components/Toast';
import { Entity, EntityType } from './types';
import { HeroSection } from './components/HeroSection';
import { PlacardCard } from './components/PlacardCard';
import { HabitatPlacard } from './components/HabitatPlacard';
import { AccessionInput } from './components/AccessionInput';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Archive, Waves, LayoutGrid } from 'lucide-react';
import { auth, onAuthStateChanged, signOut } from './services/firebase';
import { useConservatoryStore } from './services/store/useConservatoryStore';

const App: React.FC = () => {
  const { data: entities = [] } = useEntities();
  const updateEntityMutation = useUpdateEntity();
  const { pendingAction, commitAction, setPendingAction } = useConservatoryStore();
  
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [toasts, setToasts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'specimens' | 'enclosures'>('specimens');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  if (authChecking) return <div className="min-h-screen bg-background flex items-center justify-center paper-texture" />;

  if (!user) {
    return <LoginView onLogin={() => {
      import('./services/firebase').then(({ signInWithGoogle }) => signInWithGoogle());
    }} />;
  }

  // Filter Logic
  const habitats = entities.filter(e => e.type === EntityType.HABITAT);
  const specimens = entities.filter(e => e.type !== EntityType.HABITAT);

  return (
    <div className="min-h-screen bg-background paper-texture pb-32">
      <HeroSection />

      <main className="max-w-6xl mx-auto px-6 space-y-16">
        
        {/* Unified Search & Tab Navigation */}
        <section className="space-y-10">
          <AccessionInput />
          
          <div className="flex justify-center">
            <div className="inline-flex bg-muted/50 p-1.5 rounded-2xl border border-border/50 shadow-inner">
              <TabButton 
                active={activeTab === 'specimens'} 
                onClick={() => setActiveTab('specimens')}
                icon={<Archive className="w-4 h-4" />}
                label="Specimen Archive"
                count={specimens.length}
              />
              <TabButton 
                active={activeTab === 'enclosures'} 
                onClick={() => setActiveTab('enclosures')}
                icon={<Waves className="w-4 h-4" />}
                label="Enclosure Gallery"
                count={habitats.length}
              />
            </div>
          </div>

          <AnimatePresence>
            {pendingAction && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ConfirmationCard 
                  action={pendingAction} 
                  onCommit={() => commitAction(pendingAction, entities)}
                  onDiscard={() => setPendingAction(null)}
                  onUpdate={() => {}}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Dynamic Content Grid */}
        <AnimatePresence mode="wait">
          {activeTab === 'specimens' ? (
            <motion.section 
              key="specimens"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <SectionHeader title="The Collection" subtitle="Catalogued Biological Artifacts" />
              {specimens.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {specimens.map(entity => (
                    <PlacardCard key={entity.id} entity={entity} onClick={() => setSelectedEntity(entity)} />
                  ))}
                </div>
              ) : (
                <EmptyState message="No specimens archived yet. Use the curate bar to begin." />
              )}
            </motion.section>
          ) : (
            <motion.section 
              key="enclosures"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <SectionHeader title="The Enclosures" subtitle="Digital Twins of Living Ecosystems" />
              {habitats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {habitats.map(habitat => (
                    <HabitatPlacard 
                      key={habitat.id} 
                      entity={habitat} 
                      residentCount={entities.filter(e => e.group_id === habitat.id).length}
                      onClick={() => setSelectedEntity(habitat)} 
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No enclosures established. Say 'Create a new tank' to start." />
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <EntityDetailModal
        entity={selectedEntity}
        open={!!selectedEntity}
        onOpenChange={(open) => { if (!open) setSelectedEntity(null); }}
      />

      <footer className="mt-24 border-t border-border/50 py-16 text-center bg-muted/10">
        <div className="flex flex-col items-center gap-6">
          <p className="font-display text-lg italic text-muted-foreground">The Digital Conservatory</p>
          <div className="flex items-center gap-8">
            <button 
              onClick={() => signOut(auth)} 
              className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out of Archives
            </button>
          </div>
        </div>
      </footer>

      <ToastContainer toasts={toasts} onDismiss={(id) => toastManager.dismiss(id)} />
    </div>
  );
};

/* ────────────────── UI Helper Components ────────────────── */

function TabButton({ active, onClick, icon, label, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-body text-sm font-semibold ${
        active 
          ? 'bg-background text-foreground shadow-sm' 
          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${active ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border'}`}>
        {count}
      </span>
    </button>
  );
}

function SectionHeader({ title, subtitle }: any) {
  return (
    <div className="flex flex-col gap-1 items-center md:items-start">
      <h2 className="font-display text-4xl font-bold italic text-foreground tracking-tight">{title}</h2>
      <div className="flex items-center gap-3 w-full">
        <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-gold shrink-0">{subtitle}</p>
        <div className="h-px bg-border flex-1 opacity-50" />
      </div>
    </div>
  );
}

function EmptyState({ message }: any) {
  return (
    <div className="py-32 text-center bg-card/20 rounded-[2rem] border border-dashed border-border/50">
      <p className="text-muted-foreground font-body italic text-lg opacity-60">{message}</p>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${className}`}>
      {children}
    </span>
  );
}

export default App;
