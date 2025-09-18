import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  constructor() {
    this.genAI = null;
    this.isConfigured = false;
    this.apiKey = process.env.GEMINI_API_KEY?.trim();
    this.initializeService();
  }

  initializeService() {
    if (!this.apiKey) {
      console.warn("⚠️ GEMINI_API_KEY not set — Gemini disabled");
      this.isConfigured = false;
      return;
    }

    if (!this.apiKey.startsWith('AIza')) {
      console.error("❌ Invalid Gemini API key format. Key should start with 'AIza'");
      this.isConfigured = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.isConfigured = true;
      console.log("✅ Gemini initialized successfully");
      
      // Test connection asynchronously to not block startup
      setTimeout(() => this.testConnection(), 1000);
    } catch (error) {
      console.error("❌ Gemini initialization error:", error.message);
      this.isConfigured = false;
    }
  }

  async testConnection() {
    if (!this.isConfigured) return;

    try {
      console.log("🔍 Testing Gemini API connection...");
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Test connection");
      console.log("✅ Gemini API connection test successful");
      return true;
    } catch (error) {
      console.error("❌ Gemini API connection test failed:", error.message);
      
      if (error.message.includes("API_KEY_INVALID") || error.message.includes("401")) {
        console.error("🔑 Invalid API key detected - disabling Gemini service");
        this.isConfigured = false;
      }
      
      return false;
    }
  }

  async generateContent(prompt, retries = 2) {
    if (!this.isConfigured) {
      throw new Error("Gemini service not configured or disabled");
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error("Invalid prompt provided");
    }

    const requestId = Date.now().toString(36);
    console.log(`[${requestId}] 🤖 Generating content for prompt: "${prompt.substring(0, 50)}..."`);

    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      });

      const startTime = Date.now();
      const result = await model.generateContent(prompt);
      const duration = Date.now() - startTime;

      console.log(`[${requestId}] ✅ Content generated in ${duration}ms`);

      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from Gemini API");
      }

      return {
        summary: text.trim(),
        links: [],
        videos: [],
        metadata: {
          model: "gemini-1.5-flash",
          duration,
          requestId,
          timestamp: new Date().toISOString(),
        }
      };

    } catch (error) {
      console.error(`[${requestId}] ❌ Gemini error:`, error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle specific error cases
      if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("invalid API key")) {
        console.error(`[${requestId}] 🔑 Invalid API key detected`);
        this.isConfigured = false; // Disable service
        throw new Error("Invalid Gemini API key - please check your configuration");
      }

      if (errorMessage.includes("PERMISSION_DENIED")) {
        throw new Error("Permission denied - check API key permissions and billing");
      }

      if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
        throw new Error("Gemini API quota exceeded or rate limited");
      }

      if (errorMessage.includes("timeout") || errorMessage.includes("DEADLINE_EXCEEDED")) {
        throw new Error("Gemini request timed out");
      }

      if (errorMessage.includes("UNAVAILABLE") || errorMessage.includes("503")) {
        throw new Error("Gemini service temporarily unavailable");
      }

      // Retry logic for transient errors
      if (retries > 0 && this.shouldRetry(errorMessage)) {
        const delay = Math.min(1000 * (3 - retries), 2000); // Exponential backoff
        console.log(`[${requestId}] 🔄 Retrying in ${delay}ms (${retries} retries left)`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.generateContent(prompt, retries - 1);
      }

      throw new Error(`Gemini API failed: ${errorMessage}`);
    }
  }

  shouldRetry(errorMessage){
    const retryableErrors = [
      'timeout',
      'DEADLINE_EXCEEDED',
      'UNAVAILABLE',
      'INTERNAL',
      'network',
      'connection'
    ];
    
    return retryableErrors.some(error => 
      errorMessage.toLowerCase().includes(error.toLowerCase())
    );
  }

  isEnabled(){
    return this.isConfigured && !!this.genAI;
  }

  getStatus() {
    return {
      configured: this.isConfigured,
      apiKeyPresent: !!this.apiKey,
      apiKeyValid: this.apiKey?.startsWith('AIza') ?? false,
    };
  }

  // Method to reinitialize if needed
  reinitialize() {
    console.log("🔄 Reinitializing Gemini service...");
    this.initializeService();
  }
}

export const geminiService = new GeminiService();