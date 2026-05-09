import Link from "next/link";

import Image from "next/image";

import { createClient } from "@/lib/supabase/server";

import SearchBar from "@/components/shared/search-bar";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
}) {
  const params = await searchParams;

  const supabase: any = await createClient();

  let query = supabase.from("products").select(`
      *,
      shops (
        name
      ),
      categories (
        name
      )
    `);

  if (params.search) {
    query = query.ilike("title", `%${params.search}%`);
  }

  if (params.category) {
    query = query.eq("category_id", params.category);
  }

  const { data: products } = await query.order("created_at", {
    ascending: false,
  });

  const { data: categories } = await supabase.from("categories").select("*");

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

            {categories?.map((category: any) => (
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
        {!products || products.length === 0 ? (
          <div className="rounded-3xl border bg-white p-10 text-center shadow-sm sm:p-16">
            <h2 className="text-2xl font-bold">No products found</h2>

            <p className="mt-2 text-neutral-500">
              Try another search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: any) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-square bg-neutral-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.title}
                      fill
                      sizes="400px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-5">
                  <div>
                    <h2 className="line-clamp-1 text-xl font-bold">
                      {product.title}
                    </h2>

                    <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-2xl font-black">₹ {product.price}</p>

                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">
                      {product.categories?.name}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-500">
                    Sold by {product.shops?.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
