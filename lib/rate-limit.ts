import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstashEnv = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

export const redis = hasUpstashEnv ? Redis.fromEnv() : null;

type LimitResult = Awaited<ReturnType<Ratelimit["limit"]>>;
type RatelimitLike = Pick<Ratelimit, "limit">;

export const ratelimit: RatelimitLike = hasUpstashEnv
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, "1 m"),
      analytics: true,
      prefix: "rate-limit",
    })
  : {
      // Local/dev fallback when Upstash isn't configured.
      // Keeps builds/tests clean and avoids noisy runtime warnings.
      async limit(): Promise<LimitResult> {
        const now = Date.now();
        return {
          success: true,
          limit: Number.MAX_SAFE_INTEGER,
          remaining: Number.MAX_SAFE_INTEGER,
          reset: now + 60_000,
          pending: Promise.resolve(),
        };
      },
    };
