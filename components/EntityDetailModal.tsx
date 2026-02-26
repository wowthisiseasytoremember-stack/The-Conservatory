
import React, { useState, useEffect } from 'react';
import { Entity, EntityGroup, EntityType } from '../types';
import { 
  X, Tag, Plus, Trash2, FolderOpen, Globe2, CheckCircle2, 
  AlertTriangle, Loader2, TrendingUp, Sparkles, Info, 
  Leaf, Sun, Droplets, Thermometer, FlaskConical, Lightbulb, 
  ChevronRight, Scissors, Globe
} from 'lucide-react';
import { GrowthChart } from './GrowthChart';
import { Z_INDEX, ECOSYSTEM_THRESHOLDS } from '../src/constants';
import { artifactGeneratorService } from '../services/ArtifactGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareCuratorsCardModal } from './ShareCuratorsCardModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

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
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    gold: "bg-gold/10 border-gold/30 text-gold",
  };

  return (
    <div className={`rounded-xl p-3 border ${colorClasses[accentColor] || colorClasses.emerald} space-y-1`}>
      <div className="flex items-center gap-1.5 opacity-70">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-1 border-b border-slate-800/30 last:border-0">
      <span className="text-slate-500 shrink-0 w-24 text-[10px] uppercase tracking-wider pt-0.5">{label}</span>
      <span className="text-slate-300 text-sm">{value}</span>
    </div>
  );
}

