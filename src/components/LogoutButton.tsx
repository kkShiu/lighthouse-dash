"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "transparent",
        color: "var(--muted)",
        fontSize: 13,
        cursor: busy ? "default" : "pointer",
      }}
    >
      {busy ? "…" : "Log out"}
    </button>
  );
}
