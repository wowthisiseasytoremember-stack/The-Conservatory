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
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxy = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const generative_ai_1 = require("@google/generative-ai");
// Use Gen 2 functions for better performance/concurrency
exports.proxy = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.status(200).send();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    const { model, contents, config, systemInstruction } = req.body;
    // Access environment variable securely
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        logger.error("GEMINI_API_KEY missing");
        res.status(500).json({ error: 'Server misconfiguration' });
        return;
    }
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const modelInstance = genAI.getGenerativeModel({
            model: model || "gemini-1.5-flash",
            systemInstruction: systemInstruction,
        });
        const result = await modelInstance.generateContent({
            contents: Array.isArray(contents) ? contents : [{ role: 'user', parts: [{ text: contents }] }],
            generationConfig: config
        });
        const response = await result.response;
        const text = response.text();
        const candidates = response.candidates;
        res.status(200).json({
            text,
            candidates
        });
    }
    catch (error) {
        logger.error("AI Proxy Error", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});
//# sourceMappingURL=index.js.map