import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConservatory } from '../../services/store';
import { WireframePlaceholder } from '../WireframePlaceholder';

/**
 * HomeScreen / Featured Habitat Spread
 * 
 * Route: /home
 * 
 * Wireframe matching design spec: Nat Geo magazine spread layout
 * - Header with habitat name + type badge
 * - Full-width illustration (draws in animation placeholder)
 * - Field journal narrative section
 * - Species callouts grid
 * - Quick stats bar
 */
export const HomeScreen: React.FC = () => {
  const { entities, getHabitatInhabitants } = useConservatory();
  const navigate = useNavigate();

  // Featured habitat selection: most recently updated, or first if none
  const featuredHabitat = entities
    .filter(e => e.type === 'HABITAT')
    .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))[0] || null;

  const handleSpeciesClick = (speciesId: string) => {
    navigate(`/species/${speciesId}`);
  };

  const handleHabitatClick = (habitatId: string) => {
    navigate(`/habitat/${habitatId}`);
  };

  if (!featuredHabitat) {
    return (
      <div className="grid grid-cols-1 gap-6 p-6">
        <div className="text-center py-12">
          <h2 className="text-3xl font-serif mb-4">Welcome to The Conservatory</h2>
          <WireframePlaceholder height="200px" label="Onboarding Illustration" pattern="dots" />
          <p className="text-slate-400 mt-4">No habitats yet. Use voice to create your first habitat.</p>
        </div>
      </div>
    );
  }

  const inhabitants = getHabitatInhabitants(featuredHabitat.id);
  const habitatType = featuredHabitat.traits?.find(t => t.type === 'AQUATIC') 
    ? 'Freshwater' 
    : featuredHabitat.traits?.find(t => t.type === 'TERRESTRIAL')
    ? 'Terrarium'
    : 'Habitat';

  return (
    <div className="grid grid-cols-1 gap-6 p-6 max-w-4xl mx-auto">
      {/* Header: Habitat Name + Type Badge */}
      <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
        <div>
          <h1 className="text-4xl font-serif font-bold mb-2">{featuredHabitat.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-mono">Field Journal</span>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">{habitatType}</span>
        </div>
      </div>

      {/* Illustration: Full-width, draws in animation placeholder */}
      <div className="relative">
        {featuredHabitat.overflow?.illustration ? (
          <img 
            src={featuredHabitat.overflow.illustration} 
            alt={featuredHabitat.name}
            className="w-full aspect-[16/10] object-cover rounded-lg"
          />
        ) : (
          <WireframePlaceholder 
            aspectRatio="16/10" 
            label="Habitat Illustration (Draws in 2-3s)" 
            pattern="grid"
            className="rounded-lg"
          />
        )}
        {/* Species callout labels overlay (wireframe) */}
        <div className="absolute inset-0 pointer-events-none">
          {inhabitants.slice(0, 3).map((org, idx) => (
            <div 
              key={org.id}
              className="absolute"
              style={{
                left: `${20 + idx * 30}%`,
                top: `${30 + idx * 20}%`
              }}
            >
              <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-white/20">
                <div className="text-xs font-serif text-white">{org.name}</div>
                {org.scientificName && (
                  <div className="text-[10px] text-white/70 italic">{org.scientificName}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Narrative: Field Journal Text */}
      <div className="grid grid-cols-1 gap-3">
        <div className="text-xs uppercase tracking-widest text-slate-500 font-mono mb-2">Field Journal</div>
        {featuredHabitat.overflow?.narrative ? (
          <p className="text-slate-300 text-lg italic leading-relaxed font-serif">
            {featuredHabitat.overflow.narrative}
          </p>
        ) : featuredHabitat.details?.description ? (
          <p className="text-slate-300 text-lg italic leading-relaxed font-serif">
            {featuredHabitat.details.description}
          </p>
        ) : (
          <WireframePlaceholder height="120px" label="Field Journal Narrative" pattern="lines" />
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-2xl font-bold text-emerald-400">{inhabitants.length}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Residents</div>
        </div>
        <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="text-2xl font-bold text-cyan-400">
            {inhabitants.filter(e => e.type === 'PLANT').length}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Plants</div>
        </div>
        <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <WireframePlaceholder height="40px" label="pH" pattern="solid" />
          <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">pH</div>
        </div>
        <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <WireframePlaceholder height="40px" label="Temp" pattern="solid" />
          <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Temp</div>
        </div>
      </div>

      {/* Residents Grid: Clickable Species Cards */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Residents</h3>
          <button
            onClick={() => handleHabitatClick(featuredHabitat.id)}
            className="text-xs text-emerald-400 hover:text-emerald-300 uppercase tracking-wider"
          >
            View All →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {inhabitants.slice(0, 6).map(organism => (
            <button
              key={organism.id}
              onClick={() => handleSpeciesClick(organism.id)}
              className="group relative aspect-square bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-all overflow-hidden"
            >
              {organism.overflow?.images?.[0] ? (
                <img 
                  src={organism.overflow.images[0]} 
                  alt={organism.name}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <WireframePlaceholder 
                  height="100%" 
                  label={organism.name} 
                  pattern="dots"
                  className="opacity-40"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex flex-col justify-end">
                <div className="text-sm font-serif font-bold text-white">{organism.name}</div>
                {organism.scientificName && (
                  <div className="text-xs text-white/70 italic truncate">{organism.scientificName}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
