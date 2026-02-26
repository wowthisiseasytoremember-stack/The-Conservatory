
import { Entity, EntityTrait, RawDataLake, EnrichedData } from '../types';
import { plantService } from './plantService';
import { logger } from './logger';
import { geminiService } from './geminiService';
import axios from 'axios';
import * as cheerio from 'cheerio';

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
  
  async enrichEntity(entity: Entity): Promise<EnrichedData> {
    logger.info({ entityId: entity.id, name: entity.name }, "Starting enrichment pipeline");
    
    // 1. Scrape raw data lake
    const dossier = await this.assembleDossier(entity);
    
    // 2. Synthesize with Gemini
    try {
      const enriched = await geminiService.synthesizeEnrichmentData(dossier);
      return enriched;
    } catch (e) {
      logger.error({ err: e, entityId: entity.id }, "Failed to synthesize enrichment data");
      return { source: 'NONE' };
    }
  },

  async assembleDossier(entity: Entity): Promise<RawDataLake> {
    const query = entity.scientificName || entity.name;
    
    const results = await Promise.all([
      this.scrapeWikipediaPage(query),
      this.scrapeAquasabiPage(query),
      this.scrapeFlowgrowPage(query),
      this.scrapeKewPage(query)
    ]);

    return {
      entityId: entity.id,
      scrapedAt: Date.now(),
      sources: results
    };
  },

  async scrapeWikipediaPage(query: string): Promise<RawDataLake['sources'][0]> {
    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/ /g, '_'))}`;
    try {
      const { data: html } = await axios.get(url, { timeout: 5000 });
      const $ = cheerio.load(html);
      
      // Clean up unnecessary elements
      $('.reference, .mw-editsection, .infobox, .navbox, .metadata').remove();
      
      const content = $('#mw-content-text .mw-parser-output > p')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(p => p.length > 0)
        .join('\n\n');

      return { url, content, status: 'success' };
    } catch (e) {
      logger.warn({ err: e, url }, "Wikipedia scraping failed");
      return { url, content: '', status: 'error', error: (e as any).message };
    }
  },

  async scrapeAquasabiPage(query: string): Promise<RawDataLake['sources'][0]> {
    const url = `https://www.aquasabi.com/search?q=${encodeURIComponent(query)}`;
    try {
      const { data: html } = await axios.get(url, { timeout: 8000 });
      const $ = cheerio.load(html);
      
      // Find the first product link
      const firstProductUrl = $('.product--title a').first().attr('href');
      if (!firstProductUrl) throw new Error("No product found on Aquasabi");

      const { data: productHtml } = await axios.get(firstProductUrl, { timeout: 8000 });
      const p$ = cheerio.load(productHtml);
      
      const content = p$('.product--description').text().trim() + 
                      '\n\n' + 
                      p$('.product--properties').text().trim();

      return { url: firstProductUrl, content, status: 'success' };
    } catch (e) {
      logger.warn({ err: e, url }, "Aquasabi scraping failed");
      return { url, content: '', status: 'error', error: (e as any).message };
    }
  },

  async scrapeFlowgrowPage(query: string): Promise<RawDataLake['sources'][0]> {
    // Flowgrow usually uses the scientific name or a search
    const url = `https://www.flowgrow.de/db/wasserpflanzen?search=${encodeURIComponent(query)}`;
    try {
      const { data: html } = await axios.get(url, { timeout: 8000 });
      const $ = cheerio.load(html);
      
      const firstMatch = $('.db-list-item a').first().attr('href');
      if (!firstMatch) throw new Error("No match on Flowgrow");

      const fullUrl = firstMatch.startsWith('http') ? firstMatch : `https://www.flowgrow.de${firstMatch}`;
      const { data: matchHtml } = await axios.get(fullUrl, { timeout: 8000 });
      const m$ = cheerio.load(matchHtml);
      
      const content = m$('.db-entry-description').text().trim() + 
                      '\n\n' + 
                      m$('.db-entry-properties').text().trim();

      return { url: fullUrl, content, status: 'success' };
    } catch (e) {
      logger.warn({ err: e, url }, "Flowgrow scraping failed");
      return { url, content: '', status: 'error', error: (e as any).message };
    }
  },

  async scrapeKewPage(query: string): Promise<RawDataLake['sources'][0]> {
    const url = `https://powo.science.kew.org/results?q=${encodeURIComponent(query)}`;
    try {
      const { data: html } = await axios.get(url, { timeout: 8000 });
      const $ = cheerio.load(html);
      
      const firstLink = $('.search-result-item a').first().attr('href');
      if (!firstLink) throw new Error("No match on Kew POWO");

      const fullUrl = `https://powo.science.kew.org${firstLink}`;
      const { data: resultHtml } = await axios.get(fullUrl, { timeout: 8000 });
      const r$ = cheerio.load(resultHtml);
      
      const content = r$('#description-content').text().trim() + 
                      '\n\n' + 
                      r$('#distribution-content').text().trim();

      return { url: fullUrl, content, status: 'success' };
    } catch (e) {
      logger.warn({ err: e, url }, "Kew scraping failed");
      return { url, content: '', status: 'error', error: (e as any).message };
    }
  },

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
      logger.warn({ err: e, operation: 'gbif_search' }, "GBIF search failed");
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
      logger.warn({ err: e, operation: 'wikipedia_search' }, "Wikipedia search failed");
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
        logger.warn({ err: e, operation: 'inaturalist_search' }, "iNaturalist search failed");
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
        logger.info({ query, matchName: localMatch.name }, "Found local plant library match");
        // Map local data to EnrichmentResult interface
        return {
            scientificName: localMatch.scientificName || localMatch.traits['Complete botanical name'],
            commonName: localMatch.name,
            description: localMatch.details.description,
            origin: localMatch.traits['Origin'] || localMatch.traits['Distribution'], // Guessing keys, safe fallback
            images: localMatch.images,
            tips: localMatch.details.notes
        };
      }

      logger.warn({ query }, "No local plant library match found");
      return null;

    } catch (e) {
      logger.warn({ err: e, operation: 'aquasabi_lookup' }, "Aquasabi lookup failed");
      return null;
    }
  }
};
