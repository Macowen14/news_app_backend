import { cache } from "../utils/cache.js";
import { fetchGNews, fetchHackerNews } from "./providers/gnews.js";
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

// Mock articles for fallback when APIs are not configured or failing
const getMockArticles = (category: string): NormalizedArticle[] => {
  const mockArticles: NormalizedArticle[] = [
    {
      id: `mock-${category}-1`,
      title: `Latest ${category.charAt(0).toUpperCase() + category.slice(1)} News`,
      description: `This is a mock article for ${category}. Configure your API keys to get real news.`,
      url: "https://example.com",
      source: "Mock Source",
      publishedAt: new Date().toISOString()
    },
    {
      id: `mock-${category}-2`,
      title: `Breaking: ${category.charAt(0).toUpperCase() + category.slice(1)} Update`,
      description: `Another mock article for ${category} category. Set up news API keys in your .env file.`,
      url: "https://example.com",
      source: "Demo News",
      publishedAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: `mock-${category}-3`,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Industry Analysis`,
      description: `Analysis and insights about ${category}. This is placeholder content.`,
      url: "https://example.com",
      source: "Mock Analytics",
      publishedAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    }
  ];
  
  return mockArticles;
};

export async function fetchCategoryNews(category: string): Promise<NormalizedArticle[]> {
  const cacheKey = `news:${category}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log(`📦 Cache hit for ${category}: ${cached.length} articles`);
    return cached as NormalizedArticle[];
  }

  console.log(`🔄 Fetching fresh news for category: ${category}`);
  
  // Check API key availability
  const gnewsAvailable = !!process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY !== 'your_gnews_api_key_here';
  const cryptopanicAvailable = !!process.env.CRYPTOPANIC_TOKEN && process.env.CRYPTOPANIC_TOKEN !== 'your_cryptopanic_token_here';
  const pubmedAvailable = true; // PubMed is usually free
  
  console.log(`🔑 API Keys available - GNews: ${gnewsAvailable}, CryptoPanic: ${cryptopanicAvailable}, PubMed: ${pubmedAvailable}`);
  
  let providers: Array<{ name: string, promise: Promise<NormalizedArticle[]> }> = [];

  switch (category.toLowerCase()) {
    case "crypto":
      if (cryptopanicAvailable) {
        providers.push({ name: "CryptoPanic", promise: fetchCryptoPanic() });
      }
      if (gnewsAvailable) {
        providers.push({ name: "GNews-Crypto", promise: fetchGNews("technology") });
      }
      // Add HackerNews fallback for crypto
      providers.push({ name: "HackerNews", promise: fetchHackerNews() });
      break;
      
    case "nursing":
    case "health":
      if (pubmedAvailable) {
        providers.push({ name: "PubMed", promise: fetchPubMed("nursing OR healthcare") });
      }
      if (gnewsAvailable) {
        providers.push({ name: "GNews-Health", promise: fetchGNews("health") });
      }
      // Add HackerNews fallback for health
      providers.push({ name: "HackerNews", promise: fetchHackerNews() });
      break;
      
    case "finance":
      if (gnewsAvailable) {
        providers.push({ name: "GNews-Business", promise: fetchGNews("business") });
      }
      // Add HackerNews fallback for finance
      providers.push({ name: "HackerNews", promise: fetchHackerNews() });
      break;
      
    case "tech":
    default:
      if (gnewsAvailable) {
        providers.push({ name: "GNews-Tech", promise: fetchGNews("technology") });
      }
      // Always add HackerNews as fallback for tech
      providers.push({ name: "HackerNews", promise: fetchHackerNews() });
  }

  console.log(`🔍 Using ${providers.length} providers for ${category}: ${providers.map(p => p.name).join(', ')}`);

  if (providers.length === 0) {
    console.log(`⚠️ No API providers available for ${category}, returning mock data`);
    const mockData = getMockArticles(category);
    cache.set(cacheKey, mockData, 300_000); // Cache mock data for 5 minutes
    return mockData;
  }

  const results = await Promise.allSettled(providers.map(p => p.promise));
  
  const articles: NormalizedArticle[] = [];
  let successfulProviders = 0;

  results.forEach((result, index) => {
    const providerName = providers[index].name;
    
    if (result.status === "fulfilled") {
      const providerArticles = result.value;
      console.log(`✅ ${providerName} returned ${providerArticles.length} articles`);
      
      // Log sample article for debugging
      if (providerArticles.length > 0) {
        console.log(`📝 Sample from ${providerName}:`, {
          title: providerArticles[0].title?.substring(0, 50) + '...',
          url: providerArticles[0].url,
          source: providerArticles[0].source
        });
      }
      
      articles.push(...providerArticles);
      successfulProviders++;
    } else {
      console.error(`❌ ${providerName} failed:`, result.reason?.message || result.reason);
    }
  });

  // Filter out invalid articles
  const validArticles = articles.filter((article) => {
    const isValid = article && 
                   typeof article.title === 'string' && 
                   article.title.trim().length > 0 &&
                   typeof article.url === 'string' && 
                   article.url.trim().length > 0;
    
    if (!isValid) {
      console.warn(`⚠️ Filtering out invalid article:`, { title: article?.title, url: article?.url });
    }
    
    return isValid;
  });

  console.log(`✅ ${successfulProviders}/${providers.length} providers successful`);
  console.log(`📊 Valid articles before deduplication: ${validArticles.length}`);

  if (validArticles.length === 0) {
    console.log(`⚠️ No valid articles found for ${category}, returning mock data`);
    const mockData = getMockArticles(category);
    cache.set(cacheKey, mockData, 300_000); // Cache mock data for 5 minutes
    return mockData;
  }

  const deduped = dedupeByUrl(validArticles).slice(0, 30);
  console.log(`📊 Final result: ${deduped.length} unique articles for ${category}`);

  // Log final articles for debugging
  if (deduped.length > 0) {
    console.log(`📰 First few articles:`, deduped.slice(0, 3).map(a => ({
      id: a.id,
      title: a.title.substring(0, 50) + '...',
      source: a.source
    })));
  }

  // Cache successful results for 10 minutes, mock data for 5 minutes
  const cacheTime = successfulProviders > 0 ? 600_000 : 300_000;
  cache.set(cacheKey, deduped, cacheTime);
  
  return deduped;
}

function dedupeByUrl(list: NormalizedArticle[]): NormalizedArticle[] {
  const seen = new Set<string>();
  const out: NormalizedArticle[] = [];
  
  for (const article of list) {
    const key = article.url.toLowerCase().trim();
    
    if (!seen.has(key)) {
      seen.add(key);
      out.push(article);
    } else {
      console.log(`🔄 Duplicate URL filtered: ${article.title.substring(0, 30)}...`);
    }
  }
  
  console.log(`🔍 Deduplication: ${list.length} → ${out.length} articles`);
  return out;
}