import type { Metadata } from "next";
import "./globals.css";
import { LogoutBar } from "@/components/LogoutBar";
import { APP_VERSION } from "@/lib/version";

export const metadata: Metadata = {
  title: "Lighthouse Dashboard",
  description: "Team-shared Lighthouse score history and comparison",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <LogoutBar version={APP_VERSION} />
        {children}
      </body>
    </html>
  );
}
