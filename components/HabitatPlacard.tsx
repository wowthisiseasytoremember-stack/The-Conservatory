import { motion } from 'framer-motion';
import { Waves, Thermometer, Droplets, Users } from 'lucide-react';
import type { Entity } from '../types';
import { PlaceholderArt } from './PlaceholderArt';

interface HabitatPlacardProps {
  entity: Entity;
  residentCount: number;
  onClick?: () => void;
}

export const HabitatPlacard = ({ entity, residentCount, onClick }: HabitatPlacardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="cursor-pointer gradient-placard border border-border rounded-xl shadow-placard overflow-hidden transition-shadow hover:shadow-gold flex flex-col h-full"
    >
      {/* Gold top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600 opacity-50" />

      {/* Hero Image / Placeholder */}
      <div className="relative h-40 overflow-hidden">
        {entity.currentEchoUrl ? (
          <img src={entity.currentEchoUrl} className="w-full h-full object-cover grayscale-[0.2] opacity-80" alt={entity.name} />
        ) : (
          <PlaceholderArt name={entity.name} type="Ecosystem Habitat" className="h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        <div className="absolute bottom-3 left-4">
          <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 text-[8px] uppercase font-bold tracking-widest px-2">
            Enclosure
          </Badge>
        </div>
      </div>

      <div className="p-5 flex-1 space-y-4">
        <h3 className="font-display text-xl font-bold italic text-foreground leading-tight">
          {entity.name}
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-cyan-500" />
            {residentCount} Residents
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
            <Waves className="w-3.5 h-3.5 text-cyan-500" />
            Stable
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function Badge({ children, className }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 border ${className}`}>
      {children}
    </span>
  )
}
