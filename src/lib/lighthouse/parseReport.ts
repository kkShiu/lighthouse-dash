import fs from "node:fs";
import path from "node:path";
import type { ParsedAudit, ParsedReport } from "../types";

interface RawLhrCategory {
  score: number | null;
  title: string;
  auditRefs: { id: string }[];
}

interface RawLhrAudit {
  id: string;
  title: string;
  score: number | null;
  displayValue?: string;
  description?: string;
  numericValue?: number;
  details?: { items?: unknown[] };
}

interface RawLhr {
  fetchTime: string;
  categories: Record<string, RawLhrCategory>;
  audits: Record<string, RawLhrAudit>;
}

/**
 * lhci collect has no --outputDir flag; it always writes lhr-*.json (and
 * matching .html) reports into ./.lighthouseci relative to its cwd. runner.ts
 * spawns lhci with cwd set to outputDir, so reports land in
 * outputDir/.lighthouseci/.
 */
export function listLhrFiles(outputDir: string): string[] {
  const reportDir = path.join(outputDir, ".lighthouseci");
  if (!fs.existsSync(reportDir)) return [];
  return fs
    .readdirSync(reportDir)
    .filter((f) => f.startsWith("lhr-") && f.endsWith(".json"))
    .map((f) => path.join(reportDir, f));
}

/** 0-1 float or null -> 0-100 int or null. Every score in this app uses this one scale. */
function rescale(score: number | null): number | null {
  return score === null ? null : Math.round(score * 100);
}

/** audit id -> category keys, built from each category's auditRefs list. An
 *  audit can appear under more than one category (e.g. "image-alt" counts
 *  under both accessibility and seo). */
function buildAuditCategoryMap(categories: Record<string, RawLhrCategory>): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [categoryKey, category] of Object.entries(categories)) {
    for (const ref of category.auditRefs ?? []) {
      const existing = map.get(ref.id);
      if (existing) existing.push(categoryKey);
      else map.set(ref.id, [categoryKey]);
    }
  }
  return map;
}

function normaliseAudits(
  audits: Record<string, RawLhrAudit>,
  auditCategoryMap: Map<string, string[]>,
): ParsedAudit[] {
  return Object.values(audits).map((a) => ({
    id: a.id,
    title: a.title,
    score: rescale(a.score),
    displayValue: a.displayValue ?? null,
    description: a.description ?? null,
    numericValue: a.numericValue ?? null,
    details: Array.isArray(a.details?.items) ? a.details.items.slice(0, 10) : null,
    categories: auditCategoryMap.get(a.id) ?? [],
  }));
}

/**
 * Standard Lighthouse category keys: performance, accessibility,
 * best-practices, seo, pwa. pwa is frequently absent from a report entirely
 * (not just null-scored) — categories[key] itself may be undefined.
 */
export function parseReport(outputDir: string): ParsedReport {
  const [file] = listLhrFiles(outputDir);
  if (!file) {
    throw new Error(`No lhr-*.json report found in ${outputDir}`);
  }

  const lhr = JSON.parse(fs.readFileSync(file, "utf8")) as RawLhr;
  const categories = lhr.categories ?? {};

  return {
    fetchTime: lhr.fetchTime ?? null,
    perfScore: rescale(categories["performance"]?.score ?? null),
    accessibilityScore: rescale(categories["accessibility"]?.score ?? null),
    bestPracticesScore: rescale(categories["best-practices"]?.score ?? null),
    seoScore: rescale(categories["seo"]?.score ?? null),
    pwaScore: rescale(categories["pwa"]?.score ?? null),
    audits: normaliseAudits(lhr.audits ?? {}, buildAuditCategoryMap(categories)),
  };
}
