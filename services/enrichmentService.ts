
import { Entity, EntityTrait } from '../types';
import { plantService } from './plantService';

interface EnrichmentResult {
  scientificName?: string;
  commonName?: string;
  description?: string;
  origin?: string;
  taxonomy?: any;
  images?: string[];
  tips?: string;
}

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const GBIF_API = 'https://api.gbif.org/v1';
const INAT_API = 'https://api.inaturalist.org/v1';

export const enrichmentService = {
  
  async searchGBIF(query: string): Promise<EnrichmentResult | null> {
    try {
      const matchRes = await fetch(`${GBIF_API}/species/match?name=${encodeURIComponent(query)}`);
      const matchData = await matchRes.json();
      
      if (!matchData.usageKey) return null;

      const profileRes = await fetch(`${GBIF_API}/species/${matchData.usageKey}`);
      const profile = await profileRes.json();

      return {
        scientificName: profile.scientificName,
        taxonomy: {
          kingdom: profile.kingdom,
          phylum: profile.phylum,
          order: profile.order,
          family: profile.family,
          genus: profile.genus
        }
      };
    } catch (e) {
      console.warn("GBIF Search Failed", e);
      return null;
    }
  },

  async searchWikipedia(query: string): Promise<EnrichmentResult | null> {
    try {
      const searchUrl = `${WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      
      if (!searchData.query?.search?.length) return null;
      
      const title = searchData.query.search[0].title;
      const contentUrl = `${WIKI_API}?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(title)}&format=json&origin=*`;
      const contentRes = await fetch(contentUrl);
      const contentData = await contentRes.json();
      
      const pages = contentData.query?.pages;
      const pageId = Object.keys(pages)[0];
      const extract = pages[pageId]?.extract;

      return {
        description: extract,
        commonName: title 
      };
    } catch (e) {
      console.warn("Wiki Search Failed", e);
      return null;
    }
  },

  async searchiNaturalist(query: string): Promise<EnrichmentResult | null> {
    try {
        const url = `${INAT_API}/taxa?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.results?.length) return null;
        
        const best = data.results[0];
        return {
            commonName: best.preferred_common_name,
            scientificName: best.name,
            images: best.default_photo ? [best.default_photo.medium_url] : []
        };
    } catch (e) {
        console.warn("iNaturalist Search Failed", e);
        return null;
    }
  },


  /**
   * Scrapes Aquasabi/Flowgrow for rich aquarist data.
   * NOW USES LOCAL JSON DATABASE (Scraped via Playwright)
   */
  async scrapeAquasabi(query: string): Promise<any> {
    try {
      // Use local service first
      const localMatch = plantService.search(query);
      
      if (localMatch) {
        console.log(`[Enrichment] Found local match for "${query}": ${localMatch.name}`);
        return {
            details: localMatch.details,
            traits: localMatch.traits,
            images: localMatch.images
        };
      }

      console.warn(`[Enrichment] No local match found for "${query}"`);
      return null;

    } catch (e) {
      console.warn("Aquasabi Lookup Failed", e);
      return null;
    }
  }
};
