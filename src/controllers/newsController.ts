import { Request, Response } from "express";
import { fetchCategoryNews } from "../services/newsService.js";

export async function getCategoryNewsController(req: Request, res: Response) {
  const startTime = Date.now();
  const { category } = req.params;
  
  try {
    console.log(`📰 News request for category: ${category} at ${new Date().toISOString()}`);
    
    // Validate category
    const validCategories = ['tech', 'crypto', 'health', 'nursing', 'finance', 'business'];
    if (!validCategories.includes(category.toLowerCase())) {
      console.log(`⚠️ Invalid category requested: ${category}`);
    }
    
    const data = await fetchCategoryNews(category);
    const duration = Date.now() - startTime;
    
    console.log(`📊 News controller summary for ${category}:`, {
      articlesCount: data.length,
      duration: `${duration}ms`,
      hasArticles: data.length > 0,
      firstArticleTitle: data[0]?.title?.substring(0, 50) + '...' || 'None',
      sources: [...new Set(data.map(a => a.source))].join(', ')
    });
    
    // Validate response data
    const validArticles = data.filter(article => {
      const isValid = article && 
                     typeof article.id === 'string' && 
                     typeof article.title === 'string' && 
                     typeof article.url === 'string';
      
      if (!isValid) {
        console.error(`❌ Invalid article in response:`, article);
      }
      
      return isValid;
    });
    
    if (validArticles.length !== data.length) {
      console.warn(`⚠️ Filtered ${data.length - validArticles.length} invalid articles`);
    }
    
    const response = {
      articles: validArticles,
      meta: {
        category,
        count: validArticles.length,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        success: true
      }
    };
    
    console.log(`✅ Sending response for ${category}: ${validArticles.length} articles`);
    
    // Set cache headers
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': `"${category}-${validArticles.length}-${Date.now()}"`
    });
    
    res.json(response);
    
  } catch (err: any) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ News controller error for ${category}:`, {
      message: err.message,
      stack: err.stack,
      duration: `${duration}ms`
    });
    
    // Send structured error response
    res.status(500).json({ 
      error: "Failed to fetch news",
      details: err.message,
      category,
      timestamp: new Date().toISOString(),
      success: false
    });
  }
}