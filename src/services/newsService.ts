import { cache } from "../utils/cache.js";
import { fetchGNews } from "./providers/gnews.js";
import { fetchCryptoPanic } from "./providers/cryptopanic.js";
import { fetchPubMed } from "./providers/pubmed.js";

export type NormalizedArticle = {
  id: string;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  source?: string;
  publishedAt?: string;
};

export async function fetchCategoryNews(category: string): Promise<NormalizedArticle[]> {
  const cacheKey = `news:${category}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit for ${category}: ${cached.length} articles`);
    return cached as NormalizedArticle[];
  }

  console.log(`🔄 Fetching fresh news for category: ${category}`);
  let providers: Promise<NormalizedArticle[]>[] = [];
  
  switch (category.toLowerCase()) {
    case "crypto":
      providers = [fetchCryptoPanic(), fetchGNews("technology")];
      break;
    case "nursing":
    case "health":
      providers = [fetchPubMed("nursing OR healthcare"), fetchGNews("health")];
      break;
    case "finance":
      providers = [fetchGNews("business")];
      break;
    case "tech":
    default:
      providers = [fetchGNews("technology")];
  }

  console.log(`🔍 Using ${providers.length} providers for ${category}`);
  const results = await Promise.allSettled(providers);
  
  const articles = results
    .flatMap((r, index) => {
      if (r.status === "fulfilled") {
        console.log(`✅ Provider ${index + 1} returned ${r.value.length} articles`);
        return r.value;
      } else {
        console.error(`❌ Provider ${index + 1} failed:`, r.reason);
        return [];
      }
    })
    .filter((a) => a && a.title && a.url);

  const deduped = dedupeByUrl(articles).slice(0, 30);
  console.log(`📊 Final result: ${deduped.length} unique articles for ${category}`);
  
  cache.set(cacheKey, deduped, 60_000);
  return deduped;
}

function dedupeByUrl(list: NormalizedArticle[]) {
  const seen = new Set<string>();
  const out: NormalizedArticle[] = [];
  for (const a of list) {
    const key = a.url;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(a);
    }
  }
  return out;
}


