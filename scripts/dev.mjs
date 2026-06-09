#!/usr/bin/env node
/**
 * Stable local dev entrypoint:
 * - optional --clean wipes .next (fixes stale webpack bundles)
 * - always regenerates Prisma client before starting Next
 */
import { existsSync, rmSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";

const clean = process.argv.includes("--clean");
const port = Number(process.env.PORT || 3000);

if (clean && existsSync(".next")) {
  rmSync(".next", { recursive: true, force: true });
  console.log("Removed .next cache");
}

const generate = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  shell: true,
});
if (generate.status !== 0) {
  process.exit(generate.status ?? 1);
}

function portInUse(p) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port: p, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 400);
  });
}

const busy = await portInUse(port);
if (busy) {
  console.warn(
    `\nPort ${port} is already in use. Another dev server may still be running.`,
  );
  console.warn(`Run: npm run dev:kill\n`);
}

const child = spawn("npx", ["next", "dev", "-p", String(port)], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
