import React, { useState } from 'react';
import { Entity, EntityGroup } from '../types';
import { 
  X, Tag, Trash2, FolderOpen, AlertTriangle, Loader2, 
  Sparkles, Leaf, Sun, Droplets, Lightbulb, 
  Search, BookOpen, HeartPulse
} from 'lucide-react';
import { GrowthChart } from './GrowthChart';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareCuratorsCardModal } from './ShareCuratorsCardModal';
import { Dialog, DialogContent } from './ui/dialog';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useConservatoryStore } from '../services/store/useConservatoryStore';
import { artifactGeneratorService } from '../services/ArtifactGenerator';
import { SpecimenPlate } from './SpecimenPlate';

interface EntityDetailModalProps {
  entity: Entity;
  groups: EntityGroup[];
  onClose: () => void;
  onUpdate: (updates: Partial<Entity>) => void;
  onAddGroup: (name: string) => Promise<EntityGroup>;
}

/* ────────────────── Shared mini-components (Placard Style) ────────────────── */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, accentColor = "emerald" }) => {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    gold: "bg-gold/10 border-gold/20 text-gold",
  };

  return (
    <div className={`rounded-xl p-3 border ${colorClasses[accentColor] || colorClasses.emerald} space-y-1`}>
      <div className="flex items-center gap-1.5 opacity-60">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xs font-semibold truncate">{value}</p>
    </div>
  );
}

function TaxonomyItem({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col items-center px-3 border-r border-border/50 last:border-0">
      <span className="text-[8px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</span>
      <span className="text-[10px] font-bold text-foreground/80">{value}</span>
    </div>
  );
}

