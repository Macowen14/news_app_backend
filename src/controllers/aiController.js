// src/controllers/aiController.ts
import { geminiService } from "../services/geminiService.js";

export async function aiSearchController(req, res) {
  try {
    const { query } = req.body ?? {};
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Query is required" });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!geminiService.isEnabled()) {
      return res.status(503).json({ error: "AI service not configured" });
    }

    try {
      const text = await geminiService.generateContent(query);
      return res.json({ response: text });
    } catch (aiErr) {
      const msg = aiErr?.message ?? String(aiErr);
      if (msg.includes("timed out") || msg.includes("timed out")) {
        return res.status(504).json({ error: "AI service timeout" });
      }
      if (msg.includes("quota") || msg.includes("rate limited")) {
        return res.status(429).json({ error: "AI quota exceeded" });
      }
      return res.status(500).json({ error: "AI service error", details: msg });
    }
  } catch (err) {
    console.error("aiSearchController unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
