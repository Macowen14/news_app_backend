import type { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

let initialized = false;

// Initialize Firebase Admin
try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      initialized = true;
      console.log("✅ Firebase Admin SDK initialized successfully");
      console.log(`🔥 Firebase project: ${serviceAccount.project_id}`);
    } else {
      console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT not found, authentication will be disabled");
    }
  } else {
    initialized = true;
    console.log("✅ Firebase Admin SDK already initialized");
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error);
}

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  const requestId = Date.now().toString(36);
  
  try {
    console.log(`🔐 [${requestId}] Auth verification started for ${req.method} ${req.path}`);
    
    if (!initialized) {
      console.error(`❌ [${requestId}] Firebase Admin not initialized`);
      return res.status(500).json({ error: 'Authentication service not available' });
    }

    const authHeader = req.headers.authorization;
    console.log(`🔐 [${requestId}] Auth header present: ${!!authHeader}`);
    
    if (!authHeader) {
      console.log(`❌ [${requestId}] No authorization header`);
      return res.status(401).json({ error: 'No authentication token provided' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log(`❌ [${requestId}] Invalid auth header format: ${authHeader.substring(0, 20)}...`);
      return res.status(401).json({ error: 'Invalid authentication header format' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token || token.length < 10) {
      console.log(`❌ [${requestId}] Invalid token length: ${token?.length || 0}`);
      return res.status(401).json({ error: 'Invalid authentication token format' });
    }

    console.log(`🔐 [${requestId}] Token length: ${token.length}, starts with: ${token.substring(0, 20)}...`);
    
    // Additional token format validation
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log(`❌ [${requestId}] Invalid JWT format - parts: ${tokenParts.length}`);
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const startTime = Date.now();
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token, true); // checkRevoked = true
      const verificationTime = Date.now() - startTime;
      
      console.log(`✅ [${requestId}] Token verified in ${verificationTime}ms for user: ${decodedToken.uid}`);
      console.log(`🔐 [${requestId}] Token info:`, {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        exp: new Date(decodedToken.exp * 1000).toISOString(),
        iat: new Date(decodedToken.iat * 1000).toISOString(),
        aud: decodedToken.aud,
        iss: decodedToken.iss
      });
      
      // Check if token is close to expiry (within 5 minutes)
      const expiryTime = decodedToken.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      
      if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes
        console.warn(`⚠️ [${requestId}] Token expires soon: ${Math.floor(timeUntilExpiry / 1000)}s remaining`);
      }
      
      req.user = decodedToken;
      next();
      
    } catch (verifyError: any) {
      const verificationTime = Date.now() - startTime;
      
      console.error(`❌ [${requestId}] Token verification failed in ${verificationTime}ms:`, {
        code: verifyError.code,
        message: verifyError.message,
        tokenPreview: token.substring(0, 50) + '...'
      });
      
      // Provide specific error messages based on error code
      let errorMessage = 'Invalid authentication token';
      let statusCode = 401;
      
      switch (verifyError.code) {
        case 'auth/id-token-expired':
          errorMessage = 'Authentication token has expired';
          console.log(`🕒 [${requestId}] Token expired`);
          break;
        case 'auth/id-token-revoked':
          errorMessage = 'Authentication token has been revoked';
          console.log(`🚫 [${requestId}] Token revoked`);
          break;
        case 'auth/invalid-id-token':
          errorMessage = 'Invalid authentication token format';
          console.log(`🔍 [${requestId}] Invalid token format`);
          break;
        case 'auth/project-not-found':
          errorMessage = 'Authentication service configuration error';
          statusCode = 500;
          console.log(`🏗️ [${requestId}] Firebase project not found`);
          break;
        case 'auth/insufficient-permission':
          errorMessage = 'Insufficient permissions';
          statusCode = 403;
          console.log(`🔒 [${requestId}] Insufficient permissions`);
          break;
        default:
          console.log(`❓ [${requestId}] Unknown auth error: ${verifyError.code}`);
      }
      
      return res.status(statusCode).json({ 
        error: errorMessage,
        code: verifyError.code,
        requestId 
      });
    }
    
  } catch (error: any) {
    console.error(`💥 [${requestId}] Unexpected auth middleware error:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      error: 'Authentication service error',
      requestId 
    });
  }
};

// Optional: Add a health check for Firebase auth
export const checkFirebaseAuth = async (req: Request, res: Response) => {
  try {
    if (!initialized) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Firebase Admin not initialized' 
      });
    }

    // Try to list users (limited) to test connection
    await admin.auth().listUsers(1);
    
    res.json({ 
      status: 'ok', 
      firebase: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Firebase health check failed:', error.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Firebase connection failed',
      error: error.message 
    });
  }
};