export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({ 
  entity, groups, onClose, onUpdate 
}) => {
  const [activeTab, setActiveTab] = useState<'dossier' | 'vitality' | 'management'>('dossier');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [cardImageUrlToShare, setCardImageUrlToShare] = useState('');
  const enrichEntity = useConservatoryStore(s => s.enrichEntity);

  const handleCreateCard = async () => {
    try {
      const imageUrl = await artifactGeneratorService.generateCard(entity);
      setCardImageUrlToShare(imageUrl);
      setIsShareModalOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  const observations = entity.observations || [];
  const metrics = Array.from(new Set(observations.map(o => o.label)));
  const [activeMetric, setActiveMetric] = useState<string>(metrics[0] || 'growth');

  const chartData = observations
    .filter(o => o.label === activeMetric)
    .map(o => ({
      timestamp: o.timestamp,
      value: o.value,
      label: o.label,
      unit: o.unit,
    }));

  const enriched = entity.enrichedData;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background border-border text-foreground max-h-[90vh] overflow-y-auto no-scrollbar p-0 overflow-hidden shadow-2xl">
        {/* Museum Gold Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-gold-muted via-gold to-gold-muted z-20" />

        <div className="gradient-placard min-h-full">
          {/* Hero Header - Field Journal Style */}
          <div className="p-6 pb-0">
            <SpecimenPlate 
              src={entity.currentEchoUrl || "https://images.unsplash.com/photo-1516550135131-fe3dcb0bedc7?auto=format&fit=crop&q=80&w=800"} 
              scientificName={entity.scientificName || entity.name}
              catalogId={entity.id}
              className="w-full max-w-sm mx-auto transform rotate-1 shadow-2xl"
              caption={entity.delightfulSummary}
            />
          </div>

          <div className="px-6 pt-8 pb-4 text-center">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 className="text-4xl md:text-5xl font-display font-bold italic text-foreground leading-none mb-2">
                  {entity.scientificName || entity.name}
                </h1>
                <div className="flex items-center justify-center gap-3">
                  <Badge variant="outline" className="text-[10px] border-gold/30 text-gold bg-gold/5 uppercase tracking-widest px-3">
                    {entity.type}
                  </Badge>
                  {entity.scientificName && entity.name !== entity.scientificName && (
                    <span className="text-sm text-muted-foreground font-body italic opacity-60">
                      Commonly: {entity.name}
                    </span>
                  )}
                </div>
             </motion.div>
          </div>

          {/* Navigation */}
          <div className="px-6 flex gap-4 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-10">
            {(['dossier', 'vitality', 'management'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === tab ? 'text-gold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'dossier' && (
                <motion.div 
                  key="dossier" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Taxonomy Ribbon */}
                  {enriched?.taxonomy && (
                    <div className="flex justify-center bg-muted/30 py-3 rounded-xl border border-border/50 overflow-x-auto no-scrollbar">
                      <TaxonomyItem label="Kingdom" value={enriched.taxonomy.kingdom} />
                      <TaxonomyItem label="Family" value={enriched.taxonomy.family} />
                      <TaxonomyItem label="Genus" value={enriched.taxonomy.genus} />
                      <TaxonomyItem label="Species" value={enriched.taxonomy.species} />
                    </div>
                  )}

                  {/* Main Prose */}
                  <div className="space-y-6 text-center">
                    <section className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-gold">
                        <BookOpen className="w-4 h-4" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">Specimen Narrative</h3>
                      </div>
                      <p className="text-base md:text-lg text-foreground/90 font-body leading-relaxed italic max-w-lg mx-auto">
                        {enriched?.description || entity.delightfulSummary || "Synthesizing botanical history..."}
                      </p>
                    </section>

                    {enriched?.careGuide && (
                      <section className="bg-botanical/5 border border-botanical/20 rounded-2xl p-5 space-y-3 text-left">
                        <div className="flex items-center gap-2 text-botanical">
                          <Leaf className="w-4 h-4" />
                          <h3 className="text-[10px] font-bold uppercase tracking-widest">Biological Context</h3>
                        </div>
                        <p className="text-sm text-foreground/80 font-body leading-relaxed whitespace-pre-wrap">
                          {enriched.careGuide}
                        </p>
                      </section>
                    )}
                  </div>

                  {/* Discovery Secrets (Fun Facts) */}
                  {enriched?.funFacts && enriched.funFacts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {enriched.funFacts.map((fact, i) => (
                        <div key={i} className="bg-gold/5 border border-gold/10 rounded-xl p-4 flex gap-3">
                          <Lightbulb className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground leading-relaxed italic">
                            {fact}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Enrichment Trigger (If not enriched) */}
                  {entity.enrichment_status !== 'complete' && (
                    <div className="py-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border space-y-4">
                      {entity.enrichment_status === 'pending' ? (
                        <>
                          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" />
                          <p className="text-xs text-muted-foreground font-body uppercase tracking-widest">Consulting natural history archives...</p>
                        </>
                      ) : (
                        <>
                          <Search className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                          <div className="space-y-1">
                            <p className="text-sm font-display italic text-foreground/60">Dossier Incomplete</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => enrichEntity(entity.id)}
                              className="border-gold/50 text-gold hover:bg-gold/10"
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-2" />
                              Trigger Deep Research
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'vitality' && (
                <motion.div 
                   key="vitality" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                   className="space-y-8"
                >
                   {/* Vitality Stats */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {entity.traits.map((t, i) => {
                          const p: any = t.parameters || {};
                          if (t.type === 'AQUATIC') return <StatCard key={i} icon={<Droplets className="w-3 h-3"/>} label="pH" value={String(p.pH || '6.5')} accentColor="blue" />;
                          if (t.type === 'PHOTOSYNTHETIC') return <StatCard key={i} icon={<Sun className="w-3 h-3"/>} label="Light" value={p.lightReq || 'med'} accentColor="amber" />;
                          return null;
                      }).filter(Boolean)}
                      <StatCard icon={<HeartPulse className="w-3 h-3"/>} label="Metabolism" value="Stable" accentColor="emerald" />
                      <StatCard icon={<Globe className="w-4 h-4"/>} label="Origin" value={enriched?.tradeInfo?.originRegion || "Unknown"} accentColor="gold" />
                   </div>

                   {/* Growth Chart */}
                   <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-botanical" />
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stewardship History</h3>
                        </div>
                        <div className="flex gap-1">
                          {metrics.map(m => (
                            <button
                              key={m}
                              onClick={() => setActiveMetric(m)}
                              className={`text-[8px] px-2 py-0.5 rounded-full border transition-all uppercase font-bold tracking-tighter ${
                                activeMetric === m 
                                  ? 'bg-gold/20 border-gold/50 text-gold' 
                                  : 'bg-muted border-border text-muted-foreground'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Card className="bg-muted/30 border-border p-4">
                        <GrowthChart 
                          data={chartData} 
                          title="" 
                          accentColor={activeMetric === 'temp' ? '#f59e0b' : '#15803d'}
                        />
                      </Card>
                   </section>

                   <div className="flex justify-center">
                      <Button 
                        onClick={handleCreateCard}
                        variant="outline" 
                        size="sm"
                        className="text-[10px] border-gold/30 text-gold hover:bg-gold/10 uppercase tracking-[0.2em] font-bold h-10 px-8"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                        Generate Curator's Card
                      </Button>
                   </div>
                </motion.div>
              )}

              {activeTab === 'management' && (
                <motion.div 
                   key="management" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                   className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="w-4 h-4" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">Identifiers</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entity.aliases.map(a => (
                          <span key={a} className="bg-muted text-foreground/70 px-2 py-1 rounded-md text-[10px] flex items-center gap-1 border border-border">
                            {a}
                            <button onClick={() => onUpdate({ aliases: entity.aliases.filter(alias => alias !== a) })} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                        {entity.aliases.length === 0 && <p className="text-xs text-muted-foreground italic">No aliases defined.</p>}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FolderOpen className="w-4 h-4" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest">Ecosystem Location</h3>
                      </div>
                      <select 
                        value={entity.group_id || ''} 
                        onChange={(e) => onUpdate({ group_id: e.target.value || undefined })}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                      >
                        <option value="">Ungrouped</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </section>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="flex justify-between items-center opacity-50">
                    <div className="text-[8px] font-mono uppercase tracking-widest">
                      ARCHIVE_UID: {entity.id}
                    </div>
                    <Button variant="ghost" className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 text-[9px] uppercase font-bold tracking-[0.2em]">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> De-Accession Specimen
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>

      <ShareCuratorsCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={cardImageUrlToShare}
        entityName={entity.name}
      />
    </Dialog>
  );
};

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function Globe(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}
