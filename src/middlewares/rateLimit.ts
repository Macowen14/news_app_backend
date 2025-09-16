import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import type { Request } from "express";

function keyGenerator(req: Request) {
  const userId = (req as any).user?.uid;
  const ip = req.ip;
  return userId ? `u:${userId}` : `ip:${ip}`;
}

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator
});

export const apiSlowdown = slowDown({
  windowMs: 60_000,
  delayAfter: 30,
  delayMs: (hits) => Math.min(1000, (hits - 30) * 50),
  keyGenerator
});


