import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SearchResult {
  summary: string;
  links: Array<{
    title: string;
    url: string;
  }>;
  videos: Array<{
    title: string;
    url: string;
  }>;
}

export async function aiSearch(query: string): Promise<SearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { summary: "Enter a query to search.", links: [], videos: [] };
  }

  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY not found, using mock data");
      return getMockSearchResult(trimmed);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create a comprehensive prompt for news-related search
    const prompt = `
You are a news research assistant. Given the search query "${trimmed}", provide:

1. A brief, informative summary (2-3 sentences) about the topic
2. Suggest 5 relevant, real news sources or websites where users could find current information about this topic
3. Suggest 2 relevant video sources (YouTube or news video platforms) related to this topic

Format your response as JSON with this exact structure:
{
  "summary": "Your summary here",
  "links": [
    {"title": "Source Name", "url": "https://example.com"},
    {"title": "Another Source", "url": "https://example2.com"}
  ],
  "videos": [
    {"title": "Video Title", "url": "https://youtube.com/watch?v=example"}
  ]
}

Important:
- Only suggest real, reputable news sources and websites
- For links, focus on major news outlets, official websites, or trusted sources
- For videos, suggest YouTube channels or news video platforms that would likely have content on this topic
- Keep URLs realistic but you don't need to verify they exist
- Make the summary factual and neutral
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    try {
      const parsed = JSON.parse(text);
      
      // Validate the structure
      if (parsed.summary && Array.isArray(parsed.links) && Array.isArray(parsed.videos)) {
        return {
          summary: parsed.summary,
          links: parsed.links.slice(0, 5), // Limit to 5 links
          videos: parsed.videos.slice(0, 3) // Limit to 3 videos
        };
      }
    } catch (parseError) {
      console.error("❌ Failed to parse Gemini response as JSON:", parseError);
    }

    // If parsing fails, create a summary from the response
    return {
      summary: text.substring(0, 300) + (text.length > 300 ? "..." : ""),
      links: getDefaultLinksForQuery(trimmed),
      videos: getDefaultVideosForQuery(trimmed)
    };

  } catch (error: any) {
    console.error("❌ Gemini API error:", error.message);
    
    // Fallback to mock data if API fails
    return getMockSearchResult(trimmed);
  }
}

function getMockSearchResult(query: string): SearchResult {
  return {
    summary: `Here's what I found about "${query}". This is a placeholder response - please configure your GEMINI_API_KEY to get AI-powered search results.`,
    links: [
      { title: "Google News", url: `https://news.google.com/search?q=${encodeURIComponent(query)}` },
      { title: "Reuters", url: `https://www.reuters.com/search/news?blob=${encodeURIComponent(query)}` },
      { title: "BBC News", url: `https://www.bbc.com/search?q=${encodeURIComponent(query)}` },
      { title: "AP News", url: `https://apnews.com/search?q=${encodeURIComponent(query)}` }
    ],
    videos: [
      { title: `${query} - Latest Updates`, url: `https://youtube.com/results?search_query=${encodeURIComponent(query)}` }
    ]
  };
}

function getDefaultLinksForQuery(query: string): Array<{title: string, url: string}> {
  return [
    { title: "Google News", url: `https://news.google.com/search?q=${encodeURIComponent(query)}` },
    { title: "Reuters", url: `https://www.reuters.com/search/news?blob=${encodeURIComponent(query)}` },
    { title: "BBC News", url: `https://www.bbc.com/search?q=${encodeURIComponent(query)}` }
  ];
}

function getDefaultVideosForQuery(query: string): Array<{title: string, url: string}> {
  return [
    { title: `${query} - Video Results`, url: `https://youtube.com/results?search_query=${encodeURIComponent(query)}` }
  ];
}