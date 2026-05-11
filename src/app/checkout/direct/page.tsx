import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatInr } from "@/lib/formatters/currency";

import BuyNowCheckoutForm from "@/features/checkout/components/buy-now-checkout-form";
import { calculateCheckoutPricing } from "@/features/checkout/lib/calculate-checkout-pricing";

interface DirectCheckoutPageProps {
  searchParams: Promise<{
    productId?: string;
    quantity?: string;
  }>;
}

export default async function DirectCheckoutPage({
  searchParams,
}: DirectCheckoutPageProps) {
  const params = await searchParams;

  const productId = params.productId;

  const quantity = Number(params.quantity ?? 1);

  if (!productId || quantity <= 0) {
    redirect("/");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product } = await supabase
    .from("products")
    .select(`
      id,
      title,
      price,
      image_url,
      stock_quantity,
      is_active,
      shops (
        name
      )
    `)
    .eq("id", productId)
    .single();

  if (!product) {
    notFound();
  }

  if (!product.is_active || product.stock_quantity <= 0) {
    redirect(`/products/${product.id}`);
  }

  const pricing = calculateCheckoutPricing({
    price: product.price,
    quantity,
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Checkout
          </h1>

          <p className="text-sm text-muted-foreground">
            Review your order before placing it.
          </p>
        </div>

        <Link
          href={`/products/${product.id}`}
          className="flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition hover:bg-neutral-100"
        >
          Back to Product
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border bg-background p-5 shadow-sm">
          <div className="flex gap-4">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.title}
                width={112}
                height={112}
                className="h-28 w-28 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-neutral-100 text-xs text-neutral-400">
                No Image
              </div>
            )}

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {product.title}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {product.shops?.name}
                </p>
              </div>

              <div className="text-lg font-bold">
                {formatInr(product.price)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-background p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">
            Order Summary
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Quantity</span>

              <span>{quantity}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span>

              <span>{formatInr(pricing.subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Platform Fee</span>

              <span>
                {pricing.platformFee === 0
                  ? "FREE"
                  : formatInr(pricing.platformFee)}
              </span>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>

                <span>{formatInr(pricing.total)}</span>
              </div>
            </div>

            <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
              Cash on Delivery / Pay at Store
            </div>

            <BuyNowCheckoutForm
              productId={product.id}
              quantity={quantity}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

