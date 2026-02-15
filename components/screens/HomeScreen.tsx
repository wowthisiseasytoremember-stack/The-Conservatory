import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConservatory } from '../../services/store';

/**
 * HomeScreen / Featured Habitat Spread
 * 
 * Route: /home
 * 
 * Design-agnostic placeholder for featured habitat display.
 * Will show featured habitat with placeholder layout.
 */
export const HomeScreen: React.FC = () => {
  const { entities } = useConservatory();
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
      <div className="p-6">
        <h2 className="text-2xl font-serif mb-4">Welcome to The Conservatory</h2>
        <p className="text-slate-400">No habitats yet. Use voice to create your first habitat.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-serif mb-4">{featuredHabitat.name}</h2>
      
      {/* Illustration */}
      {featuredHabitat.overflow?.illustration ? (
        <img 
          src={featuredHabitat.overflow.illustration} 
          alt={featuredHabitat.name}
          className="w-full h-64 object-cover rounded-lg mb-4"
        />
      ) : (
        <div className="w-full h-64 bg-slate-800 rounded-lg mb-4 flex items-center justify-center text-slate-500">
          [Illustration Placeholder]
        </div>
      )}

      {/* Narrative */}
      {featuredHabitat.overflow?.narrative ? (
        <p className="text-slate-300 mb-4 italic leading-relaxed">
          {featuredHabitat.overflow.narrative}
        </p>
      ) : featuredHabitat.details?.description ? (
        <p className="text-slate-300 mb-4 italic leading-relaxed">
          {featuredHabitat.details.description}
        </p>
      ) : (
        <p className="text-slate-400 mb-4 italic text-sm">
          Field journal narrative will appear here after enrichment...
        </p>
      )}

      {/* Placeholder species list */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold mb-2">Residents</h3>
        {entities
          .filter(e => e.type === 'ORGANISM' && e.habitat_id === featuredHabitat.id)
          .map(organism => (
            <button
              key={organism.id}
              onClick={() => handleSpeciesClick(organism.id)}
              className="block w-full text-left p-2 bg-slate-800 rounded hover:bg-slate-700 transition-colors"
            >
              {organism.name} {organism.scientificName && `(${organism.scientificName})`}
            </button>
          ))}
      </div>

      <button
        onClick={() => handleHabitatClick(featuredHabitat.id)}
        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
      >
        View Full Habitat
      </button>
    </div>
  );
};
