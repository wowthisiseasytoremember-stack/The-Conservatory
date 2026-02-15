import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConservatory } from '../../services/store';

/**
 * HabitatDiorama / Ecosystem Detail
 * 
 * Route: /habitat/:id
 * 
 * Design-agnostic placeholder for habitat detail view.
 * Shows habitat info, residents, and ecosystem narrative.
 */
export const HabitatDiorama: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { entities, getHabitatInhabitants } = useConservatory();

  const habitat = entities.find(e => e.id === id && e.type === 'HABITAT');
  const residents = habitat ? getHabitatInhabitants(habitat.id) : [];

  if (!habitat) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-serif mb-4">Habitat Not Found</h2>
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

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/home')}
        className="mb-4 text-emerald-400 hover:text-emerald-300"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-serif mb-4">{habitat.name}</h2>

      {/* Illustration */}
      {habitat.overflow?.illustration ? (
        <img 
          src={habitat.overflow.illustration} 
          alt={habitat.name}
          className="w-full h-64 object-cover rounded-lg mb-4"
        />
      ) : (
        <div className="w-full h-64 bg-slate-800 rounded-lg mb-4 flex items-center justify-center text-slate-500">
          [Habitat Illustration Placeholder]
        </div>
      )}

      {/* Narrative */}
      {habitat.overflow?.narrative ? (
        <p className="text-slate-300 mb-4 italic leading-relaxed">
          {habitat.overflow.narrative}
        </p>
      ) : habitat.details?.description ? (
        <p className="text-slate-300 mb-4 italic leading-relaxed">
          {habitat.details.description}
        </p>
      ) : (
        <p className="text-slate-400 mb-4 italic text-sm">
          Ecosystem narrative will appear here after enrichment...
        </p>
      )}

      {/* Quick Stats */}
      {habitat.traits && habitat.traits.length > 0 && (
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
          <div className="text-xs text-slate-400 mb-2">Parameters</div>
          <div className="flex flex-wrap gap-2">
            {habitat.traits.map((trait, idx) => {
              if (trait.type === 'AQUATIC' && trait.parameters) {
                return (
                  <React.Fragment key={idx}>
                    {trait.parameters.pH && (
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                        pH: {trait.parameters.pH}
                      </span>
                    )}
                    {trait.parameters.temp && (
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                        {trait.parameters.temp}°F
                      </span>
                    )}
                  </React.Fragment>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Residents list */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold mb-2">Residents ({residents.length})</h3>
        {residents.length === 0 ? (
          <p className="text-slate-400">No residents yet.</p>
        ) : (
          residents.map(organism => (
            <button
              key={organism.id}
              onClick={() => handleSpeciesClick(organism.id)}
              className="block w-full text-left p-2 bg-slate-800 rounded hover:bg-slate-700 transition-colors"
            >
              {organism.name} {organism.scientificName && `(${organism.scientificName})`}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
