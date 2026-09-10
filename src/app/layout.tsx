import type { Metadata } from "next";
import "./globals.css";
import { LogoutBar } from "@/components/LogoutBar";

export const metadata: Metadata = {
  title: "Lighthouse Dashboard",
  description: "Team-shared Lighthouse score history and comparison",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <LogoutBar version={process.env.APP_VERSION ?? "dev"} />
        {children}
      </body>
    </html>
  );
}
