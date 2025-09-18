import { geminiService } from "../services/geminiService.js";

export async function aiSearchController(req, res) {
  const requestId = Date.now().toString(36);
  
  try {
    console.log(`[${requestId}] 🔍 AI search request received`);
    
    const { query } = req.body ?? {};
    
    // Input validation
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ 
        error: "Query is required and must be a non-empty string",
        requestId 
      });
    }

    if (query.length > 1000) {
      return res.status(400).json({ 
        error: "Query too long. Maximum 1000 characters allowed.",
        requestId 
      });
    }

    // Authentication check
    const user = req.user;
    if (!user) {
      return res.status(401).json({ 
        error: "Authentication required",
        requestId 
      });
    }

    console.log(`[${requestId}] 👤 Authenticated user: ${user.uid}`);

    // Service availability check
    if (!geminiService.isEnabled()) {
      const status = geminiService.getStatus();
      return res.status(503).json({ 
        error: "AI service not configured or unavailable",
        details: status,
        requestId 
      });
    }

    // Process query
    const enhancedQuery = `As a helpful news assistant: ${query}`;
    const startTime = Date.now();
    const result = await geminiService.generateContent(enhancedQuery);
    const duration = Date.now() - startTime;
    
    console.log(`[${requestId}] ✅ AI response generated in ${duration}ms`);
    
    return res.json({ 
      response: result,
      requestId,
      timestamp: new Date().toISOString(),
      processingTime: duration
    });

  } catch (error) {
    console.error(`[${requestId}] 💥 Error in AI controller:`, error);
    
    // Specific error handling
    if (error.message.includes("Authentication required")) {
      return res.status(401).json({ 
        error: "Authentication failed",
        requestId 
      });
    }
    
    if (error.message.includes("not configured") || error.message.includes("disabled")) {
      return res.status(503).json({ 
        error: "AI service unavailable",
        requestId 
      });
    }
    
    return res.status(500).json({ 
      error: "Internal server error",
      requestId 
    });
  }
}

// Health check endpoint for AI service
export async function aiHealthController(req, res) {
  try {
    const status = geminiService.getStatus();
    const isEnabled = geminiService.isEnabled();
    
    const healthInfo = {
      status: isEnabled ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Gemini AI',
      details: status,
      version: '1.5-flash'
    };
    
    const httpStatus = isEnabled ? 200 : 503;
    return res.status(httpStatus).json(healthInfo);
    
  } catch (error) {
    console.error("AI health check error:", error);
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
}