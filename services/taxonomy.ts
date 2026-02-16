
import { speciesLibrary, SpeciesRecord } from './speciesLibrary';
import { Entity, EntityType } from '../types';

/**
 * TAXONOMY SERVICE
 * 
 * Logic for normalizing species names and linking entities to the species library.
 */

export const taxonomyService = {
  /**
   * Normalizes an entity's name and links it to a canonical species record if found.
   * 
   * @param name The input species name (common or scientific)
   * @returns Canonical record if found, null otherwise
   */
  async normalizeSpecies(name: string): Promise<SpeciesRecord | null> {
    console.log(`[Taxonomy] Normalizing: ${name}`);
    
    // 1. Try exact match in library
    const match = await speciesLibrary.findByName(name);
    
    if (match) {
      console.log(`[Taxonomy] Found canonical match for ${name}: ${match.scientificName || match.commonName}`);
      return match;
    }
    
    return null;
  },

  /**
   * Resolves a Vision result against the local library to find the most accurate ID.
   * Priority: Scientific Name match > Common Name match.
   */
  async resolveVisionResult(scientificName: string, commonName: string): Promise<SpeciesRecord | null> {
    // 1. Try scientific name (highest precision)
    if (scientificName) {
      const sciMatch = await speciesLibrary.findByName(scientificName);
      if (sciMatch) return sciMatch;
    }

    // 2. Try common name
    if (commonName) {
      const comMatch = await speciesLibrary.findByName(commonName);
      if (comMatch) return comMatch;
    }

    return null;
  },

  /**
   * Enriches a new entity with data from the species library if available.
   */
  async autoEnrich(entity: Partial<Entity>): Promise<Partial<Entity>> {
    if (!entity.name || entity.type === EntityType.HABITAT) return entity;

    const record = await this.normalizeSpecies(entity.name);
    if (record) {
      return {
        ...entity,
        scientificName: record.scientificName || entity.scientificName,
        details: {
          ...entity.details,
          ...record.enrichmentData.details
        },
        overflow: {
          ...entity.overflow,
          ...record.enrichmentData.overflow
        },
        enrichment_status: 'complete' // Instant win!
      };
    }

    return entity;
  }
};
