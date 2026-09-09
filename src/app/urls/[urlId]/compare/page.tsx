import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeDeltas } from "@/lib/compare";
import { CATEGORY_COLUMNS, type ParsedAudit } from "@/lib/types";
import { pickRecommendations } from "@/lib/recommendations";
import { linkify } from "@/lib/linkify";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  improved: "var(--pass)",
  regressed: "var(--fail)",
  unchanged: "var(--muted)",
  "n/a": "var(--na)",
};

export default async function ComparePage({
  params,
  searchParams,
}: PageProps<"/urls/[urlId]/compare">) {
  const { urlId } = await params;
  const id = Number(urlId);
  const sp = await searchParams;

  const url = await prisma.url.findUnique({ where: { id } });
  if (!url) notFound();

  const allRuns = await prisma.run.findMany({
    where: { urlId: id, status: "complete" },
    orderBy: { triggeredAt: "desc" },
    omit: { auditsJson: true },
  });

  if (allRuns.length < 2) {
    return (
      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        <p style={{ marginBottom: 8 }}>
          <Link href={`/urls/${id}`} style={{ color: "var(--muted)" }}>
            ← Back
          </Link>
        </p>
        <p style={{ color: "var(--muted)" }}>Need at least two completed runs to compare.</p>
      </main>
    );
  }

  const comparisonId = Number(sp.comparison ?? allRuns[0].id);
  const baselineId = Number(sp.baseline ?? allRuns[1].id);

  const runB = allRuns.find((r) => r.id === comparisonId) ?? allRuns[0];
  const runA = allRuns.find((r) => r.id === baselineId) ?? allRuns[1];

  const deltas = computeDeltas(runA, runB);

  // Recommendations are drawn from the "current" (comparison) run's audits —
  // fetched separately since allRuns above omits the (potentially large)
  // auditsJson blob to keep the run-selector query cheap.
  const runBWithAudits = await prisma.run.findUnique({
    where: { id: runB.id },
    select: { auditsJson: true },
  });
  const runBAudits: ParsedAudit[] = runBWithAudits?.auditsJson
    ? JSON.parse(runBWithAudits.auditsJson)
    : [];

  return (
    <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
      <p style={{ marginBottom: 8 }}>
        <Link href={`/urls/${id}`} style={{ color: "var(--muted)" }}>
          ← Back
        </Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>{url.label || url.url}</h1>

      <form style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
          Baseline
          <select
            name="baseline"
            defaultValue={runA.id}
            style={{ padding: 6, border: "1px solid var(--border)", background: "transparent", color: "inherit" }}
          >
            {allRuns.map((r) => (
              <option key={r.id} value={r.id}>
                {r.version && `${r.version} — `}
                {new Date(r.triggeredAt).toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 13 }}>
          Comparison (current)
          <select
            name="comparison"
            defaultValue={runB.id}
            style={{ padding: 6, border: "1px solid var(--border)", background: "transparent", color: "inherit" }}
          >
            {allRuns.map((r) => (
              <option key={r.id} value={r.id}>
                {r.version && `${r.version} — `}
                {new Date(r.triggeredAt).toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer" }}
        >
          Compare
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Baseline</th>
            <th>Current</th>
            <th>Delta</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {deltas.map((d) => (
            <tr key={d.key}>
              <td>{d.category}</td>
              <td>{d.scoreA ?? "—"}</td>
              <td>{d.scoreB ?? "—"}</td>
              <td>{d.delta === null ? "—" : d.delta > 0 ? `+${d.delta}` : d.delta}</td>
              <td style={{ color: STATUS_COLOR[d.status], fontWeight: 600 }}>{d.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 18, margin: "32px 0 16px" }}>
        Recommendations (from current run)
      </h2>
      {CATEGORY_COLUMNS.map((c) => {
        const recs = pickRecommendations(runBAudits, c.lhCategory);
        if (recs.length === 0) return null;

        return (
          <div key={c.key} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>{c.label}</h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {recs.map((r) => (
                <li
                  key={r.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "10px 12px",
                    background: "var(--card)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{r.title}</div>
                  {r.description && (
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{linkify(r.description)}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {runBAudits.length > 0 &&
        CATEGORY_COLUMNS.every((c) => pickRecommendations(runBAudits, c.lhCategory).length === 0) && (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            No failing audits found for the current run — nice work.
          </p>
        )}
    </main>
  );
}
