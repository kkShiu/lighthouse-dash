"use client";

import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

export function LogoutBar({ version }: { version: string }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 24px 0",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--muted)" }} title="Dashboard build version">
        v{version}
      </span>
      <LogoutButton />
    </div>
  );
}
