import { motion } from 'framer-motion';
import { Leaf, Loader2, AlertCircle } from 'lucide-react';
import type { Entity } from '../types';
import { SpecimenPlate } from './SpecimenPlate';

interface PlacardCardProps {
  entity: Entity;
  onClick?: () => void;
}

export const PlacardCard = ({ entity, onClick }: PlacardCardProps) => {
  const enriched = entity.enrichedData;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="cursor-pointer gradient-placard border border-border rounded-lg shadow-placard overflow-hidden transition-shadow hover:shadow-gold flex flex-col"
    >
      {/* Gold top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-gold-muted via-gold to-gold-muted" />

      {/* Field Journal Plate - The Hero of the Card */}
      <div className="p-3">
        <SpecimenPlate 
          src={entity.currentEchoUrl || "https://images.unsplash.com/photo-1516550135131-fe3dcb0bedc7?auto=format&fit=crop&q=80&w=800"} 
          scientificName={entity.scientificName || entity.name}
          catalogId={entity.id}
          className="shadow-md"
        />
      </div>

      <div className="p-4 pt-0 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-foreground truncate italic">
              {entity.scientificName || entity.name}
            </h3>
            {entity.scientificName && entity.name !== entity.scientificName && (
               <p className="text-xs text-muted-foreground font-body mt-0.5 opacity-60">
                {entity.name}
              </p>
            )}
          </div>
          <StatusBadge status={entity.enrichment_status} />
        </div>

        {enriched && (
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-body pt-1 border-t border-border/30">
            <span className="flex items-center gap-1">
              <Leaf className="w-3 h-3 text-botanical" />
              {entity.traits.find(t => t.type === 'PHOTOSYNTHETIC')?.type === 'PHOTOSYNTHETIC' ? 'Photosynthetic' : 'Specimen'}
            </span>
            <span className="truncate">{enriched.taxonomy?.family || 'Biological Specimen'}</span>
            <span className="ml-auto text-gold font-bold">
              {Math.round(entity.confidence * 100)}%
            </span>
          </div>
        )}

        {entity.enrichment_status === 'pending' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="font-body uppercase tracking-widest text-[10px]">Researching archive…</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

function StatusBadge({ status }: { status: Entity['enrichment_status'] }) {
  const config = {
    none: { label: 'Library', className: 'bg-muted text-muted-foreground' },
    queued: { label: 'Queued', className: 'bg-muted text-muted-foreground' },
    pending: { label: 'Researching', className: 'bg-botanical-subtle text-botanical' },
    complete: { label: 'Enriched', className: 'bg-primary/10 text-primary' },
    failed: { label: 'Error', className: 'bg-destructive/10 text-destructive' },
  };
  const { label, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${className}`}>
      {status === 'failed' && <AlertCircle className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}
