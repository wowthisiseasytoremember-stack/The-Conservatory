import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SpecimenPlateProps {
  src: string;
  scientificName: string;
  catalogId: string;
  className?: string;
  caption?: string;
}

/**
 * A "Field Journal" style component that treats user photos as 
 * professionally mounted botanical plates.
 */
export const SpecimenPlate: React.FC<SpecimenPlateProps> = ({ 
  src, 
  scientificName, 
  catalogId, 
  className = "",
  caption
}) => {
  // Generate a consistent "Plate Number" based on the catalogId
  const plateNumber = useMemo(() => {
    const num = catalogId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;
    const romanNumerals = ["I", "IV", "V", "IX", "X", "XL", "L", "XC", "C"];
    return romanNumerals[num % romanNumerals.length] + "-" + (num + 1);
  }, [catalogId]);

  return (
    <div className={`paper-texture p-4 shadow-xl border border-stone-200/50 rounded-sm relative overflow-hidden ${className}`}>
      {/* Subtle "Hinge Mount" photo corners effect */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-stone-300/50" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-stone-300/50" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-stone-300/50" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-stone-300/50" />

      {/* The Archival Photo */}
      <div className="aspect-[4/5] overflow-hidden bg-stone-200 shadow-inner relative group">
        <motion.img 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          src={src} 
          className="w-full h-full object-cover archival-plate-img transition-transform duration-700 group-hover:scale-110"
          alt={scientificName}
        />
        {/* Subtle vellum overlay */}
        <div className="absolute inset-0 bg-stone-900/5 pointer-events-none" />
      </div>

      {/* Hand-written notations */}
      <div className="mt-4 flex justify-between items-end font-script text-stone-600/90 select-none">
        <div className="flex flex-col">
          <span className="text-sm leading-tight italic decoration-stone-300/50 underline underline-offset-4">
            {scientificName}
          </span>
          <span className="text-[10px] opacity-60 mt-1">
            Ex Coll. {catalogId.substring(0, 8).toUpperCase()}
          </span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest opacity-40 mb-1 font-body font-bold">
            Plate
          </span>
          <span className="text-lg leading-none border-b border-stone-400/30 px-1">
            {plateNumber}
          </span>
        </div>
      </div>

      {caption && (
        <div className="mt-3 pt-2 border-t border-stone-200/30 text-[10px] font-body text-stone-400 italic text-center leading-tight">
          "{caption}"
        </div>
      )}
    </div>
  );
};
