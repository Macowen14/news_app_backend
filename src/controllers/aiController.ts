import { Request, Response } from "express";
import { geminiService } from "../services/aiService.js";

export async function aiSearchController(req: Request, res: Response) {
  try {
    const { query } = req.body ?? {};
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    
    // Get user info from auth middleware
    const user = (req as any).user;
    console.log(`🤖 AI search requested by user: ${user?.uid}`, { query });
    
    const result = await geminiService.generateContent(query);
    res.json({ response: result });
  } catch (error: any) {
    console.error("❌ AI search error:", error);
    res.status(500).json({ error: error.message || "AI search failed" });
  }
}