import { createClient } from "@/lib/supabase/server";
import { getMarketplaceProducts } from "@/repositories/product.repository";

import ProductCard from "@/features/products/components/product-card";

export default async function ProductsPage() {
  const supabase = await createClient();

  const products = await getMarketplaceProducts(supabase);

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
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      )}
    </main>
  );
}
