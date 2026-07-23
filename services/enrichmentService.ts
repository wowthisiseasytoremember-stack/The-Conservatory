
import { db, collection, doc, setDoc, getDoc } from './firebase';
import { Entity, RawDataLake, EnrichedData } from '../types';
import { logger } from './logger';
import { geminiService } from './geminiService';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * High-Fidelity Enrichment Service (Direct Client Mode)
 */

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;

export const enrichmentService = {
  
  async enrichEntity(entity: Entity): Promise<EnrichedData> {
    if ((window as any).__E2E__) {
      return this.getMockData(entity);
    }

    logger.info({ entityId: entity.id, name: entity.name }, "Starting enrichment waterfall (Direct Mode)");
    
    // 1. Raw Data Lake (Cache layer)
    const lakeRef = doc(db, 'raw_data_lake', entity.id);
    let dossier: RawDataLake;

    try {
      const existingLake = await getDoc(lakeRef);
      if (existingLake.exists()) {
        dossier = existingLake.data() as RawDataLake;
      } else {
        dossier = await this.assembleDossier(entity);
        try { await setDoc(lakeRef, dossier); } catch(e) {}
      }
    } catch (e) {
      dossier = await this.assembleDossier(entity);
    }
    
    // 2. Research Phase (Direct Perplexity Call)
    let researchSummary = "";
    try {
      researchSummary = await this.performDeepResearch(entity);
    } catch (e) {
      logger.error({ err: e }, "Deep Research failed");
    }

    // 3. Synthesis Phase (Gemini Curator)
    try {
      const structuredData = await geminiService.synthesizeEnrichmentData(dossier, researchSummary);
      
      // 4. Storytelling Phase
      if (researchSummary || dossier.sources.length > 0) {
        const context = researchSummary || dossier.sources.map(s => s.content).join("\n\n");
        const story = await geminiService.curateLivingPlacard(entity, context);
        
        structuredData.description = story.narrative;
        (structuredData as any).biologicalStory = story.biologicalStory;
        
        if (!structuredData.overflow) structuredData.overflow = {};
        structuredData.overflow.discovery = {
          mechanism: story.discovery
        };
      }

      return structuredData;
    } catch (e) {
      logger.error({ err: e }, "Synthesis failed");
      return { source: 'NONE', description: "Research failed to synthesize." } as any;
    }
  },

  async performDeepResearch(entity: Entity): Promise<string> {
    if (!PERPLEXITY_API_KEY) {
      logger.warn("No Perplexity API Key found in .env");
      return "";
    }

    const query = `Provide a comprehensive curator's summary for: ${entity.name}. Focus on origin, biological secrets, and precise care.`;
    
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: "sonar-pro",
      messages: [
        { role: "system", content: "You are a professional biological researcher." },
        { role: "user", content: query }
      ]
    }, {
      headers: { 
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  },

  async assembleDossier(entity: Entity): Promise<RawDataLake> {
    const query = entity.scientificName || entity.name;
    const sources = [
      { name: "Wikipedia", url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/ /g, '_'))}` },
      { name: "Kew POWO", url: `https://powo.science.kew.org/results?q=${encodeURIComponent(query)}` },
      { name: "Tropica", url: `https://tropica.com/en/search/?q=${encodeURIComponent(query)}` }
    ];

    const results = await Promise.allSettled(sources.map(s => this.scrapeSource(s.url, s.name)));

    return {
      entityId: entity.id,
      scrapedAt: Date.now(),
      sources: results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value.status === 'success')
        .map(r => r.value)
    };
  },

  async scrapeSource(url: string, sourceName: string) {
    try {
      const { data } = await axios.get(url, { timeout: 8000 });
      const $ = cheerio.load(data);
      $('script, style, .navbox, .footer').remove();
      const content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 8000);
      return { url, content, status: 'success' as const, source: sourceName };
    } catch (e) {
      return { url, content: '', status: 'error' as const, source: sourceName };
    }
  },

  getMockData(entity: Entity) {
    return {
      source: 'DIRECT_MATCH',
      description: `Mock description for ${entity.name}`,
      careGuide: 'Mock care guide',
      taxonomy: { kingdom: 'Animalia', family: 'Test' },
      tradeInfo: { tradeName: entity.name },
      overflow: { discovery: { mechanism: 'Mock mechanism' } }
    } as any;
  }
};
