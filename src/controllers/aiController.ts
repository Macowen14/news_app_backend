import { Request, Response } from "express";
import { aiSearch } from "../services/aiService.js";

export async function aiSearchController(req: Request, res: Response) {
  try {
    const { query } = req.body ?? {};
    const data = await aiSearch(query ?? "");
    res.json(data);
  } catch (_err) {
    res.status(500).json({ error: "AI search failed" });
  }
}


