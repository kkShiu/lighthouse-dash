"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddUrlForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, label: label || undefined }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to add URL");
      return;
    }

    setUrl("");
    setLabel("");
    router.refresh();
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
      >
        <input
          type="url"
          required
          aria-label="Tracked URL"
          placeholder="Tracked URL — https://staging.example.com/"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            flex: "1 1 320px",
            padding: "6px 10px",
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "transparent",
            color: "inherit",
          }}
        />
        <input
          type="text"
          aria-label="Page label (optional)"
          placeholder="Page label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{
            flex: "0 1 240px",
            padding: "6px 10px",
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "transparent",
            color: "inherit",
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--card)",
            cursor: "pointer",
          }}
        >
          {submitting ? "Adding…" : "Add URL"}
        </button>
        {error && <span style={{ color: "var(--fail)", fontSize: 13 }}>{error}</span>}
      </form>
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
        URLs sharing the same domain are grouped together automatically, with each one&apos;s path listed underneath.
      </p>
    </div>
  );
}
