
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenAI } from "@google/genai";

// Use Gen 2 functions for better performance/concurrency
export const proxy = onRequest({ cors: true }, async (req, res) => {
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
    const genAI = new GoogleGenAI({ apiKey });
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
    const candidates = (response as any).candidates;

    res.status(200).json({ 
      text,
      candidates
    });
  } catch (error: any) {
    logger.error("AI Proxy Error", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
