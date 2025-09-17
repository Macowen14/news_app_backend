// Create test-gemini.js in your backend directory
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGeminiAPI() {
  console.log("🧪 Testing Gemini API...");
  console.log("📁 Current directory:", process.cwd());
  console.log("🔑 API Key present:", !!process.env.GEMINI_API_KEY);
  console.log("🔑 API Key length:", process.env.GEMINI_API_KEY?.length || 0);
  console.log("🔑 API Key starts with AIza:", process.env.GEMINI_API_KEY?.startsWith('AIza') || false);
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in environment");
    console.error("💡 Make sure you have a .env file in your backend directory with:");
    console.error("   GEMINI_API_KEY=your_actual_key_here");
    return;
  }

  if (process.env.GEMINI_API_KEY.length < 20) {
    console.error("❌ GEMINI_API_KEY seems too short - it should be around 39 characters");
    return;
  }

  try {
    console.log("🤖 Initializing Gemini AI...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log("📤 Sending test request...");
    const result = await model.generateContent('Say hello and confirm the API is working');
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ Gemini API working perfectly!");
    console.log("📥 Response:", text);
    console.log("\n🎉 You can now use AI search in your app!");
    
  } catch (error) {
    console.error("❌ Gemini API error:", error.message);
    console.error("📊 Error details:", error);
    
    if (error.message.includes('API key')) {
      console.error("\n🚨 API Key Issues - Try these solutions:");
      console.error("1. Get a new API key from: https://aistudio.google.com/app/apikey");
      console.error("2. Make sure you're using a Gemini API key (not Google Cloud)");
      console.error("3. Check that the key starts with 'AIza'");
      console.error("4. Ensure no extra spaces or quotes in your .env file");
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      console.error("\n📊 Quota Issues:");
      console.error("1. Check your usage at: https://aistudio.google.com/app/apikey");
      console.error("2. Wait a few minutes and try again");
      console.error("3. Consider upgrading your quota if needed");
    }
  }
}

testGeminiAPI();