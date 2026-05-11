"use client";

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
            .select("role")
            .eq(
              "id",
              user.id,
            )
            .single();

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

    router.refresh();

    router.push("/login");
  }

  const navButtonClass =
    "flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition hover:bg-neutral-100";

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

          <CitySelector
            cities={cities}
            selectedCityId={
              selectedCityId
            }
          />
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

            {!isSellerAccount && (
              <BecomeSellerButton />
            )}

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

            <Button
              onClick={
                handleLogout
              }
              className="h-11 rounded-full px-6 text-sm"
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
