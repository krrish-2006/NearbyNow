import Image from "next/image";

import Link from "next/link";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCartItemsByUserId } from "@/repositories/cart.repository";

import { placeOrderAction } from "@/features/orders/actions/place-order.action";

import CartActions from "@/features/cart/components/cart-actions";

import Button from "@/components/ui/button";
import { formatInr } from "@/lib/formatters/currency";

export default async function CartPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cartItems = await getCartItemsByUserId(supabase, user.id);

  const subtotal =
    cartItems.reduce((total, item) => {
      return total + item.products.price * item.quantity;
    }, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Your Cart
        </h1>

        <p className="mt-3 text-neutral-500">Review your selected products.</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-3xl border bg-white p-10 text-center shadow-sm sm:p-16">
          <h2 className="text-2xl font-bold">Your cart is empty</h2>

          <p className="mt-2 text-neutral-500">Add some products first.</p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-2xl bg-black px-6 py-3 font-semibold text-white transition hover:scale-105 hover:opacity-90"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-5 rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-lg sm:flex-row"
              >
                <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-neutral-100 sm:w-32">
                  {item.products?.image_url ? (
                    <Image
                      src={item.products.image_url}
                      alt={item.products.title}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {item.products?.title}
                    </h2>

                    <p className="mt-2 text-lg font-semibold">
                      {formatInr(item.products?.price)}
                    </p>
                  </div>

                  <CartActions
                    itemId={item.id}
                    quantity={item.quantity}
                    stockQuantity={item.products?.stock_quantity ?? 0}
                    isActive={item.products?.is_active ?? true}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Order Summary</h2>

            <div className="mt-6 flex items-center justify-between text-lg">
              <span>Subtotal</span>

              <span className="font-bold">{formatInr(subtotal)}</span>
            </div>

            <form action={placeOrderAction}>
              <Button className="mt-8 w-full py-4 text-lg">
                Place COD Order
              </Button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
