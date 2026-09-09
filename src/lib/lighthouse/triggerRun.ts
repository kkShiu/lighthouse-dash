import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "../db";
import { runLighthouse } from "./runner";
import { parseReport } from "./parseReport";

/**
 * Executes one lhci run for an existing `pending` run row and updates it to
 * `complete` or `failed`. Meant to be invoked via `after()` so it runs in the
 * background without blocking the triggering request — safe only because
 * this app is deployed as an always-on Node server, not serverless (a
 * serverless isolate can be torn down once the response is sent, killing
 * unawaited background work; see README's deployment constraints section).
 */
export async function executeRun(runId: number, url: string): Promise<void> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lhci-"));

  try {
    await prisma.run.update({
      where: { id: runId },
      data: { status: "running" },
    });

    await runLighthouse({ url, outputDir: tempDir });
    const report = parseReport(tempDir);

    await prisma.run.update({
      where: { id: runId },
      data: {
        status: "complete",
        completedAt: new Date(),
        fetchTime: report.fetchTime,
        perfScore: report.perfScore,
        accessibilityScore: report.accessibilityScore,
        bestPracticesScore: report.bestPracticesScore,
        seoScore: report.seoScore,
        pwaScore: report.pwaScore,
        auditsJson: JSON.stringify(report.audits),
      },
    });
  } catch (err) {
    await prisma.run.update({
      where: { id: runId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
    // The dashboard's "/" route isn't part of the current route tree while a
    // run is polled from the URL detail page, so router.refresh() there can't
    // reach it — revalidate it here so the Router Cache doesn't keep serving
    // the pre-run RSC payload once the user navigates back.
    revalidatePath("/");
  }
}
