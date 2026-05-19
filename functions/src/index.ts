import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

// ─── Scraper helpers (Ported from Organism Atlas) ───────────────────────────

async function scrapePage(url: string, source: string): Promise<{
  source: string;
  url: string;
  content: string;
  scrapedAt: string;
  success: boolean;
  error?: string;
}> {
  try {
    const resp = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BotanicaResearch/1.0)" },
      timeout: 15000,
    });
    
    const html = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);

    // Strip HTML tags for a rough plain-text extraction
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000); // limit context size
      
    return { source, url, content: text, scrapedAt: new Date().toISOString(), success: true };
  } catch (e: any) {
    return {
      source,
      url,
      content: "",
      scrapedAt: new Date().toISOString(),
      success: false,
      error: e.message || "Unknown error",
    };
  }
}

function buildSearchUrls(entityName: string) {
  const encoded = encodeURIComponent(entityName);
  return [
    { source: "Wikipedia", url: `https://en.wikipedia.org/wiki/${encoded.replace(/%20/g, "_")}` },
    { source: "Aquasabi", url: `https://www.aquasabi.com/search?sSearch=${encoded}` },
    { source: "Flowgrow", url: `https://www.flowgrow.de/db/wasserpflanzen/${encoded.toLowerCase().replace(/%20/g, "-")}` },
    { source: "Tropica", url: `https://tropica.com/en/search/?q=${encoded}` },
  ];
}

const SYNTHESIS_PROMPT = `You are a world-class aquatic botanist and taxonomist at a Royal Botanical Garden. 
You are given raw scraped data about an aquatic organism or a specific cultivar (e.g., 'Anubias nana Pinto').

Your task: Synthesize this data into a structured JSON object. 
Be accurate, scientific, and eloquent. Focus on the STORY of the specimen—its origin, 
how a cultivar was stabilized, and its unique ancestral history.

Return ONLY valid JSON matching this schema:
{
  "taxonomy": {
    "kingdom": "string",
    "family": "string",
    "genus": "string",
    "species": "string"
  },
  "tradeInfo": {
    "tradeName": "string",
    "cultivar": "string or null",
    "originRegion": "string"
  },
  "description": "string (2-3 sentences, eloquent museum-style prose connecting it to its wild origins)",
  "careGuide": "string (Detailed care narrative, focusing on mimicking natural conditions)",
  "funFacts": ["string"],
  "source": "DIRECT_MATCH|GENUS_FALLBACK|NONE",
  "confidence": 0.0-1.0
}`;

// ─── Firebase Functions ───────────────────────────────────────────────────

export const enrichEntity = onRequest({ cors: true, secrets: ["GEMINI_API_KEY"] }, async (req: any, res: any) => {
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  const { entityName } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!entityName) {
    res.status(400).json({ error: "entityName is required" });
    return;
  }

  if (!apiKey) {
    logger.error("GEMINI_API_KEY missing");
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  try {
    logger.info(`[enrichEntity] Starting deep research for: ${entityName}`);

    // Step 1: Multi-source Scrape
    const urls = buildSearchUrls(entityName);
    const scrapeResults = await Promise.all(urls.map((u) => scrapePage(u.url, u.source)));
    const successfulPages = scrapeResults.filter((p) => p.success);
    
    logger.info(`[enrichEntity] Scraped ${successfulPages.length}/${urls.length} pages`);

    const scrapedContext = successfulPages
      .map((p) => `--- SOURCE: ${p.source} (${p.url}) ---\n${p.content}`)
      .join("\n\n");

    // Step 2: AI Synthesis
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const userMessage = scrapedContext
      ? `Organism/Cultivar: "${entityName}"\n\nRaw scraped data:\n\n${scrapedContext}`
      : `Organism/Cultivar: "${entityName}"\n\nNo scraped data available. Use your knowledge to provide a high-fidelity museum-style dossier.`;

    const result = await model.generateContent([
      { text: SYNTHESIS_PROMPT },
      { text: userMessage }
    ]);

    const enrichedData = JSON.parse(result.response.text());
    (enrichedData as any).enrichedAt = new Date().toISOString();

    res.status(200).json({ enrichedData, rawDataLake: { entityName, pages: scrapeResults } });
  } catch (error: any) {
    logger.error("Enrichment Error", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Gemini Proxy
export const proxy = onRequest({ cors: true, secrets: ["GEMINI_API_KEY"] }, async (req: any, res: any) => {
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { model, contents, config, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.error("GEMINI_API_KEY missing");
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelInstance = genAI.getGenerativeModel({ 
      model: model || "gemini-pro-latest",
      systemInstruction: systemInstruction,
    });

    const result = await modelInstance.generateContent({
      contents: Array.isArray(contents) ? contents : [{ role: 'user', parts: [{ text: contents }] }],
      generationConfig: config
    });
    
    const response = await result.response;
    res.status(200).json({ 
      text: response.text(),
      candidates: response.candidates || []
    });
  } catch (error: any) {
    logger.error("AI Proxy Error", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Perplexity Proxy
export const perplexityProxy = onRequest({ cors: true, secrets: ["PERPLEXITY_API_KEY"] }, async (req: any, res: any) => {
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    logger.error("PERPLEXITY_API_KEY missing");
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', req.body, {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    logger.error("Perplexity Proxy Error", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
  }
});
