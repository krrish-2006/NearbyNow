import Link from "next/link";

import {
  cookies,
  headers,
} from "next/headers";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/repositories/category.repository";
import { getCities } from "@/repositories/city.repository";
import { getMarketplaceProducts } from "@/repositories/product.repository";

import ProductCard from "@/features/products/components/product-card";

import SearchBar from "@/components/shared/search-bar";

import CityComingSoon from "@/features/cities/components/city-coming-soon";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    code?: string;
  }>;
}) {
  const params = await searchParams;

  if (params.code) {
    const headersList = await headers();

    const host =
      headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

    const protocol =
      headersList.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.")
        ? "http"
        : "https");

    const callbackOrigin =
      host.startsWith("localhost") || host.startsWith("127.")
        ? `${protocol}://${host}`
        : "https://www.nearbynow.store";

    redirect(
      `${callbackOrigin}/auth/callback?code=${encodeURIComponent(params.code)}`,
    );
  }

  const cookieStore = await cookies();

  const selectedCityId = cookieStore.get("selected_city_id")?.value;

  const supabase = await createClient();

  const cities = await getCities(supabase);

  const selectedCity = cities.find((city) => city.id === selectedCityId);

  if (selectedCity && selectedCity.name?.trim().toLowerCase() !== "durgapur") {
    return <CityComingSoon cityName={selectedCity.name} />;
  }

  const products = await getMarketplaceProducts(supabase, {
    search: params.search,
    categoryId: params.category,
  });

  const categories = await getCategories(supabase);

  return (
    <main className="min-h-screen bg-neutral-100">
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              NearbyNow
            </h1>

            <p className="mt-3 max-w-2xl text-base text-neutral-600 sm:text-lg">
              Discover products from nearby local shops.
            </p>
          </div>

          <SearchBar />

          <div className="flex flex-wrap gap-3 pb-2">
            <Link
              href="/"
              className={`rounded-full px-4 py-2 text-xs font-semibold transition sm:px-5 sm:text-sm ${
                !params.category
                  ? "bg-black text-white"
                  : "border bg-white hover:bg-neutral-100"
              }`}
            >
              All
            </Link>

            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/?category=${category.id}`}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition sm:px-5 sm:text-sm ${
                  params.category === category.id
                    ? "bg-black text-white"
                    : "border bg-white hover:bg-neutral-100"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        {products.length === 0 ? (
          <div className="rounded-3xl border bg-white p-10 text-center shadow-sm sm:p-16">
            <h2 className="text-2xl font-bold">No products found</h2>

            <p className="mt-2 text-neutral-500">
              Try another search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index === 0}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