export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({ 
  entity, groups, onClose, onUpdate, onAddGroup 
}) => {
  const [activeTab, setActiveTab] = useState<'vitality' | 'research' | 'management'>('vitality');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [cardImageUrlToShare, setCardImageUrlToShare] = useState('');
  
  // GBIF State
  const [gbifData, setGbifData] = useState<any | null>(null);
  const [loadingGbif, setLoadingGbif] = useState(false);

  // Observation logging state
  const [activeMetric, setActiveMetric] = useState<string | null>(null);

  const handleCreateCard = async () => {
    try {
      const imageUrl = await artifactGeneratorService.generateCard(entity);
      setCardImageUrlToShare(imageUrl);
      setIsShareModalOpen(true);
    } catch (error) {
      console.error(error);
      import('./Toast').then(({ toastManager }) => {
        toastManager.error("Failed to generate Curator's Card.");
      });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchGbif = async () => {
      setLoadingGbif(true);
      try {
        const query = entity.scientificName || entity.name;
        const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const data = await res.json();
        if (data.matchType !== 'NONE') {
          setGbifData(data);
          if (!entity.scientificName && data.scientificName) {
            onUpdate({ scientificName: data.scientificName });
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.error("GBIF Error", e);
      } finally {
        setLoadingGbif(false);
      }
    };

    if (entity.type === 'ORGANISM' || entity.type === 'PLANT') {
      fetchGbif();
    }
    return () => controller.abort();
  }, [entity.id]);

  const observations = entity.observations || [];
  const metrics = Array.from(new Set(observations.map(o => o.label)));
  
  useEffect(() => {
    if (!activeMetric && metrics.length > 0) setActiveMetric(metrics[0]);
    else if (!activeMetric && !metrics.length) setActiveMetric('growth');
  }, [metrics, activeMetric]);

  const chartData = observations
    .filter(o => o.label === activeMetric)
    .map(o => ({
      timestamp: o.timestamp,
      value: o.value,
      label: o.label,
      unit: o.unit,
    }));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-200 max-h-[90vh] overflow-y-auto no-scrollbar p-0 overflow-hidden shadow-2xl">
        {/* Gold top accent */}
        <div className="h-1.5 w-full bg-linear-to-r from-gold-muted via-gold to-gold-muted z-20" />

        <div className="gradient-placard">
          <DialogHeader className="p-6 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-3xl font-serif font-bold text-white mb-1 italic">
                  {entity.name}
                </DialogTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                    {entity.type as any}
                  </Badge>
                  {entity.scientificName && (
                    <span className="text-xs text-slate-500 italic font-body">
                      {entity.scientificName}
                    </span>
                  )}
                  {entity.quantity && entity.quantity > 1 && (
                    <span className="text-[10px] bg-slate-800/50 px-2 py-0.5 rounded-full text-slate-400">
                      x{entity.quantity}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {entity.delightfulSummary && (
              <p className="text-sm text-slate-400 mt-4 leading-relaxed font-body">
                {entity.delightfulSummary}
              </p>
            )}
          </DialogHeader>

          {/* Navigation Tabs (Organism Atlas Style) */}
          <div className="px-6 flex gap-1 border-b border-slate-800/50">
            {(['vitality', 'research', 'management'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === tab ? 'text-gold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'vitality' && (
                <motion.div 
                  key="vitality"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Visual Echo / Card Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {entity.currentEchoUrl && (
                      <Card className="bg-black/40 border-slate-800/50 overflow-hidden flex flex-col items-center justify-center p-4">
                        <motion.img
                          src={entity.currentEchoUrl}
                          className="w-24 h-24 object-contain filter drop-shadow-2xl opacity-90"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        />
                        <Button 
                          onClick={handleCreateCard}
                          variant="ghost" 
                          size="sm"
                          className="mt-3 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                        >
                          <Sparkles className="w-3 h-3 mr-2" />
                          Curator's Card
                        </Button>
                      </Card>
                    )}
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {entity.traits.slice(0, 4).map((t, i) => {
                          const p: any = t.parameters || {};
                          if (t.type === 'AQUATIC') return <StatCard key={i} icon={<Droplets className="w-3 h-3"/>} label="pH" value={String(p.pH || 'N/A')} accentColor="blue" />;
                          if (t.type === 'PHOTOSYNTHETIC') return <StatCard key={i} icon={<Sun className="w-3 h-3"/>} label="Light" value={p.lightReq || 'med'} accentColor="amber" />;
                          return null;
                        }).filter(Boolean)}
                        {/* Fallback stats if traits are sparse */}
                        {!entity.traits.length && (
                          <>
                            <StatCard icon={<TrendingUp className="w-3 h-3"/>} label="Health" value="Stable" accentColor="emerald" />
                            <StatCard icon={<CheckCircle2 className="w-3 h-3"/>} label="Status" value="Verified" accentColor="gold" />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Growth History (Conservatory Signature) */}
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Biological Vitality</h3>
                      <div className="flex gap-1">
                        {metrics.map(m => (
                          <button
                            key={m}
                            onClick={() => setActiveMetric(m)}
                            className={`text-[8px] px-2 py-0.5 rounded-full border transition-all ${
                              activeMetric === m 
                                ? 'bg-gold/20 border-gold/50 text-gold' 
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Card className="bg-slate-900/50 border-slate-800/50 p-4">
                      <GrowthChart 
                        data={chartData} 
                        title="" 
                        accentColor={activeMetric === 'temp' ? '#f59e0b' : '#10b981'}
                      />
                    </Card>
                  </section>
                </motion.div>
              )}

              {activeTab === 'research' && (
                <motion.div 
                  key="research"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Taxonomy Ribbon (Organism Atlas Style) */}
                  {gbifData && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-gold" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gold">Taxonomy (GBIF)</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <DetailRow label="Kingdom" value={gbifData.kingdom} />
                        <DetailRow label="Family" value={gbifData.family} />
                        <DetailRow label="Order" value={gbifData.order} />
                        <DetailRow label="Class" value={gbifData.class} />
                      </div>
                    </div>
                  )}

                  {/* Enrichment Data */}
                  {entity.enrichedData ? (
                    <div className="space-y-4">
                      {entity.enrichedData.source === 'GENUS_FALLBACK' && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-200/70">
                            Precise match not found. Data inferred from the <span className="font-bold text-amber-400">{entity.enrichedData.inferredFrom}</span> genus.
                          </p>
                        </div>
                      )}

                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-2">
                          <Info className="w-3 h-3" /> Curator's Notes
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed italic">
                          {entity.enrichedData.description || "No detailed description synthesized yet."}
                        </p>
                      </div>

                      {entity.enrichedData.careGuide && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
                            <Leaf className="w-3 h-3" /> Care Protocol
                          </h4>
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {entity.enrichedData.careGuide}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-4 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                      <div className="flex justify-center"><Loader2 className="w-8 h-8 text-slate-700 animate-spin" /></div>
                      <p className="text-xs text-slate-500 font-body">Synthetic enrichment pipeline standing by...</p>
                    </div>
                  )}

                  {/* Fun Facts section from Organism Atlas */}
                  {entity.overflow?.discovery?.mechanism && (
                    <section className="bg-gold/5 border border-gold/20 rounded-xl p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gold mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" /> Biological Mechanism
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {entity.overflow.discovery.mechanism}
                      </p>
                    </section>
                  )}
                </motion.div>
              )}

              {activeTab === 'management' && (
                <motion.div 
                  key="management"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-slate-500" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Custom Aliases</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entity.aliases.map(a => (
                          <span key={a} className="bg-slate-900 text-slate-300 px-2 py-1 rounded-md text-[10px] flex items-center gap-1 border border-slate-800">
                            {a}
                            <button onClick={() => onUpdate({ aliases: entity.aliases.filter(alias => alias !== a) })} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                        {entity.aliases.length === 0 && <p className="text-xs text-slate-600 italic">No aliases defined.</p>}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-cyan-500/70" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ecosystem Assignment</h3>
                      </div>
                      <select 
                        value={entity.group_id || ''} 
                        onChange={(e) => onUpdate({ group_id: e.target.value || undefined })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-gold/50"
                      >
                        <option value="">Ungrouped</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </section>
                  </div>

                  <Separator className="bg-slate-800/50" />

                  <div className="flex justify-between items-center pt-4">
                    <div className="text-[10px] text-slate-600 font-mono">
                      UID: {entity.id.substring(0, 8)}...
                    </div>
                    <Button variant="ghost" className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 text-[10px] uppercase font-bold tracking-widest">
                      <Trash2 className="w-3 h-3 mr-2" /> De-Accession
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
