"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({
  onDeleteHref,
  confirmMessage,
  label = "Delete",
  redirectTo,
}: {
  onDeleteHref: string;
  confirmMessage: string;
  label?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;

    setBusy(true);
    const res = await fetch(onDeleteHref, { method: "DELETE" });
    setBusy(false);

    if (res.ok) {
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    }
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
        color: "var(--fail)",
        fontSize: 13,
        cursor: busy ? "default" : "pointer",
      }}
    >
      {busy ? "…" : label}
    </button>
  );
}
