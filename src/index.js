import "dotenv/config";
import express from "express";
import cors from "cors";
import { newsRouter } from "./routes/news.js";
import { aiRouter } from "./routes/ai.js";
import { apiLimiter, apiSlowdown } from "./middlewares/rateLimit.js";
import { verifyFirebaseToken } from "./middlewares/auth.js";
import { checkEnvironmentSetup } from "./utils/environmentChecker.js";
import { runNetworkDiagnostics, quickNetworkTest } from "./utils/networkDiagnostics.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

// Logging middleware
app.use((req, _res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// CORS
app.use(cors({ origin: true, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"] }));
app.use(express.json({ limit: "10mb" }));

// Health routes
app.get("/health", (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString(), service: "News API Backend" }));

app.get("/health/full", async (_req, res) => {
  try {
    const [environment, diagnostics] = await Promise.all([checkEnvironmentSetup(), runNetworkDiagnostics()]);
    res.json({ status: "ok", timestamp: new Date().toISOString(), environment, diagnostics });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message, timestamp: new Date().toISOString() });
  }
});

app.get("/health/network", async (_req, res) => {
  try {
    const diagnostics = await runNetworkDiagnostics();
    const connectivityResults = Object.values(diagnostics.connectivity);
    const successRate = connectivityResults.filter(r => r.success).length / connectivityResults.length;
    res.json({ status: successRate > 0.5 ? "degraded" : "offline", successRate: `${Math.round(successRate * 100)}%`, diagnostics });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Routers
app.use("/news", apiSlowdown, apiLimiter, newsRouter);
app.use("/ai", verifyFirebaseToken, apiSlowdown, apiLimiter, aiRouter);

// Error handler
app.use((err, _req, res, _next) => {
  console.error("💥 Global error:", err);
  if (err.code === "ETIMEDOUT") return res.status(504).json({ error: "Gateway timeout" });
  if (err.status === 429) return res.status(429).json({ error: "Rate limit exceeded" });
  res.status(500).json({ error: "Internal server error" });
});

// Startup
async function startServer() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 News API Server Starting`);
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log(`📡 Port: ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`${"=".repeat(60)}`);

  checkEnvironmentSetup();
  const net = await quickNetworkTest();
  console.log(`🌐 Network: ${net.success ? "✅ Connected" : "❌ Disconnected"}`);

  app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${port}`);
    setTimeout(() => runNetworkDiagnostics().catch(console.error), 3000);
  });
}

startServer();
