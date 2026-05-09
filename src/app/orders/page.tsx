import Link from "next/link";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const supabase: any =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: orders } =
    await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          quantity,
          price,
          products (
            title
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10">
        <h1 className="text-5xl font-black tracking-tight">
          Your Orders
        </h1>

        <p className="mt-3 text-neutral-500">
          Track your purchases and order history.
        </p>
      </div>

      {!orders ||
      orders.length === 0 ? (
        <div className="rounded-3xl border bg-white p-16 text-center">
          <h2 className="text-2xl font-bold">
            No orders yet
          </h2>

          <p className="mt-2 text-neutral-500">
            Start shopping to place your first order.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-2xl bg-black px-6 py-3 text-white"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map(
            (order: any) => (
              <div
                key={order.id}
                className="rounded-3xl border bg-white p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Order
                    </h2>

                    <p className="mt-1 text-sm text-neutral-500">
                      {new Date(
                        order.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                      {order.status}
                    </span>

                    <p className="mt-3 text-xl font-bold">
                      ?{" "}
                      {
                        order.total_amount
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {order.order_items?.map(
                    (item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-2xl border p-4"
                      >
                        <div>
                          <h3 className="text-lg font-bold">
                            {
                              item
                                .products
                                ?.title
                            }
                          </h3>

                          <p className="mt-1 text-sm text-neutral-500">
                            Quantity:{" "}
                            {
                              item.quantity
                            }
                          </p>
                        </div>

                        <p className="text-lg font-bold">
                          ?{" "}
                          {item.price}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}
