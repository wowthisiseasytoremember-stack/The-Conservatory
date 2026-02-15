import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConservatory } from '../../services/store';
import { Entity } from '../../types';

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
  const { entities } = useConservatory();

  const organism = entities.find(e => e.id === id && e.type === 'ORGANISM');
  const habitat = organism ? entities.find(e => e.id === organism.habitat_id && e.type === 'HABITAT') : null;
  const tankmates = organism && habitat
    ? entities.filter(e => 
        e.type === 'ORGANISM' && 
        e.habitat_id === habitat.id && 
        e.id !== organism.id
      )
    : [];

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
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-emerald-400 hover:text-emerald-300"
      >
        ← Back
      </button>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-serif mb-2">{organism.name}</h2>
        {organism.scientificName && (
          <p className="text-slate-400 italic">{organism.scientificName}</p>
        )}
        {/* Taxonomy info from overflow or details */}
        {organism.overflow?.taxonomy && (
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            {organism.overflow.taxonomy.kingdom && <span>{organism.overflow.taxonomy.kingdom}</span>}
            {organism.overflow.taxonomy.family && (
              <>
                <span className="text-slate-700">·</span>
                <span>{organism.overflow.taxonomy.family}</span>
              </>
            )}
            {organism.overflow.taxonomy.genus && (
              <>
                <span className="text-slate-700">·</span>
                <span>{organism.overflow.taxonomy.genus}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hero image */}
      {organism.overflow?.images?.[0] ? (
        <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
          <img 
            src={organism.overflow.images[0]} 
            alt={organism.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="w-full h-64 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 mb-4">
          [Organism Illustration Placeholder]
        </div>
      )}

      {/* Discovery Secrets Section */}
      {organism.overflow?.discovery && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Discovery Secrets</h3>
          <div className="space-y-3">
            {organism.overflow.discovery.mechanism && (
              <div>
                <h4 className="font-semibold mb-1">🔬 Mechanism</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {organism.overflow.discovery.mechanism}
                </p>
              </div>
            )}
            {organism.overflow.discovery.evolutionaryAdvantage && (
              <div>
                <h4 className="font-semibold mb-1">🌍 Evolutionary Advantage</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {organism.overflow.discovery.evolutionaryAdvantage}
                </p>
              </div>
            )}
            {organism.overflow.discovery.synergyNote && (
              <div>
                <h4 className="font-semibold mb-1">🤝 Synergy</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {organism.overflow.discovery.synergyNote}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {organism.enrichment_status !== 'complete' && !organism.overflow?.discovery && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Discovery Secrets</h3>
          <p className="text-slate-400 text-sm italic">
            Enrichment in progress... Discovery secrets will appear here once research is complete.
          </p>
        </div>
      )}

      {/* Traits Dashboard */}
      {organism.traits && organism.traits.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Traits</h3>
          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
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
        </div>
      )}

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
