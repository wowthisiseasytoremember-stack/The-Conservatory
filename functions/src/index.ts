import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

// Gemini Proxy
export const proxy = onRequest({ cors: true, secrets: ["GEMINI_API_KEY"] }, async (req, res) => {
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
export const perplexityProxy = onRequest({ cors: true, secrets: ["PERPLEXITY_API_KEY"] }, async (req, res) => {
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
