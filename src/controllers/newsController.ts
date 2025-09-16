import { Request, Response } from "express";
import { fetchCategoryNews } from "../services/newsService.js";

export async function getCategoryNewsController(req: Request, res: Response) {
  try {
    const { category } = req.params;
    const data = await fetchCategoryNews(category);
    res.json({ articles: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
}


