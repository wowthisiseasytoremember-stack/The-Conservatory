import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { model, contents, config, systemInstruction } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
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

    return res.status(200).json({ 
      text,
      candidates
    });
  } catch (error: any) {
    console.error("API Proxy Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
