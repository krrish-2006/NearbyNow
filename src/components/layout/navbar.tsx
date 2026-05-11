"use client";

import Image from "next/image";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import Button from "@/components/ui/button";

import CitySelector from "@/features/cities/components/city-selector";

import BecomeSellerButton from "@/features/seller/components/become-seller-button";

interface City {
  id: string;
  name: string;
}

type NavbarProfile = {
  avatar_url: string | null;
  email: string;
  full_name: string | null;
  role: "buyer" | "seller" | "admin";
};

export default function Navbar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const isSeller =
    pathname.startsWith(
      "/seller",
    );

  const [cities, setCities] =
    useState<City[]>([]);

  const [
    selectedCityId,
    setSelectedCityId,
  ] = useState<
    string | null
  >(null);

  const [
    isSellerAccount,
    setIsSellerAccount,
  ] = useState(false);

  const [
    authLoaded,
    setAuthLoaded,
  ] = useState(false);

  const [
    profile,
    setProfile,
  ] = useState<NavbarProfile | null>(null);

  const [
    isProfileMenuOpen,
    setIsProfileMenuOpen,
  ] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase =
        createClient();

      const { data } =
        await supabase
          .from("cities")
          .select("*")
          .order("name");

      if (data) {
        setCities(
          data as City[],
        );
      }

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (user) {
        const {
          data: profile,
        } =
          await supabase
            .from("profiles")
            .select("avatar_url, email, full_name, role")
            .eq(
              "id",
              user.id,
            )
            .single();

        if (profile) {
          setProfile(profile);
        }

        setIsSellerAccount(
          profile?.role ===
            "seller",
        );
      }

      const cityCookie =
        document.cookie
          .split("; ")
          .find((row) =>
            row.startsWith(
              "selected_city_id=",
            ),
          );

      if (cityCookie) {
        setSelectedCityId(cityCookie.split("=")[1]);
      } else if (data && data.length > 0) {
        const durgapurCity =
          data.find((city) => city.name === "Durgapur") || data[0];

        setSelectedCityId(durgapurCity.id);

        document.cookie = `selected_city_id=${durgapurCity.id}; path=/`;
      }

      setAuthLoaded(true);
    }

    loadData();
  }, []);

  async function handleLogout() {
    const supabase =
      createClient();

    await supabase.auth.signOut();

    setIsProfileMenuOpen(false);
    setProfile(null);

    router.refresh();

    router.push("/login");
  }

  const navButtonClass =
    "flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition hover:bg-neutral-100";

  const profileInitial =
    profile?.full_name?.trim().charAt(0).toUpperCase() ||
    profile?.email?.trim().charAt(0).toUpperCase() ||
    "U";

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            NearbyNow
          </Link>

          {!isSeller && (
            <CitySelector
              cities={cities}
              selectedCityId={
                selectedCityId
              }
            />
          )}
        </div>

        {authLoaded && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {isSellerAccount && (
              <div className="flex rounded-full border bg-neutral-100 p-1">
                <Link
                  href="/"
                  className={`flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
                    !isSeller
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:bg-white"
                  }`}
                >
                  Buyer
                </Link>

                <Link
                  href="/seller"
                  className={`flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
                    isSeller
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:bg-white"
                  }`}
                >
                  Seller
                </Link>
              </div>
            )}

            {!isSeller && !isSellerAccount && (
              <BecomeSellerButton />
            )}

            {!isSeller && (
              <>
                <Link
                  href="/cart"
                  className={
                    navButtonClass
                  }
                >
                  Cart
                </Link>

                <Link
                  href="/orders"
                  className={
                    navButtonClass
                  }
                >
                  Orders
                </Link>
              </>
            )}

            {profile && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setIsProfileMenuOpen(
                      (isOpen) => !isOpen,
                    )
                  }
                  className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border bg-neutral-100 text-sm font-bold text-neutral-700 transition hover:ring-2 hover:ring-black"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  aria-label="Open profile menu"
                >
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || "Profile"}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    profileInitial
                  )}
                </button>

                {isProfileMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border bg-white shadow-xl"
                  >
                    <div className="border-b p-4">
                      <p className="truncate text-sm font-bold text-neutral-900">
                        {profile.full_name || "NearbyNow Buyer"}
                      </p>

                      <p className="mt-1 truncate text-sm text-neutral-500">
                        {profile.email}
                      </p>
                    </div>

                    <div className="p-3">
                      <Button
                        onClick={handleLogout}
                        className="h-11 w-full rounded-xl text-sm"
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
