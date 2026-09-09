export type EnvTier = "dev" | "qa" | "staging" | "pro" | "unknown";

interface HealthCheckInfo {
  instanceEnv: string | null;
  envTier: EnvTier;
  version: string | null;
}

const HEALTH_CHECK_TIMEOUT_MS = 4000;

/**
 * The raw instance-env string varies by service (e.g. "staging", "prod",
 * "production", "development"). Normalise it to one of the four tiers the
 * UI groups by, matched by substring so aliases fall into the right bucket.
 */
function normaliseEnvTier(raw: string | null): EnvTier {
  if (!raw) return "unknown";
  const v = raw.toLowerCase();
  if (v.includes("dev")) return "dev";
  if (v.includes("qa")) return "qa";
  if (v.includes("stag")) return "staging";
  if (v.includes("prod") || v === "pro") return "pro";
  return "unknown";
}

/**
 * Fetches {url}/health-check and pulls out instance-env + buildinfo.version.
 * Best-effort: a slow or broken health-check on one tracked URL must not
 * block rendering the rest of the dashboard, so failures resolve to nulls
 * instead of throwing.
 */
export async function fetchHealthCheck(url: string): Promise<HealthCheckInfo> {
  const empty: HealthCheckInfo = { instanceEnv: null, envTier: "unknown", version: null };

  try {
    const healthCheckUrl = new URL("/health-check", url).toString();
    const res = await fetch(healthCheckUrl, {
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return empty;

    const data = await res.json();
    const instanceEnv =
      typeof data?.["instance-env"] === "string" ? data["instance-env"] : null;

    return {
      instanceEnv,
      envTier: normaliseEnvTier(instanceEnv),
      version:
        typeof data?.buildinfo?.version === "string" ? data.buildinfo.version : null,
    };
  } catch {
    return empty;
  }
}
