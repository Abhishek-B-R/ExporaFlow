#!/usr/bin/env node
import { execSync } from "node:child_process";

const port = process.argv[2] || "3000";

if (process.platform === "win32") {
  try {
    execSync(
      `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /F /PID %a`,
      { stdio: "ignore", shell: true },
    );
  } catch {
    // no process on port
  }
} else {
  try {
    execSync(`lsof -ti :${port} | xargs kill -9 2>/dev/null || true`, {
      stdio: "ignore",
      shell: true,
    });
  } catch {
    // no process on port
  }
}

console.log(`Freed port ${port} (if anything was listening).`);
