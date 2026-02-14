
import plantLibrary from '../src/data/plant_library.json';

export interface PlantData {
  id: string;
  name: string;
  scientificName?: string;
  url: string;
  images: string[];
  details: {
    description?: string;
    notes?: string;
    maintenance?: string;
    narrativeHtml?: string;
    distributionMap?: string;
  };
  traits: Record<string, string>;
  discovery?: {
    mechanism: string;
    evolutionaryAdvantage: string;
    synergyNote: string;
  };
  listingType: 'aquasabi';
}

// Convert module import to typed array
const plants: PlantData[] = plantLibrary as PlantData[];

export const plantService = {
  
  getAll(): PlantData[] {
    return plants;
  },

  getById(id: string): PlantData | undefined {
    return plants.find(p => p.id === id);
  },

  search(query: string): PlantData | undefined {
    const q = query.toLowerCase();
    
    // 1. Exact Name Match
    const exact = plants.find(p => p.name.toLowerCase() === q);
    if (exact) return exact;

    // 2. ID Match
    const idMatch = plants.find(p => p.id.toLowerCase() === q);
    if (idMatch) return idMatch;

    // 3. Fuzzy / Partial Match
    // We prioritize "starts with" over "includes"
    const startMatch = plants.find(p => p.name.toLowerCase().startsWith(q));
    if (startMatch) return startMatch;

    return plants.find(p => p.name.toLowerCase().includes(q));
  },

  /**
   * Returns multiple matches for UI dropdowns or AI context.
   * Priority: Exact -> StartsWith -> Includes
   */
  searchMany(query: string, limit: number = 10): PlantData[] {
    const q = query.toLowerCase();
    if (!q) return [];

    const matches = plants.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.id.toLowerCase().includes(q) ||
      (p.scientificName && p.scientificName.toLowerCase().includes(q))
    );

    return matches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // 1. Exact match top
      if (aName === q) return -1;
      if (bName === q) return 1;

      // 2. Starts with
      const aStarts = aName.startsWith(q);
      const bStarts = bName.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return 0;
    }).slice(0, limit);
  },

  /**
   * Returns all plants in a specific genus (e.g., "Anubias").
   * Used for AI context when a specific plant isn't found.
   */
  getGenusGroup(genus: string): PlantData[] {
     const q = genus.toLowerCase();
     return plants.filter(p => 
        p.name.toLowerCase().startsWith(q) || 
        (p.traits.Genus && p.traits.Genus.toLowerCase() === q)
     );
  }
};
