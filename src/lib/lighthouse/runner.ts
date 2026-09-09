import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// ../../.. -> repo root, since this file lives at src/lib/lighthouse/runner.ts
const LHCI_BIN = path.resolve(__dirname, "../../../node_modules/.bin/lhci");

const MAX_CAPTURED_OUTPUT = 20_000; // cap stderr/stdout tail kept for error_message

export interface RunLighthouseOptions {
  url: string;
  outputDir: string;
  numberOfRuns?: number;
}

export interface RunLighthouseResult {
  outputDir: string;
}

/**
 * Spawns `lhci collect` against a single already-deployed URL, isolated to its
 * own outputDir (fixes the old CLI tool's concurrency bug, where every
 * invocation shared the same default `.lighthouseci` dir relative to
 * process.cwd() with no locking). stdio is captured, not inherited, so
 * concurrent web requests don't interleave output into shared server logs.
 */
export function runLighthouse({
  url,
  outputDir,
  numberOfRuns = 1,
}: RunLighthouseOptions): Promise<RunLighthouseResult> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(LHCI_BIN)) {
      reject(new Error(`lhci binary not found at ${LHCI_BIN}. Run npm install.`));
      return;
    }

    const args = [LHCI_BIN, "collect", `--url=${url}`, `--numberOfRuns=${numberOfRuns}`];

    // lhci collect has no --outputDir flag (it's silently ignored, not rejected) —
    // it always writes to ./.lighthouseci relative to cwd. Running each spawn in
    // its own tempDir as cwd is what actually isolates concurrent runs.
    const child = spawn(process.execPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: outputDir,
    });

    let stderrTail = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderrTail = (stderrTail + chunk.toString()).slice(-MAX_CAPTURED_OUTPUT);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ outputDir });
      } else {
        reject(new Error(`lhci exited with code ${code}${stderrTail ? `: ${stderrTail}` : ""}`));
      }
    });

    child.on("error", reject);
  });
}
