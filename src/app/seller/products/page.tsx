import Image from "next/image";
import Link from "next/link";

import { redirect } from "next/navigation";

import { deleteProductAction } from "@/features/products/actions/delete-product.action";

import { createClient } from "@/lib/supabase/server";

import { getShopBySellerId } from "@/repositories/shop.repository";

export default async function SellerProductsPage() {
  const supabase: any = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sellerShop = await getShopBySellerId(supabase, user.id);

  if (!sellerShop) {
    redirect("/");
  }

  const { data: products } = await supabase
    .from("products")
    .select(
      `
      id,
      title,
      price,
      stock_quantity,
      image_url
    `,
    )
    .eq("shop_id", sellerShop.id)
    .order("created_at", {
      ascending: false,
    });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Products</h1>

          <p className="text-sm text-muted-foreground">
            Manage your marketplace listings.
          </p>
        </div>

        <Link
          href="/seller/products/new"
          className="rounded-xl bg-black px-5 py-3 text-white"
        >
          Add Product
        </Link>
      </div>

      {!products || products.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center">
          <h2 className="text-xl font-semibold">No products yet</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Start by creating your first product.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product: any) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border"
            >
              <div className="relative h-60 w-full bg-neutral-100">
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

              <div className="space-y-4 p-5">
                <div className="space-y-2">
                  <h2 className="line-clamp-1 text-lg font-semibold">
                    {product.title}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    ₹ {product.price}
                  </p>

                  <p className="text-sm">Stock: {product.stock_quantity}</p>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/seller/products/${product.id}/edit`}
                    className="rounded-lg border px-4 py-2 text-sm"
                  >
                    Edit
                  </Link>

                  <form
                    action={async () => {
                      "use server";

                      await deleteProductAction(product.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-red-500 px-4 py-2 text-sm text-red-500 transition hover:bg-red-500 hover:text-white"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
