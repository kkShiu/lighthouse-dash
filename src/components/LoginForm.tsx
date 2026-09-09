"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to log in");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}
    >
      <input
        type="text"
        required
        aria-label="Username"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{
          padding: "6px 10px",
          border: "1px solid var(--border)",
          borderRadius: 6,
          background: "transparent",
          color: "inherit",
        }}
      />
      <input
        type="password"
        required
        aria-label="Password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
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
        {submitting ? "Logging in…" : "Log in"}
      </button>
      {error && <span style={{ color: "var(--fail)", fontSize: 13 }}>{error}</span>}
    </form>
  );
}
