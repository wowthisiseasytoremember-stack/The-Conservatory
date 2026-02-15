
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Entity, EntityType } from '../types';
import { Sparkles } from 'lucide-react';

interface FeaturedSpecimenCardProps {
  entities: Entity[];
  onEntityClick?: (entity: Entity) => void; // Optional for backward compatibility
}

/**
 * Featured Specimen Card - A hero card that rotates daily showing one entity from the collection.
 * 
 * Features:
 * - Rotates daily based on date seed
 * - Shows hero image, common name, scientific name, and discovery fact
 * - Full-bleed image with dark gradient overlay
 * - Serif typography with emerald accent glow
 * - Tap to open full Specimen Placard
 */
export const FeaturedSpecimenCard: React.FC<FeaturedSpecimenCardProps> = ({ 
  entities, 
  onEntityClick 
}) => {
  const navigate = useNavigate();
  // Filter to only non-habitat entities that have enrichment data
  const eligibleEntities = useMemo(() => {
    return entities.filter(e => 
      e.type !== EntityType.HABITAT && 
      (e.overflow?.discovery?.mechanism || e.overflow?.images?.[0])
    );
  }, [entities]);

  // Select featured entity based on daily rotation
  const featuredEntity = useMemo(() => {
    if (eligibleEntities.length === 0) return null;
    
    // Use date-based seed for daily rotation
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % eligibleEntities.length;
    
    return eligibleEntities[index];
  }, [eligibleEntities]);

  // If no featured entity, don't render
  if (!featuredEntity) {
    return null;
  }

  // Get image from overflow.images[0] or fallback
  const heroImage = featuredEntity.overflow?.images?.[0] || 
                    featuredEntity.overflow?.referenceImages?.[0] || 
                    null;

  // Get discovery mechanism (first sentence)
  const discoveryText = featuredEntity.overflow?.discovery?.mechanism 
    ? featuredEntity.overflow.discovery.mechanism.split('.')[0] + '.'
    : null;

  // Get scientific name
  const scientificName = featuredEntity.scientificName || 
                         featuredEntity.overflow?.taxonomy?.scientificName || 
                         null;

  return (
    <button
      onClick={() => {
        if (onEntityClick) {
          onEntityClick(featuredEntity);
        } else {
          navigate(`/species/${featuredEntity.id}`);
        }
      }}
      className="w-full relative rounded-2xl overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] mb-6"
      style={{
        aspectRatio: '16/9',
        minHeight: '200px'
      }}
    >
      {/* Hero Image */}
      {heroImage ? (
        <img
          src={heroImage}
          alt={featuredEntity.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 via-slate-900/60 to-slate-800/80" />
      )}

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />

      {/* Emerald Accent Glow */}
      <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
           style={{
             boxShadow: 'inset 0 0 60px rgba(16, 185, 129, 0.1)'
           }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
        {/* Discovery Badge */}
        {discoveryText && (
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400/90 font-semibold uppercase tracking-wider">
              Discovery
            </span>
          </div>
        )}

        {/* Common Name - Serif Typography */}
        <h2 className="text-3xl font-serif font-bold text-white mb-1 drop-shadow-lg">
          {featuredEntity.name}
        </h2>

        {/* Scientific Name - Italic */}
        {scientificName && (
          <p className="text-sm text-slate-300 italic mb-3 drop-shadow-md">
            {scientificName}
          </p>
        )}

        {/* Discovery Fact - One Line */}
        {discoveryText && (
          <p className="text-sm text-slate-200 leading-relaxed line-clamp-2 drop-shadow-md">
            {discoveryText}
          </p>
        )}

        {/* Tap Hint */}
        <div className="mt-4 text-xs text-slate-400/70 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Tap to explore</span>
          <span>→</span>
        </div>
      </div>

      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 border-2 border-emerald-500/0 group-hover:border-emerald-500/30 rounded-2xl transition-all duration-300" />
    </button>
  );
};
