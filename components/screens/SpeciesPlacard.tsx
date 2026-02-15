import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConservatory } from '../../services/store';
import { Entity } from '../../types';
import { WireframePlaceholder } from '../WireframePlaceholder';

/**
 * SpeciesPlacard / Organism Detail
 * 
 * Route: /species/:id
 * 
 * Design-agnostic placeholder for species detail view.
 * Will be modularized into sub-components later.
 */
export const SpeciesPlacard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { entities, getRelatedEntities } = useConservatory();

  const organism = entities.find(e => e.id === id && (e.type === 'ORGANISM' || e.type === 'PLANT' || e.type === 'COLONY'));
  const { habitat, tankmates } = organism ? getRelatedEntities(organism.id) : { habitat: null, tankmates: [] };

  if (!organism) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-serif mb-4">Species Not Found</h2>
        <button
          onClick={() => navigate('/home')}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const handleSpeciesClick = (speciesId: string) => {
    navigate(`/species/${speciesId}`);
  };

  const handleHabitatClick = () => {
    if (habitat) {
      navigate(`/habitat/${habitat.id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-emerald-400 hover:text-emerald-300 text-sm uppercase tracking-wider self-start"
      >
        ← Back
      </button>

      {/* Header: Hero Image + Name Overlay */}
      <div className="relative">
        {organism.overflow?.images?.[0] ? (
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
            <img 
              src={organism.overflow.images[0]} 
              alt={organism.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </div>
        ) : (
          <WireframePlaceholder 
            aspectRatio="16/9" 
            label="Organism Illustration (Draws in)" 
            pattern="grid"
            className="rounded-lg"
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-4xl font-serif font-bold text-white mb-2">{organism.name}</h1>
          {organism.scientificName && (
            <p className="text-white/90 italic text-lg">{organism.scientificName}</p>
          )}
        </div>
      </div>

      {/* Taxonomy Ribbon */}
      {organism.overflow?.taxonomy ? (
        <div className="text-xs text-slate-400 uppercase tracking-widest font-mono text-center py-2 border-y border-slate-700/50">
          {organism.overflow.taxonomy.kingdom && <span>{organism.overflow.taxonomy.kingdom}</span>}
          {organism.overflow.taxonomy.family && (
            <>
              <span className="mx-2">·</span>
              <span>{organism.overflow.taxonomy.family}</span>
            </>
          )}
          {organism.overflow.taxonomy.genus && (
            <>
              <span className="mx-2">·</span>
              <span>{organism.overflow.taxonomy.genus}</span>
            </>
          )}
        </div>
      ) : (
        <WireframePlaceholder height="40px" label="Taxonomy Ribbon" pattern="lines" />
      )}

      {/* Discovery Secrets Section: The "Why" */}
      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-2xl font-serif font-bold">Discovery Secrets</h2>
        {organism.overflow?.discovery ? (
          <div className="grid grid-cols-1 gap-6">
            {organism.overflow.discovery.mechanism && (
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <h3 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
                  <span>🔬</span> Mechanism
                </h3>
                <p className="text-slate-300 leading-relaxed font-serif italic">
                  {organism.overflow.discovery.mechanism}
                </p>
              </div>
            )}
            {organism.overflow.discovery.evolutionaryAdvantage && (
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <h3 className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                  <span>🌍</span> Evolutionary Advantage
                </h3>
                <p className="text-slate-300 leading-relaxed font-serif italic">
                  {organism.overflow.discovery.evolutionaryAdvantage}
                </p>
              </div>
            )}
            {organism.overflow.discovery.synergyNote && (
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <h3 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                  <span>🤝</span> Synergy
                </h3>
                <p className="text-slate-300 leading-relaxed font-serif italic">
                  {organism.overflow.discovery.synergyNote}
                </p>
              </div>
            )}
          </div>
        ) : (
          <WireframePlaceholder height="300px" label="Discovery Secrets (Researching...)" pattern="dots" />
        )}
      </div>

      {/* Traits Dashboard: Visual Grid */}
      <div className="grid grid-cols-1 gap-4">
        <h2 className="text-2xl font-serif font-bold">Traits</h2>
        {organism.traits && organism.traits.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {organism.traits.map((trait, idx) => {
              if (trait.type === 'AQUATIC' && trait.parameters) {
                return (
                  <div key={idx} className="space-y-2">
                    <div className="text-xs font-semibold text-cyan-400 uppercase">Aquatic Requirements</div>
                    <div className="flex flex-wrap gap-2">
                      {trait.parameters.pH && (
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                          pH: {trait.parameters.pH}
                        </span>
                      )}
                      {trait.parameters.temp && (
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                          Temp: {trait.parameters.temp}°F
                        </span>
                      )}
                      {trait.parameters.salinity && (
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                          {trait.parameters.salinity}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
              if (trait.type === 'PHOTOSYNTHETIC' && trait.parameters) {
                return (
                  <div key={idx} className="space-y-2">
                    <div className="text-xs font-semibold text-emerald-400 uppercase">Light & Growth</div>
                    <div className="flex flex-wrap gap-2">
                      {trait.parameters.lightReq && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                          Light: {trait.parameters.lightReq}
                        </span>
                      )}
                      {trait.parameters.co2 !== undefined && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                          CO2: {trait.parameters.co2 ? 'Yes' : 'No'}
                        </span>
                      )}
                      {trait.parameters.placement && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                          {trait.parameters.placement}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
              if (trait.type === 'VERTEBRATE' && trait.parameters) {
                return (
                  <div key={idx} className="space-y-2">
                    <div className="text-xs font-semibold text-amber-400 uppercase">Diet</div>
                    {trait.parameters.diet && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                        {trait.parameters.diet}
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ) : null}
      </div>

      {/* Personal History Timeline */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Personal History</h3>
        {organism.observations && organism.observations.length > 0 ? (
          <div className="space-y-2">
            {organism.observations.map((obs, idx) => (
              <div key={idx} className="bg-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">
                  {new Date(obs.timestamp).toLocaleDateString()}
                </div>
                <div className="text-sm text-slate-300">
                  {obs.label}: {obs.value} {obs.unit || ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm italic">
            No observations yet. Use voice to log growth, behavior, or measurements.
          </p>
        )}
      </div>

      {/* In Your Conservatory */}
      {habitat && (
        <div>
          <h3 className="text-xl font-semibold mb-2">In Your Conservatory</h3>
          <p className="text-slate-300 mb-2">
            Lives in{' '}
            <button
              onClick={handleHabitatClick}
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              {habitat.name}
            </button>
            {tankmates.length > 0 && ` with ${tankmates.length} tankmate${tankmates.length > 1 ? 's' : ''}:`}
          </p>
          {tankmates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tankmates.map(tankmate => (
                <button
                  key={tankmate.id}
                  onClick={() => handleSpeciesClick(tankmate.id)}
                  className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 text-sm text-emerald-400"
                >
                  {tankmate.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
