import { useState } from 'react';
import type { Entity } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Droplets, Thermometer, Sun, Scissors, TrendingUp, Globe, FlaskConical, Lightbulb, ChevronRight, Sparkles, Info } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface EntityDetailModalProps {
  entity: Entity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EntityDetailModal = ({ entity, open, onOpenChange }: EntityDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'care' | 'taxonomy' | 'trade'>('care');

  if (!entity?.enrichedData) return null;
  const data = entity.enrichedData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto gradient-placard border-border p-0 shadow-2xl">
        {/* Gold accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-gold-muted via-gold to-gold-muted" />

        <div className="px-6 pt-5 pb-2">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl md:text-4xl font-bold italic text-foreground leading-tight">
              {entity.scientificName || entity.name}
            </DialogTitle>
            {data.taxonomy.commonNames.length > 0 && (
              <p className="text-muted-foreground font-body text-sm mt-1">
                {data.taxonomy.commonNames.join(' · ')}
              </p>
            )}
          </DialogHeader>

          {/* Description */}
          <p className="mt-4 text-foreground/80 font-body leading-relaxed text-[0.95rem]">
            {data.description}
          </p>

          {/* Source badge */}
          {data.source === 'GENUS_FALLBACK' && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md bg-accent/10 border border-accent/20">
              <Info className="w-4 h-4 text-accent shrink-0" />
              <span className="text-xs text-accent font-body">
                Data inferred from genus-level knowledge. Species-specific details may vary.
              </span>
            </div>
          )}
          {data.source === 'AI_INFERRED' && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md bg-muted border border-border">
              <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground font-body">
                AI-inferred data — no authoritative sources were available. Confidence: {Math.round(data.confidence * 100)}%
              </span>
            </div>
          )}

          {/* Confidence bar */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-body">Confidence</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.confidence * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, hsl(var(--botanical)), hsl(var(--gold)))` }}
              />
            </div>
            <span className="text-xs font-semibold text-gold font-body">{Math.round(data.confidence * 100)}%</span>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Tab Navigation */}
        <div className="px-6 flex gap-1">
          {(['care', 'taxonomy', 'trade'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-md text-sm font-body font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-card text-foreground border border-b-0 border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'care' ? '🌿 Care Guide' : tab === 'taxonomy' ? '🔬 Taxonomy' : '📊 Trade Info'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6">
          <div className="bg-card border border-border rounded-b-lg rounded-tr-lg p-5">
            <AnimatePresence mode="wait">
              {activeTab === 'care' && <CareGuideSection key="care" data={data} />}
              {activeTab === 'taxonomy' && <TaxonomySection key="taxonomy" data={data} />}
              {activeTab === 'trade' && <TradeInfoSection key="trade" data={data} />}
            </AnimatePresence>
          </div>
        </div>

        {/* Fun Facts */}
        {data.funFacts.length > 0 && (
          <div className="px-6 pb-6">
            <h4 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-gold" />
              Did You Know?
            </h4>
            <ul className="space-y-2">
              {data.funFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-body text-foreground/80">
                  <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-gold shrink-0" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sources */}
        <div className="px-6 pb-5 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground font-body">
            Sources: {data.sourcesUsed.join(', ')} · Enriched {new Date(data.enrichedAt).toLocaleDateString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ────────────────── Care Guide ────────────────── */

function CareGuideSection({ data }: { data: Entity['enrichedData'] }) {
  if (!data) return null;
  const care = data.careGuide;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Leaf className="w-4 h-4" />} label="Difficulty" value={care.difficulty} />
        <StatCard icon={<Sun className="w-4 h-4" />} label="Light" value={care.lightRequirement} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Growth" value={care.growthRate} />
        <StatCard icon={<FlaskConical className="w-4 h-4" />} label="CO₂" value={care.co2Required ? 'Required' : 'Not required'} />
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ParamCard icon={<Thermometer className="w-4 h-4" />} label="Temperature" value={`${care.temperature.min}–${care.temperature.max}${care.temperature.unit}`} ideal={care.temperature.ideal ? `${care.temperature.ideal}${care.temperature.unit}` : undefined} />
        <ParamCard icon={<Droplets className="w-4 h-4" />} label="pH" value={`${care.pH.min}–${care.pH.max}`} ideal={care.pH.ideal ? `${care.pH.ideal}` : undefined} />
        {care.maxHeight && (
          <ParamCard icon={<TrendingUp className="w-4 h-4" />} label="Max Height" value={`${care.maxHeight.min}–${care.maxHeight.max} ${care.maxHeight.unit}`} />
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm font-body">
        <DetailRow label="Substrate" value={care.substrate} />
        <DetailRow label="Placement" value={care.placement} />
        <DetailRow label="Trimming" value={care.trimming} />
        <DetailRow label="Propagation" value={care.propagation.join(', ')} />
      </div>

      {/* Tips */}
      {care.tips.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider font-body">Pro Tips</p>
          <ul className="space-y-1.5">
            {care.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-body text-foreground/80">
                <Scissors className="w-3 h-3 mt-1 text-botanical shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

/* ────────────────── Taxonomy ────────────────── */

function TaxonomySection({ data }: { data: Entity['enrichedData'] }) {
  if (!data) return null;
  const tax = data.taxonomy;

  const ranks = [
    { label: 'Kingdom', value: tax.kingdom },
    { label: 'Phylum', value: tax.phylum },
    { label: 'Class', value: tax.class },
    { label: 'Order', value: tax.order },
    { label: 'Family', value: tax.family },
    { label: 'Genus', value: tax.genus },
    { label: 'Species', value: tax.species },
    ...(tax.subspecies ? [{ label: 'Subspecies', value: tax.subspecies }] : []),
    ...(tax.cultivar ? [{ label: 'Cultivar', value: tax.cultivar }] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* Taxonomy tree */}
      <div className="space-y-0">
        {ranks.map((rank, i) => (
          <div key={rank.label} className="flex items-center gap-2 py-1.5" style={{ paddingLeft: `${i * 12}px` }}>
            <div className="w-2 h-2 rounded-full border border-botanical bg-botanical/20 shrink-0" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-body w-20 shrink-0">{rank.label}</span>
            <span className={`text-sm font-body ${i >= 5 ? 'italic font-semibold text-foreground' : 'text-foreground/80'}`}>
              {rank.value}
            </span>
          </div>
        ))}
      </div>

      {/* Synonyms */}
      {tax.synonyms.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider font-body">Synonyms</p>
          <div className="flex flex-wrap gap-1.5">
            {tax.synonyms.map((s, i) => (
              <Badge key={i} variant="secondary" className="font-body text-xs italic">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Ecological role */}
      {data.ecologicalRole && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider font-body">Ecological Role</p>
          <p className="text-sm font-body text-foreground/80">{data.ecologicalRole}</p>
        </div>
      )}
    </motion.div>
  );
}

/* ────────────────── Trade Info ────────────────── */

function TradeInfoSection({ data }: { data: Entity['enrichedData'] }) {
  if (!data) return null;
  const trade = data.tradeInfo;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Globe className="w-4 h-4" />} label="Availability" value={trade.availability.replace('_', ' ')} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Popularity" value={trade.popularityTrend || 'unknown'} />
      </div>

      <div className="space-y-2 text-sm font-body">
        <DetailRow label="Origin" value={trade.originRegion} />
        <DetailRow label="Habitat" value={trade.naturalHabitat} />
        {trade.priceRange && <DetailRow label="Price Range" value={trade.priceRange} />}
        {trade.firstIntroducedYear && <DetailRow label="Introduced" value={String(trade.firstIntroducedYear)} />}
      </div>

      {trade.tradeNames.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider font-body">Trade Names</p>
          <div className="flex flex-wrap gap-1.5">
            {trade.tradeNames.map((name, i) => (
              <Badge key={i} variant="outline" className="font-body text-xs">{name}</Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ────────────────── Shared mini-components ────────────────── */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-md px-3 py-2.5 space-y-1 border border-border/50 shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-[10px] font-bold font-body uppercase tracking-wider">{label}</span></div>
      <p className="text-sm font-semibold font-body text-foreground capitalize">{value}</p>
    </div>
  );
}

function ParamCard({ icon, label, value, ideal }: { icon: React.ReactNode; label: string; value: string; ideal?: string }) {
  return (
    <div className="bg-muted/50 rounded-md px-3 py-2.5 space-y-1 border border-border/50 shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-[10px] font-bold font-body uppercase tracking-wider">{label}</span></div>
      <p className="text-sm font-semibold font-body text-foreground">{value}</p>
      {ideal && <p className="text-[10px] text-gold/80 font-bold uppercase tracking-tighter">Ideal: {ideal}</p>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 border-b border-border/30 pb-1 last:border-0">
      <span className="text-muted-foreground shrink-0 w-24 text-[10px] font-bold uppercase tracking-wider pt-0.5">{label}</span>
      <span className="text-sm text-foreground/80 font-body">{value}</span>
    </div>
  );
}
