import axios from "axios";
import type { NormalizedArticle } from "../newsService.js";

// Create optimized axios instance for GNews
const gnewsClient = axios.create({
  timeout: 12000,
  headers: {
    'User-Agent': 'NewsApp/1.0',
    'Accept': 'application/json'
  },
  validateStatus: (status) => status < 500
});

export async function fetchGNews(category: string): Promise<NormalizedArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  
  if (!apiKey || apiKey === 'your_gnews_api_key_here') {
    console.log(`⚠️ GNews API key not configured`);
    return [];
  }

  try {
    console.log(`🔍 Fetching GNews for category: ${category}`);
    
    const params = { 
      token: apiKey, 
      topic: category, 
      lang: "en", 
      max: 10,
      country: "us"
    };
    
    const response = await gnewsClient.get('https://gnews.io/api/v4/top-headlines', { params });
    
    console.log(`📡 GNews response: ${response.status}`);
    
    // Handle different response scenarios
    if (response.status !== 200) {
      console.error(`❌ GNews API returned status: ${response.status}`);
      return [];
    }
    
    const { data } = response;
    
    if (!data || typeof data !== 'object') {
      console.error(`❌ GNews: Invalid response format`);
      return [];
    }
    
    // Check for API errors
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      console.error(`❌ GNews API errors:`, data.errors);
      return [];
    }
    
    // Define the expected GNews article structure
    interface GNewsArticle {
      title: string;
      description?: string;
      content?: string;
      url: string;
      image?: string;
      source?: { name?: string } | string;
      publishedAt?: string;
    }

    const articles: GNewsArticle[] = Array.isArray(data.articles) ? data.articles : [];
    console.log(`📰 GNews returned ${articles.length} articles`);
    
    if (articles.length === 0) {
      console.log(`⚠️ GNews: No articles available for ${category}`);
      return [];
    }
    
    // Process and normalize articles
    const normalizedArticles = articles
      .filter((article: GNewsArticle) => 
        article && 
        typeof article === 'object' &&
        article.title && 
        article.url && 
        typeof article.title === 'string' &&
        typeof article.url === 'string' &&
        article.title.trim().length > 0 &&
        article.url.trim().length > 0
      )
      .map((article: GNewsArticle, idx: number) => ({
        id: `gnews-${Buffer.from(article.url).toString('base64').slice(0, 10)}-${idx}`,
        title: article.title.trim(),
        description: article.description || article.content || undefined,
        url: article.url,
        imageUrl: article.image || undefined,
        source: typeof article.source === 'object' ? article.source?.name || "GNews" : article.source || "GNews",
        publishedAt: article.publishedAt || new Date().toISOString()
      }));
    
    console.log(`✅ GNews: Processed ${normalizedArticles.length} valid articles`);
    return normalizedArticles;
    
  } catch (error) {
    // Enhanced error handling with specific network issue detection
    const err = error as any;
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      console.error(`🌐 GNews: DNS resolution failed - check internet connectivity`);
    } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      console.error(`⏱️ GNews: Request timeout - network may be slow or blocked`);
    } else if (err.code === 'ECONNREFUSED') {
      console.error(`🚫 GNews: Connection refused - check firewall settings`);
    } else if (err.response?.status === 401) {
      console.error(`🔑 GNews: Invalid API key`);
    } else if (err.response?.status === 403) {
      console.error(`🚨 GNews: Access forbidden - check API key permissions`);
    } else if (err.response?.status === 429) {
      console.error(`⏰ GNews: Rate limit exceeded`);
    } else {
      console.error(`❌ GNews: Unknown error - ${err.message}`);
    }
    
    return [];
  }
}

// Alternative news source as fallback
export async function fetchHackerNews(): Promise<NormalizedArticle[]> {
  try {
    console.log(`🔄 Fetching HackerNews as fallback...`);
    
    const topStoriesResponse = await axios.get(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { timeout: 8000 }
    );
    
    const topStoryIds = topStoriesResponse.data.slice(0, 5);
    const articles: NormalizedArticle[] = [];
    
    for (const storyId of topStoryIds) {
      try {
        const storyResponse = await axios.get(
          `https://hacker-news.firebaseio.com/v0/item/${storyId}.json`,
          { timeout: 3000 }
        );
        
        const story = storyResponse.data;
        
        if (story && story.title && story.url && story.type === 'story') {
          articles.push({
            id: `hn-${story.id}`,
            title: story.title,
            description: `Score: ${story.score || 0} | Comments: ${story.descendants || 0}`,
            url: story.url,
            source: "Hacker News",
            publishedAt: new Date(story.time * 1000).toISOString()
          });
        }
      } catch (storyError) {
        // Silently skip failed stories
        continue;
      }
    }
    
    console.log(`✅ HackerNews: Retrieved ${articles.length} articles`);
    return articles;
    
  } catch (error) {
    const err = error as { message?: string };
    console.error(`❌ HackerNews fallback failed:`, err.message || error);
    return [];
  }
}