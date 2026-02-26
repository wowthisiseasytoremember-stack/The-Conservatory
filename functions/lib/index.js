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
exports.perplexityProxy = exports.proxy = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
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