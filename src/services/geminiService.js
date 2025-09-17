import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  genAI = undefined;
  isConfigured = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set — Gemini disabled");
      this.isConfigured = false;
      return;
    }
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isConfigured = true;
      console.log("Gemini initialized");
    } catch (e) {
      console.error("Gemini init error:", e);
      this.isConfigured = false;
    }
  }

async generateContent(prompt, retries = 2) {
  if (!this.isConfigured || !this.genAI) {
    throw new Error("Gemini service not configured");
  }

  try {
    const model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text(); // <-- Extracts AI text output

    return {
      summary: text,
      links: [],   
      videos: []   
    };
  } catch (err) {
    console.error("Gemini error:", err?.message ?? err);

    const msg = err?.message ?? String(err);

    if (msg.includes("timeout") || msg.includes("timed out")) {
      throw new Error("Gemini request timed out");
    }
    if (msg.includes("quota") || msg.includes("rate limit")) {
      throw new Error("Gemini API quota exceeded or rate limited");
    }
    if (msg.includes("authentication") || msg.includes("API key")) {
      throw new Error("Invalid Gemini API key");
    }

    if (retries > 0) {
      console.log(`Retrying Gemini request (${retries} left)`);
      await new Promise((r) => setTimeout(r, 800));
      return this.generateContent(prompt, retries - 1);
    }

    throw new Error("Gemini API failed: " + msg);
  }
}

  isEnabled() {
    return this.isConfigured;
  }
}

export const geminiService = new GeminiService();
