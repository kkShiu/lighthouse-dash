"use client";

import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

export function LogoutBar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 24px 0" }}>
      <LogoutButton />
    </div>
  );
}
