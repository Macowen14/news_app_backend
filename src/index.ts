import "dotenv/config";
import express from "express";
import cors from "cors";
import { newsRouter } from "./routes/news.js";
import { aiRouter } from "./routes/ai.js";
import { apiLimiter, apiSlowdown } from "./middlewares/rateLimit.js";
import { verifyFirebaseToken } from "./middlewares/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/news", apiSlowdown, apiLimiter, newsRouter);
app.use("/ai", verifyFirebaseToken, apiSlowdown, apiLimiter, aiRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});


