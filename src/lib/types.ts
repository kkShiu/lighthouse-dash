/**
 * All scores in this app are integers 0-100, or null for n/a.
 * This differs from raw Lighthouse JSON, where category scores are 0-1 floats
 * and audit scores are separately left as 0-1 floats — both are rescaled
 * uniformly on ingest in parseReport.ts.
 */
export type Score = number | null;

export type RunStatus = "pending" | "running" | "complete" | "failed";

export interface ParsedAudit {
  id: string;
  title: string;
  score: Score;
  displayValue: string | null;
  description: string | null;
  numericValue: number | null;
  details: unknown[] | null;
  /** Category keys (e.g. "performance", "seo") this audit is grouped under in
   *  the report. An audit can belong to more than one category (e.g.
   *  "image-alt" counts under both accessibility and seo). Empty for audits
   *  not referenced by any category (manual/hidden audits). */
  categories: string[];
}

export interface ParsedCategoryScores {
  perfScore: Score;
  accessibilityScore: Score;
  bestPracticesScore: Score;
  seoScore: Score;
  pwaScore: Score;
}

export interface ParsedReport extends ParsedCategoryScores {
  fetchTime: string | null;
  audits: ParsedAudit[];
}

// pwaScore is omitted here: current Lighthouse (12.x, via @lhci/cli 0.15.1)
// dropped the PWA category from its default report entirely, so it's always
// null. The DB column and ParsedCategoryScores field are kept (harmless,
// avoids a migration) in case a future Lighthouse version reintroduces it.
//
// lhCategory is the raw Lighthouse category key (as it appears in
// lhr.categories and in each ParsedAudit.categories) that this column
// corresponds to — used to filter audits for per-category recommendations.
export const CATEGORY_COLUMNS = [
  { key: "perfScore", label: "Performance", lhCategory: "performance" },
  { key: "accessibilityScore", label: "Accessibility", lhCategory: "accessibility" },
  { key: "bestPracticesScore", label: "Best Practices", lhCategory: "best-practices" },
  { key: "seoScore", label: "SEO", lhCategory: "seo" },
] as const satisfies ReadonlyArray<{
  key: keyof ParsedCategoryScores;
  label: string;
  lhCategory: string;
}>;
