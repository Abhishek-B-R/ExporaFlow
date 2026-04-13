type Level = "info" | "warn" | "error";

export function logEvent(level: Level, message: string, context?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: context ?? {},
  };
  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }
  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }
  console.log(JSON.stringify(payload));
}

export function logError(message: string, error: unknown, context?: Record<string, unknown>) {
  logEvent("error", message, {
    ...context,
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
  });
}
