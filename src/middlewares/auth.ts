import type { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

let initialized = false;
try {
  if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(creds) });
    initialized = true;
  }
} catch {
  initialized = false;
}

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  if (!initialized) return next();
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}


