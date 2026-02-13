
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
  };
  traits: Record<string, string>;
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
  }
};
