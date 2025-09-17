// src/middleware/authMiddleware.ts
import admin from "firebase-admin";

// Removed TypeScript-specific global declaration for Express.Request

let initialized = false;
try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      initialized = true;
      console.log("Firebase Admin initialized");
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT missing — auth disabled");
    }
  } else {
    initialized = true;
  }
} catch (e) {
  console.error("Firebase Admin init failed:", e);
  initialized = false;
}

export const verifyFirebaseToken = async (req, res, next) => {
  const requestId = Date.now().toString(36);
  try {
    if (!initialized) {
      console.error(`[${requestId}] Firebase Admin not initialized`);
      return res.status(503).json({ error: "Authentication service not available" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Empty token" });

    // Basic token shape check
    const parts = token.split(".");
    if (parts.length !== 3) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const start = Date.now();
    try {
      const decoded = await admin.auth().verifyIdToken(token, true); // checkRevoked true
      const verifyMs = Date.now() - start;
      console.log(`[${requestId}] token verified (${verifyMs}ms) for uid=${decoded.uid}`);
      req.user = decoded;
      return next();
    } catch (verifyErr) {
      // Translate firebase admin errors to appropriate HTTP codes
      let status = 401;
      let message = "Invalid authentication token";

      if (verifyErr.code === "auth/id-token-expired") {
        message = "Authentication token has expired";
      } else if (verifyErr.code === "auth/id-token-revoked") {
        message = "Authentication token has been revoked";
      } else if (verifyErr.code === "auth/project-not-found") {
        status = 503;
        message = "Authentication service configuration error";
      }

      console.error(`[${requestId}] Token verification failed:`, verifyErr.code || verifyErr.message);
      return res.status(status).json({ error: message, code: verifyErr.code });
    }
  } catch (e) {
    console.error(`[${requestId}] Unexpected auth middleware error:`, e);
    return res.status(500).json({ error: "Authentication middleware error" });
  }
};
