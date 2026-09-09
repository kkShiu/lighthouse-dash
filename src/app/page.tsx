import Link from "next/link";
import { prisma } from "@/lib/db";
import { CATEGORY_COLUMNS } from "@/lib/types";
import { ScoreBadge } from "@/components/ScoreBadge";
import { AddUrlForm } from "@/components/AddUrlForm";
import { DeleteButton } from "@/components/DeleteButton";
import { fetchHealthCheck, type EnvTier } from "@/lib/healthCheck";
import { TIER_COLOR } from "@/components/EnvBadge";
import type { Run, Url } from "@/generated/prisma/client";

const UNKNOWN_COLOR = "var(--na)";

export const dynamic = "force-dynamic";

const ENV_SECTIONS: { tier: EnvTier; label: string }[] = [
  { tier: "dev", label: "Dev" },
  { tier: "qa", label: "QA" },
  { tier: "staging", label: "Staging" },
  { tier: "pro", label: "Prod" },
];

type UrlWithLatestRun = Url & { runs: Run[] };
type RowData = { url: UrlWithLatestRun; envTier: EnvTier; version: string | null };

/**
 * Rows are grouped by origin (the parent layer) with each tracked URL's
 * pathname shown as the child underneath — e.g. one group for
 * "https://web-revamp.videopass.kkv-simcity.com" with "/unlimited" and
 * "/pricing" as its children. Falls back to the raw string as its own
 * group if it isn't a parseable absolute URL.
 */
function splitUrl(raw: string): { origin: string; path: string } {
  try {
    const u = new URL(raw);
    return { origin: u.origin, path: `${u.pathname}${u.search}${u.hash}` || "/" };
  } catch {
    return { origin: raw, path: "/" };
  }
}

function groupByOrigin(rows: RowData[]): { origin: string; rows: RowData[] }[] {
  const groups = new Map<string, RowData[]>();
  for (const row of rows) {
    const { origin } = splitUrl(row.url.url);
    const group = groups.get(origin);
    if (group) group.push(row);
    else groups.set(origin, [row]);
  }
  return Array.from(groups, ([origin, rows]) => ({ origin, rows }));
}

export default async function Home() {
  const urls = await prisma.url.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      runs: {
        orderBy: { triggeredAt: "desc" },
        take: 1,
      },
    },
  });

  const healthChecks = await Promise.all(urls.map((u) => fetchHealthCheck(u.url)));
  const rows: RowData[] = urls.map((url, i) => ({
    url,
    envTier: healthChecks[i].envTier,
    version: healthChecks[i].version,
  }));

  return (
    <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Lighthouse Dashboard</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Tracked URLs and their most recent Lighthouse scores, grouped by environment.
      </p>

      <div style={{ marginBottom: 24 }}>
        <AddUrlForm />
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No URLs tracked yet — add one above.</p>
      ) : (
        <>
          {ENV_SECTIONS.map(({ tier, label }) => (
            <EnvSection
              key={tier}
              label={label}
              color={TIER_COLOR[tier]}
              rows={rows.filter((r) => r.envTier === tier)}
            />
          ))}
          <EnvSection
            label="Unknown"
            color={UNKNOWN_COLOR}
            rows={rows.filter((r) => r.envTier === "unknown")}
          />
        </>
      )}
    </main>
  );
}

function EnvSection({ label, color, rows }: { label: string; color: string; rows: RowData[] }) {
  if (rows.length === 0) return null;

  const groups = groupByOrigin(rows);

  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 22,
          fontWeight: 800,
          color,
          marginBottom: 12,
          paddingLeft: 12,
          borderLeft: `5px solid ${color}`,
        }}
      >
        {label}
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "white",
            background: color,
            borderRadius: 999,
            padding: "2px 10px",
          }}
        >
          {rows.length}
        </span>
      </h2>
      <div className="table-scroll">
        <table>
          <colgroup>
            <col style={{ width: 260 }} />
            <col style={{ width: 110 }} />
            {CATEGORY_COLUMNS.map((c) => (
              <col key={c.key} style={{ width: 110 }} />
            ))}
            <col style={{ width: 200 }} />
            <col style={{ width: 90 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Path</th>
              <th>Version</th>
              {CATEGORY_COLUMNS.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>Last run</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <OriginGroup key={group.origin} origin={group.origin} rows={group.rows} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const COLSPAN = 4 + CATEGORY_COLUMNS.length;

function OriginGroup({ origin, rows }: { origin: string; rows: RowData[] }) {
  return (
    <>
      <tr>
        <td
          colSpan={COLSPAN}
          title={origin}
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: "var(--foreground)",
            background: "var(--card)",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {origin}
        </td>
      </tr>
      {rows.map(({ url: u, version }) => {
        const latest = u.runs[0];
        const { path } = splitUrl(u.url);
        return (
          <tr key={u.id}>
            <td title={u.url} style={{ paddingLeft: 28 }}>
              <Link
                href={`/urls/${u.id}`}
                style={{
                  display: "inline-block",
                  maxWidth: "100%",
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {u.label || path}
              </Link>
              {u.label && (
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {path}
                </div>
              )}
            </td>
            <td style={{ fontSize: 13, color: "var(--muted)" }}>{version ?? "—"}</td>
            {CATEGORY_COLUMNS.map((c) => (
              <td key={c.key}>
                <ScoreBadge score={latest ? latest[c.key] : null} />
              </td>
            ))}
            <td style={{ color: "var(--muted)", fontSize: 13 }}>
              {latest
                ? `${latest.status} · ${new Date(latest.triggeredAt).toLocaleString()}`
                : "never"}
            </td>
            <td>
              <DeleteButton
                onDeleteHref={`/api/urls/${u.id}`}
                confirmMessage={`Delete "${u.label || u.url}" and all its run history? This can't be undone.`}
              />
            </td>
          </tr>
        );
      })}
    </>
  );
}
