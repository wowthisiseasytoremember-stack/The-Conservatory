
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  try {
    console.log("Testing Gemini with model: gemini-1.5-pro");
    const result = await model.generateContent("Say 'Gemini is online' if you are working.");
    console.log("Gemini Response:", result.response.text());
  } catch (error: any) {
    console.error("Gemini Test Failed:", error.message);
    if (error.message.includes("404") || error.message.includes("not found")) {
      console.log("Note: Trying to list models might require different permissions, but checking model availability...");
    }
  }
}

testGemini();
