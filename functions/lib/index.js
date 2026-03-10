"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.perplexityProxy = exports.proxy = exports.enrichEntity = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
// ─── Scraper helpers (Ported from Organism Atlas) ───────────────────────────
async function scrapePage(url, source) {
    try {
        const resp = await axios_1.default.get(url, {
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
    }
    catch (e) {
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
function buildSearchUrls(entityName) {
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
exports.enrichEntity = (0, https_1.onRequest)({ cors: true, secrets: ["GEMINI_API_KEY"] }, async (req, res) => {
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
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
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
        enrichedData.enrichedAt = new Date().toISOString();
        res.status(200).json({ enrichedData, rawDataLake: { entityName, pages: scrapeResults } });
    }
    catch (error) {
        logger.error("Enrichment Error", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});
// Gemini Proxy
exports.proxy = (0, https_1.onRequest)({ cors: true, secrets: ["GEMINI_API_KEY"] }, async (req, res) => {
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
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
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
    }
    catch (error) {
        logger.error("AI Proxy Error", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});
// Perplexity Proxy
exports.perplexityProxy = (0, https_1.onRequest)({ cors: true, secrets: ["PERPLEXITY_API_KEY"] }, async (req, res) => {
    var _a, _b, _c;
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
        const response = await axios_1.default.post('https://api.perplexity.ai/chat/completions', req.body, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        res.status(200).json(response.data);
    }
    catch (error) {
        logger.error("Perplexity Proxy Error", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        res.status(((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500).json(((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || { error: 'Internal Server Error' });
    }
});
//# sourceMappingURL=index.js.map