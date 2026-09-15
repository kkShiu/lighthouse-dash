import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CATEGORY_COLUMNS } from "@/lib/types";
import { ScoreBadge } from "@/components/ScoreBadge";
import { TriggerRunButton } from "@/components/TriggerRunButton";
import { DeleteButton } from "@/components/DeleteButton";
import { fetchHealthCheck } from "@/lib/healthCheck";
import { EnvBadge } from "@/components/EnvBadge";

export const dynamic = "force-dynamic";

function groupRunsByVersion<T extends { version: string | null }>(
  runs: T[],
): { version: string | null; runs: T[] }[] {
  const groups: { version: string | null; runs: T[] }[] = [];
  for (const run of runs) {
    const last = groups[groups.length - 1];
    if (last && last.version === run.version) {
      last.runs.push(run);
    } else {
      groups.push({ version: run.version, runs: [run] });
    }
  }
  return groups;
}

export default async function UrlDetailPage({ params }: PageProps<"/urls/[urlId]">) {
  const { urlId } = await params;
  const id = Number(urlId);

  const url = await prisma.url.findUnique({ where: { id } });
  if (!url) notFound();

  const [runs, health] = await Promise.all([
    prisma.run.findMany({
      where: { urlId: id },
      orderBy: { triggeredAt: "desc" },
      take: 20,
      omit: { auditsJson: true },
    }),
    fetchHealthCheck(url.url),
  ]);

  return (
    <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
      <p style={{ marginBottom: 8 }}>
        <Link href="/" style={{ color: "var(--muted)" }}>
          ← All URLs
        </Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{url.label || url.url}</h1>
      {url.label && <p style={{ color: "var(--muted)", marginBottom: 8 }}>{url.url}</p>}
      <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 16 }}>
        <EnvBadge tier={health.envTier} />
        <span style={{ color: "var(--muted)" }}>Version: {health.version ?? "—"}</span>
        {health.version != null && runs[0]?.version != null && health.version !== runs[0].version && (
          <span
            className="new-version-badge"
            title={`Live site is on ${health.version} — last run was against ${runs[0].version}. Trigger a new run below to refresh.`}
            style={{
              padding: "1px 8px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: "white",
              background: "#d97706",
            }}
          >
            new version — run needed
          </span>
        )}
      </p>

      <div style={{ marginBottom: 24, display: "flex", gap: 10, alignItems: "center" }}>
        <TriggerRunButton urlId={url.id} />
        <DeleteButton
          onDeleteHref={`/api/urls/${url.id}`}
          confirmMessage={`Delete "${url.label || url.url}" and all its run history? This can't be undone.`}
          label="Delete URL"
          redirectTo="/"
        />
      </div>

      {runs.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No runs yet.</p>
      ) : (
        groupRunsByVersion(
          runs.map((run, i) => ({ ...run, previous: runs[i + 1] })),
        ).map((group) => (
          <div key={group.version ?? "unknown"}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: "24px 0 8px" }}>
              {group.version ?? "Unknown version"}
            </h2>
            <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Triggered</th>
                  <th>Status</th>
                  {CATEGORY_COLUMNS.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {group.runs.map((run) => {
                  const previous = run.previous;
                  return (
                    <tr key={run.id}>
                      <td style={{ fontSize: 13 }}>{new Date(run.triggeredAt).toLocaleString()}</td>
                      <td style={{ fontSize: 13, color: "var(--muted)" }}>{run.status}</td>
                      {CATEGORY_COLUMNS.map((c) => (
                        <td key={c.key}>
                          <ScoreBadge score={run[c.key]} />
                        </td>
                      ))}
                      <td>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          {previous && (
                            <Link
                              href={`/urls/${url.id}/compare?baseline=${previous.id}&comparison=${run.id}`}
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "white",
                                background: "#2563eb",
                                padding: "6px 12px",
                                borderRadius: 6,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Compare
                            </Link>
                          )}
                          <DeleteButton
                            onDeleteHref={`/api/urls/${url.id}/runs/${run.id}`}
                            confirmMessage="Delete this run? This can't be undone."
                            label="Delete"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
