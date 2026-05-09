"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

const links = [
  {
    label: "Dashboard",
    href: "/seller",
  },
  {
    label: "Products",
    href: "/seller/products",
  },
  {
    label: "Orders",
    href: "/seller/orders",
  },
  {
    label: "Profile",
    href: "/seller/profile",
  },
  {
    label: "Settings",
    href: "/seller/settings",
  },
];

export default function SellerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r bg-white p-6">
      <div className="mb-10">
        <h1 className="text-3xl font-black">Seller Portal</h1>

        <p className="mt-2 text-sm text-neutral-500">NearbyNow Seller</p>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-5 py-4 text-sm font-semibold transition ${
                isActive
                  ? "bg-black text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
