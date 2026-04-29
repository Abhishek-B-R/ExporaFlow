import { ratelimit } from "@/lib/rate-limit";

/**
 * Check rate limit for a given identifier (usually the user ID).
 * Returns null if the request is allowed, or a Response if it should be rejected.
 */
export async function checkAIRateLimit(identifier: string): Promise<Response | null> {
  const result = await ratelimit.limit(`ai:${identifier}`);
  if (!result.success) {
    return Response.json(
      {
        message: "Too many AI requests. Please wait a moment and try again.",
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
        },
      },
    );
  }
  return null;
}
