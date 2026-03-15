import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntities } from '../../services/store/queryHooks';
import { WireframePlaceholder } from '../WireframePlaceholder';
import { HeroSection } from '../HeroSection';
import { FeaturedSpecimenCard } from '../FeaturedSpecimenCard';
import { Flower2 } from 'lucide-react';

/**
 * HomeScreen / Featured Habitat Spread
 * 
 * Route: /home
 */
export const HomeScreen: React.FC = () => {
  const { data: entities = [], isLoading } = useEntities();
  const navigate = useNavigate();

  // Featured habitat selection
  const featuredHabitat = entities
    .filter(e => e.type === 'HABITAT')
    .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))[0] || null;

  const handleSpeciesClick = (speciesId: string) => {
    navigate(`/species/${speciesId}`);
  };

  const handleHabitatClick = (habitatId: string) => {
    navigate(`/habitat/${habitatId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-gold font-serif animate-pulse text-2xl">Consulting Journal...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      <HeroSection />

      {/* Featured Daily Specimen */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4 px-1">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Featured Specimen</h3>
          <div className="flex-1 h-px bg-gold/10" />
        </div>
        <FeaturedSpecimenCard entities={entities} onEntityClick={(e) => handleSpeciesClick(e.id)} />
      </div>

      {!featuredHabitat ? (
        <div className="text-center py-12">
          <h2 className="text-3xl font-serif mb-4">Welcome to The Conservatory</h2>
          <WireframePlaceholder height="200px" label="Onboarding Illustration" pattern="dots" />
          <p className="text-slate-400 mt-4">No habitats yet. Use voice to create your first habitat.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {/* Active Habitat Focus */}
          <section className="space-y-6">
            <div className="flex items-end justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-4xl font-serif font-bold text-white mb-1">{featuredHabitat.name}</h2>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Latest Entry in Field Journal</span>
              </div>
              <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Habitat</span>
              </div>
            </div>

            {/* Habitat Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 aspect-[4/3] group">
                {featuredHabitat.overflow?.illustration ? (
                  <img src={featuredHabitat.overflow.illustration} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={featuredHabitat.name} />
                ) : (
                  <WireframePlaceholder height="100%" label="Habitat Illustration" pattern="grid" />
                )}
              </div>
              
              <div className="space-y-6 flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">Field Notes</div>
                  <p className="text-slate-300 text-xl italic leading-relaxed font-serif">
                    "{featuredHabitat.overflow?.narrative || featuredHabitat.details?.description || 'The ecosystem remains stable, awaiting further observation...'}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div className="text-3xl font-bold text-emerald-400">{entities.filter(e => e.habitat_id === featuredHabitat.id).length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Residents</div>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                    <div className="text-3xl font-bold text-cyan-400">
                      {entities.filter(e => e.habitat_id === featuredHabitat.id && e.type === 'PLANT').length}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Plants</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Residents Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Local Inhabitants</h3>
              <button onClick={() => handleHabitatClick(featuredHabitat.id)} className="text-[10px] font-bold text-gold hover:text-white uppercase tracking-widest transition-colors">
                Explore Habitat →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {entities.filter(e => e.habitat_id === featuredHabitat.id).slice(0, 8).map(organism => (
                <button
                  key={organism.id}
                  onClick={() => handleSpeciesClick(organism.id)}
                  className="group relative aspect-square bg-slate-900 rounded-xl border border-slate-800 hover:border-gold/50 transition-all overflow-hidden shadow-placard"
                >
                  {organism.overflow?.images?.[0] ? (
                    <img src={organism.overflow.images[0]} className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-all" alt={organism.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800/20 text-slate-700">
                      <Flower2 className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-3 flex flex-col justify-end">
                    <div className="text-xs font-serif font-bold text-white group-hover:text-gold transition-colors">{organism.name}</div>
                    {organism.scientificName && (
                      <div className="text-[8px] text-slate-400 italic truncate font-body">{organism.scientificName}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

