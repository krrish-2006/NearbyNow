"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import Button from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();

  const router = useRouter();

  const isSeller = pathname.startsWith("/seller");

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.refresh();

    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight">
            NearbyNow
          </Link>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex rounded-full border bg-neutral-100 p-1">
            <Link
              href="/"
              className={`flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition ${
                !isSeller
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:bg-white"
              }`}
            >
              Buyer
            </Link>

            <Link
              href="/seller"
              className={`flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition ${
                isSeller
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:bg-white"
              }`}
            >
              Seller
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/cart"
              className="flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-105 hover:bg-neutral-100 hover:shadow-lg"
            >
              Cart
            </Link>

            <Link
              href="/orders"
              className="flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-105 hover:bg-neutral-100 hover:shadow-lg"
            >
              Orders
            </Link>

            <Button
              onClick={handleLogout}
              className="rounded-full py-3 text-sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
