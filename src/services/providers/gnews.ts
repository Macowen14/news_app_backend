import axios from "axios";
import type { NormalizedArticle } from "../newsService.js";

export async function fetchGNews(category: string): Promise<NormalizedArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];
  try {
    const url = `https://gnews.io/api/v4/top-headlines`;
    const params = { token: apiKey, topic: category, lang: "en", max: 10 } as any;
    const { data } = await axios.get(url, { params });
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    return articles.map((a: any, idx: number) => ({
      id: `gnews-${a.url ?? idx}`,
      title: a.title,
      description: a.description,
      url: a.url,
      imageUrl: a.image,
      source: a.source?.name ?? "GNews",
      publishedAt: a.publishedAt
    }));
  } catch {
    return [];
  }
}


