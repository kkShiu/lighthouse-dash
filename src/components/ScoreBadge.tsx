import { scoreStatus } from "@/lib/scoring";
import type { Score } from "@/lib/types";

const COLOR_VAR: Record<string, string> = {
  pass: "var(--pass)",
  average: "var(--average)",
  fail: "var(--fail)",
  "n/a": "var(--na)",
};

export function ScoreBadge({ score }: { score: Score }) {
  const status = scoreStatus(score);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 36,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        color: "white",
        background: COLOR_VAR[status],
      }}
    >
      {score === null ? "—" : score}
    </span>
  );
}
