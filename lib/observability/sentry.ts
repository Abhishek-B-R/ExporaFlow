export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!process.env.SENTRY_DSN) return;
  // Placeholder to keep Sentry wiring centralized; plug in @sentry/nextjs when enabled.
  console.error("Sentry capture placeholder", { error, context });
}
