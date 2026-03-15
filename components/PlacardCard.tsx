import { motion } from 'framer-motion';
import { Leaf, Loader2, AlertCircle } from 'lucide-react';
import type { Entity } from '../types';

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
      className="cursor-pointer gradient-placard border border-border rounded-lg shadow-placard overflow-hidden transition-shadow hover:shadow-gold"
    >
      {/* Gold top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-gold-muted via-gold to-gold-muted" />

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-foreground truncate italic">
              {entity.scientificName || entity.name}
            </h3>
            {enriched?.taxonomy?.commonNames?.[0] && (
              <p className="text-sm text-muted-foreground font-body mt-0.5 opacity-60">
                {enriched.taxonomy.commonNames[0]}
              </p>
            )}
          </div>
          <StatusBadge status={entity.enrichment_status} />
        </div>

        {enriched && (
          <>
            <p className="text-sm text-foreground/80 font-body leading-relaxed line-clamp-2">
              {enriched.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground font-body pt-1">
              <span className="flex items-center gap-1">
                <Leaf className="w-3 h-3 text-botanical" />
                {enriched.careGuide.difficulty}
              </span>
              <span className="truncate">{enriched.taxonomy.family}</span>
              <span className="ml-auto text-gold font-bold">
                {Math.round(enriched.confidence * 100)}%
              </span>
            </div>
          </>
        )}

        {entity.enrichment_status === 'pending' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="font-body uppercase tracking-widest text-[10px]">Consulting archives…</span>
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
    pending: { label: 'Enriching', className: 'bg-botanical-subtle text-botanical' },
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
