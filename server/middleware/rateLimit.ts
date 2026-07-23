import {
  createError,
  defineEventHandler,
  getRequestIP,
  getRequestURL,
  type H3Event,
  setHeader
} from "h3";
import { getPositiveIntegerEnv } from "../utils/env";

type RateLimitRule = {
  name: string;
  max: number;
  windowMs: number;
  matches: (path: string) => boolean;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rules: RateLimitRule[] = [
  {
    name: "auth",
    max: getPositiveIntegerEnv("RATE_LIMIT_AUTH_MAX", 30),
    windowMs: getPositiveIntegerEnv("RATE_LIMIT_AUTH_WINDOW_MS", 60_000),
    matches: (path) => path.startsWith("/api/auth")
  },
  {
    name: "upload",
    max: getPositiveIntegerEnv("RATE_LIMIT_UPLOAD_MAX", 20),
    windowMs: getPositiveIntegerEnv("RATE_LIMIT_UPLOAD_WINDOW_MS", 60_000),
    matches: (path) =>
      path.startsWith("/api/admin/upload") ||
      path.startsWith("/api/public/upload")
  },
  {
    name: "cart_order",
    max: getPositiveIntegerEnv("RATE_LIMIT_CART_ORDER_MAX", 120),
    windowMs: getPositiveIntegerEnv("RATE_LIMIT_CART_ORDER_WINDOW_MS", 60_000),
    matches: (path) =>
      path.startsWith("/api/public/cart") ||
      path.startsWith("/api/public/orders") ||
      path.startsWith("/api/admin/orders")
  }
];

function getClientKey(event: H3Event) {
  return getRequestIP(event, {
    xForwardedFor: process.env.RATE_LIMIT_TRUST_PROXY === "true"
  }) ?? "unknown";
}

async function getRateLimitBucket(key: string, now: number) {
  const bucket = await useStorage("rate-limit").getItem<RateLimitBucket>(key);

  return bucket && bucket.resetAt > now ? bucket : null;
}

async function setRateLimitBucket(key: string, bucket: RateLimitBucket, windowMs: number) {
  await useStorage("rate-limit").setItem(key, bucket, {
    ttl: Math.ceil(windowMs / 1000)
  });
}

export default defineEventHandler(async (event) => {
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return;
  }

  const path = getRequestURL(event).pathname;
  const rule = rules.find((candidate) => candidate.matches(path));

  if (!rule) {
    return;
  }

  const now = Date.now();
  const key = `${rule.name}:${getClientKey(event)}`;
  const bucket = await getRateLimitBucket(key, now) ?? {
    count: 0,
    resetAt: now + rule.windowMs
  };

  bucket.count += 1;
  await setRateLimitBucket(key, bucket, rule.windowMs);

  const remaining = Math.max(rule.max - bucket.count, 0);
  const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

  setHeader(event, "X-RateLimit-Limit", String(rule.max));
  setHeader(event, "X-RateLimit-Remaining", String(remaining));
  setHeader(event, "X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > rule.max) {
    setHeader(event, "Retry-After", resetSeconds);

    throw createError({
      statusCode: 429,
      message: "Слишком много запросов, попробуйте позже"
    });
  }
});
