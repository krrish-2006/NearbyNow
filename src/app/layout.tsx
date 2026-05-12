import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

import { Toaster } from "sonner";

import LayoutShell from "@/components/layout/layout-shell";

export const metadata: Metadata = {
  title: "NearbyNow",
  description:
    "Local marketplace platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-100 text-black">
        <LayoutShell>
          {children}
        </LayoutShell>

        <Toaster
          position="top-right"
          richColors
        />

        <Analytics />

        <SpeedInsights />
      </body>
    </html>
  );
}
