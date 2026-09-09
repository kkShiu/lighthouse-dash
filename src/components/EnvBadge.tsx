import type { EnvTier } from "@/lib/healthCheck";

export const TIER_COLOR: Record<EnvTier, string> = {
  dev: "#6b7280",
  qa: "#d97706",
  staging: "#2563eb",
  pro: "#dc2626",
  unknown: "var(--na)",
};

export const TIER_LABEL: Record<EnvTier, string> = {
  dev: "Dev",
  qa: "QA",
  staging: "Staging",
  pro: "Prod",
  unknown: "—",
};

export function EnvBadge({ tier }: { tier: EnvTier }) {
  if (tier === "unknown") return <span style={{ color: "var(--muted)" }}>—</span>;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: "white",
        background: TIER_COLOR[tier],
      }}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}
