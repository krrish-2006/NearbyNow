import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  const supabase: any = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      title,
      price,
      image_url,
      shops (
        name
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-6 py-10">
      <div className="space-y-3">
        <h1 className="text-5xl font-black tracking-tight">
          Marketplace
        </h1>

        <p className="text-neutral-500">
          Discover products from local sellers.
        </p>
      </div>

      {!products || products.length === 0 ? (
        <div className="rounded-3xl border bg-white p-16 text-center">
          <h2 className="text-2xl font-bold">
            No products available
          </h2>

          <p className="mt-2 text-neutral-500">
            Sellers have not listed products yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product: any) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="overflow-hidden rounded-3xl border bg-white transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-72 w-full bg-neutral-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    fill
                    className="object-cover"
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

                  <p className="mt-1 text-sm text-neutral-500">
                    by{" "}
                    {product.shops?.name ??
                      "Unknown Shop"}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">
                    ? {product.price}
                  </p>

                  <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                    View
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
