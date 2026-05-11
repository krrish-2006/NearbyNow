import Image from "next/image";

import { notFound } from "next/navigation";

import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { formatInr } from "@/lib/formatters/currency";
import {
  getExistingCartItemId,
  getProductDetails,
  getRelatedProducts,
} from "@/repositories/product.repository";
import { getWishlistItemId } from "@/repositories/wishlist.repository";

import BuyNowButton from "@/features/checkout/components/buy-now-button";
import AddToCartButton from "@/features/cart/components/add-to-cart-button";
import ProductCard from "@/features/products/components/product-card";
import WishlistButton from "@/features/wishlist/components/wishlist-button";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const product = await getProductDetails(supabase, id);

  if (!product) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const existingCartItemId = await getExistingCartItemId(
    supabase,
    user?.id,
    product.id
  );

  const existingWishlistItemId = await getWishlistItemId(
    supabase,
    user?.id,
    product.id,
  );

  const relatedProducts = await getRelatedProducts(supabase, product);

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
              </div>

              <div>
                <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                  {product.title}
                </h1>

                <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:mt-5 sm:text-lg">
                  {product.description}
                </p>
              </div>

              <div>
                <p className="text-3xl font-black sm:text-5xl">
                  {formatInr(product.price)}
                </p>

                <p className="mt-2 text-sm text-neutral-500">
                  Inclusive of all taxes
                </p>

                <p className="mt-2 text-sm font-semibold text-neutral-700">
                  {product.stock_quantity > 0
                    ? `In stock: ${product.stock_quantity}`
                    : "Out of stock"}
                </p>
              </div>

              <div className="rounded-3xl border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                  <p className="text-sm text-neutral-500">Sold by</p>

                  <h2 className="mt-1 text-xl font-bold">
                    {product.shops?.name ?? "Local shop"}
                  </h2>
                  </div>

                  <WishlistButton
                    productId={product.id}
                    initialWishlisted={Boolean(existingWishlistItemId)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {existingCartItemId ? (
                  <Link
                    href="/cart"
                    className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-black px-6 text-lg font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-95"
                  >
                    View Cart
                  </Link>
                ) : (
                  <AddToCartButton
                    productId={product.id}
                    stockQuantity={product.stock_quantity ?? 0}
                    isActive={product.is_active ?? true}
                    className="h-14 w-full text-lg font-semibold"
                  />
                )}

                <BuyNowButton
                  productId={product.id}
                  stockQuantity={product.stock_quantity ?? 0}
                  isActive={product.is_active ?? true}
                />
              </div>
            </div>
          </div>
        </div>

        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-3xl font-black">Related Products</h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
