import { Request, Response } from "express";
import { fetchCategoryNews } from "../services/newsService.js";

export async function getCategoryNewsController(req: Request, res: Response) {
  try {
    const { category } = req.params;
    console.log(`📰 News request for category: ${category}`);
    
    const data = await fetchCategoryNews(category);
    console.log(`📰 Returning ${data.length} articles for ${category}`);
    
    res.json({ articles: data });
  } catch (err: any) {
    console.error(`❌ News controller error for ${req.params.category}:`, err.message);
    res.status(500).json({ error: "Failed to fetch news", details: err.message });
  }
}


