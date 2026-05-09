import Image from "next/image";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import AddToCartButton from "@/features/cart/components/add-to-cart-button";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase: any = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      `
        *,
        shops (
          id,
          name,
          description
        ),
        categories (
          name
        )
      `,
    )
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  const { data: relatedProducts } = await supabase
    .from("products")
    .select(
      `
      id,
      title,
      price,
      image_url
    `,
    )
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(4);

  return (
    <main className="min-h-screen bg-neutral-100">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="overflow-hidden rounded-[2rem] border bg-white shadow-sm">
            <div className="relative aspect-square bg-neutral-100">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  sizes="700px"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                  No Image
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                  {product.categories?.name}
                </span>

                <span className="rounded-full border bg-white px-4 py-2 text-xs font-semibold">
                  Local Store Product
                </span>
              </div>

              <div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                  {product.title}
                </h1>

                <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:mt-5 sm:text-lg">
                  {product.description}
                </p>
              </div>

              <div>
                <p className="text-4xl font-black sm:text-5xl">
                  ₹ {product.price}
                </p>

                <p className="mt-2 text-sm font-medium text-green-600">
                  Available for local pickup
                </p>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm text-neutral-500">Sold by</p>

              <h2 className="mt-2 text-2xl font-bold">{product.shops?.name}</h2>

              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {product.shops?.description}
              </p>
            </div>

            <div>
              <AddToCartButton productId={product.id} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-neutral-500">
                  Payment
                </h3>

                <p className="mt-3 text-lg font-bold">COD / Pay at Store</p>
              </div>

              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-neutral-500">
                  Pickup
                </h3>

                <p className="mt-3 text-lg font-bold">Local Shop Pickup</p>
              </div>

              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-neutral-500">
                  Category
                </h3>

                <p className="mt-3 text-lg font-bold">
                  {product.categories?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-black sm:text-4xl">
              Related Products
            </h2>

            <p className="mt-2 text-neutral-500">
              Discover similar nearby products.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related: any) => (
              <div
                key={related.id}
                className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-square bg-neutral-100">
                  {related.image_url ? (
                    <Image
                      src={related.image_url}
                      alt={related.title}
                      fill
                      sizes="300px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="line-clamp-1 text-lg font-bold">
                    {related.title}
                  </h3>

                  <p className="mt-3 text-2xl font-black">₹ {related.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
