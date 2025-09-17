import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI!: GoogleGenerativeAI;
  private isConfigured = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_ACTUAL_API_KEY_HERE') {
      console.warn("⚠️ GEMINI_API_KEY not configured properly");
      this.isConfigured = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isConfigured = true;
      console.log("✅ Gemini service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Gemini service:", error);
      this.isConfigured = false;
    }
  }

  async generateContent(prompt: string, retries = 2): Promise<string> {
    if (!this.isConfigured) {
      throw new Error("Gemini service not configured - check your GEMINI_API_KEY");
    }

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
      
    } catch (error: any) {
      console.error("❌ Gemini API error:", error);
      
      // Handle specific Gemini errors
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        throw new Error("Invalid Gemini API key - check your configuration");
      }
      
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error("API quota exceeded - try again later");
      }
      
      // Retry logic for network issues
      if (retries > 0) {
        console.log(`🔄 Retrying Gemini request, attempts left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.generateContent(prompt, retries - 1);
      }
      
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }

  isEnabled(): boolean {
    return this.isConfigured;
  }
}

export const geminiService = new GeminiService();