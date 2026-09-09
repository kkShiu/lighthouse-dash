"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PollStatus = "idle" | "pending" | "running" | "complete" | "failed";

export function TriggerRunButton({ urlId }: { urlId: number }) {
  const router = useRouter();
  const [status, setStatus] = useState<PollStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  async function poll(runId: number) {
    const res = await fetch(`/api/urls/${urlId}/runs/${runId}`);
    const run = await res.json();

    if (run.status === "complete" || run.status === "failed") {
      setStatus(run.status);
      setError(run.errorMessage ?? null);
      router.refresh();
      return;
    }

    setStatus(run.status);
    pollTimer.current = setTimeout(() => poll(runId), 2500);
  }

  async function handleClick() {
    setError(null);
    setStatus("pending");

    const res = await fetch(`/api/urls/${urlId}/runs`, { method: "POST" });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus("failed");
      setError(body.error ?? "Failed to trigger run");
      return;
    }

    const { run } = await res.json();
    poll(run.id);
  }

  const busy = status === "pending" || status === "running";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={handleClick}
        disabled={busy}
        style={{
          padding: "6px 14px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background: "var(--card)",
          cursor: busy ? "default" : "pointer",
        }}
      >
        {busy ? `${status}…` : "Trigger new run"}
      </button>
      {status === "complete" && <span style={{ color: "var(--pass)", fontSize: 13 }}>Done</span>}
      {status === "failed" && (
        <span style={{ color: "var(--fail)", fontSize: 13 }}>{error ?? "Failed"}</span>
      )}
    </div>
  );
}
