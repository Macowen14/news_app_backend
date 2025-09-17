import "dotenv/config";
import express from "express";
import cors from "cors";
import { newsRouter } from "./routes/news.js";
import { aiRouter } from "./routes/ai.js";
import { apiLimiter, apiSlowdown } from "./middlewares/rateLimit.js";
import { verifyFirebaseToken } from "./middlewares/auth.js";

const app = express();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  console.log("🏥 Health check requested");
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use("/news", apiSlowdown, apiLimiter, newsRouter);
app.use("/ai", verifyFirebaseToken, apiSlowdown, apiLimiter, aiRouter);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("💥 Global error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`🚀 API listening on http://localhost:${port}`);
  console.log(`📱 CORS enabled for Expo dev servers`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});


