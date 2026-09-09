import type { Score } from "./types";

export type ScoreStatus = "pass" | "average" | "fail" | "n/a";

/** Single shared threshold: >=90 pass, >=50 average, else fail, null -> n/a. */
export function scoreStatus(score: Score): ScoreStatus {
  if (score === null) return "n/a";
  if (score >= 90) return "pass";
  if (score >= 50) return "average";
  return "fail";
}
