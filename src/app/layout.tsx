import type { Metadata } from "next";

import "./globals.css";

import Navbar from "@/components/layout/navbar";

import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "NearbyNow",
  description: "Local marketplace platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-100 text-black">
        <Navbar />

        {children}

        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
