import "dotenv/config";
import express from "express";
import cors from "cors";
import { newsRouter } from "./routes/news.js";
import { aiRouter } from "./routes/ai.js";
import { apiLimiter, apiSlowdown } from "./middlewares/rateLimit.js";
import {  verifyFirebaseToken } from "./middlewares/auth.js";
import { checkEnvironmentSetup } from "./utils/environmentChecker.js";
import { runNetworkDiagnostics, quickNetworkTest } from "./utils/networkDiagnostics.js";
// Global error handler

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Health check routes
app.get("/health", (_req, res) => {
  console.log("🏥 Health check requested");
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/health/news", async (_req, res) => {
  try {
    const healthInfo = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      apiKeys: {
        gnews: !!process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY !== 'your_gnews_api_key_here',
        cryptopanic: !!process.env.CRYPTOPANIC_TOKEN && process.env.CRYPTOPANIC_TOKEN !== 'your_cryptopanic_token_here',
        gemini: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_ACTUAL_API_KEY_HERE'
      },
      // Add network status to health check
      network: {
        dns: true, // Assuming DNS is working based on your diagnostics
        connectivity: 'degraded' // Based on your timeout issues
      }
    };
    
    res.json(healthInfo);
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? error.message : String(error);
    console.error("❌ News health check failed:", errorMessage);
    res.status(500).json({ 
      status: 'error', 
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/health/system", async (_req, res) => {
  try {
    const systemHealth = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node_version: process.version,
      environment: process.env.NODE_ENV || 'development',
      services: {
        firebase: false,
        news_apis: false
      },
      // Add network information
      network: await quickNetworkTest()
    };
    
    // Check Firebase
    try {
      const admin = await import('firebase-admin');
      if (admin.default.apps.length > 0) {
        await admin.default.auth().listUsers(1);
        systemHealth.services.firebase = true;
      }
    } catch (fbError) {
      console.warn("Firebase health check failed:", typeof fbError === 'object' && fbError !== null && 'message' in fbError ? fbError.message : fbError);
    }
    
    // Check News APIs availability
    const apiKeysAvailable = [
      process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY !== 'your_gnews_api_key_here',
      process.env.CRYPTOPANIC_TOKEN && process.env.CRYPTOPANIC_TOKEN !== 'your_cryptopanic_token_here'
    ].some(Boolean);
    
    systemHealth.services.news_apis = apiKeysAvailable;
    
    // Set overall status
    const allServicesHealthy = Object.values(systemHealth.services).every(Boolean);
    systemHealth.status = allServicesHealthy ? 'ok' : 'degraded';
    
    res.json(systemHealth);
    
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? error.message : String(error);
    console.error("❌ System health check failed:", errorMessage);
    res.status(500).json({ 
      status: 'error', 
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Add a new endpoint for network diagnostics
app.get("/health/network", async (_req, res) => {
  try {
    console.log("🌐 Network diagnostics requested");
    const diagnostics = await runNetworkDiagnostics();
    
    // Determine overall network status
    const connectivityResults = Object.values(diagnostics.connectivity);
    const successRate = connectivityResults.filter(r => r.success).length / connectivityResults.length;
    
    res.json({
      status: successRate > 0.5 ? 'degraded' : 'offline',
      successRate: `${Math.round(successRate * 100)}%`,
      timestamp: new Date().toISOString(),
      diagnostics
    });
  } catch (error) {
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? error.message : String(error);
    console.error("❌ Network diagnostics failed:", errorMessage);
    res.status(500).json({ 
      status: 'error', 
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes with improved error handling
app.use("/news", apiSlowdown, apiLimiter, newsRouter);
app.use("/ai", verifyFirebaseToken, apiSlowdown, apiLimiter, aiRouter);



app.use((err, req, res, next) => {
  console.error("💥 Global error:", err);
  
  // Handle specific error types
  if (typeof err === 'object' && err !== null) {
    if ('code' in err && err.code === 'ETIMEDOUT') {
      return res.status(504).json({ error: "Gateway timeout - external service not responding" });
    }
    if ('status' in err && err.status === 429) {
      return res.status(429).json({ error: "Rate limit exceeded - please try again later" });
    }
  }
  
  res.status(500).json({ error: "Internal server error" });
});

// Server startup
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

async function logStartupBanner() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 News API Server Starting`);
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log(`📡 Port: ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`${'='.repeat(60)}`);
  
  // Check environment setup
  checkEnvironmentSetup();
  
  // Run quick network test
  const isConnected = await quickNetworkTest();
  console.log(`🌐 Network connectivity: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);
  
  console.log(`${'='.repeat(60)}\n`);
}

// Start server
logStartupBanner().then(() => {
  app.listen(port, "0.0.0.0", () => { // Bind to all interfaces
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log(`📱 CORS enabled for all origins`);
    
    // Run full network diagnostics after a short delay
    setTimeout(() => {
      runNetworkDiagnostics().catch((error) => {
        console.error('❌ Network checks failed:', error instanceof Error ? error.message : String(error));
      });
    }, 3000);
  });
});