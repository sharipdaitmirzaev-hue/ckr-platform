import {
  LIA_RATE_LIMIT_MAX,
  LIA_RATE_LIMIT_WINDOW_MS,
} from "@/config/lia";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkLiaRateLimit(userId: string): {
  allowed: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const current = buckets.get(userId);

  if (!current || now >= current.resetAt) {
    buckets.set(userId, {
      count: 1,
      resetAt: now + LIA_RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (current.count >= LIA_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  buckets.set(userId, current);
  return { allowed: true, retryAfterSec: 0 };
}
