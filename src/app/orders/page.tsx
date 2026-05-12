import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatInr } from "@/lib/formatters/currency";
import { getOrdersByUserId } from "@/repositories/order.repository";
import {
  countOrderStatuses,
  deriveOrderStatusFromItems,
  formatOrderStatus,
  ORDER_STATUSES,
} from "@/features/orders/lib/order-status";

import EmptyState from "@/components/shared/empty-state";

export default async function OrdersPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const orders = await getOrdersByUserId(supabase, user.id);

  const orderStatuses = orders.map((order) =>
    deriveOrderStatusFromItems(order.order_items.map((item) => item.status)),
  );

  const statusCounts = countOrderStatuses(orderStatuses);

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

      {orders.length === 0 ? (
        <EmptyState
  title="No orders yet"
  description="Start shopping to place your first order."
  buttonText="Browse Products"
  buttonHref="/"
/>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-4">
            {ORDER_STATUSES.map((status) => (
              <div key={status} className="rounded-2xl border bg-white p-4">
                <p className="text-xs font-semibold text-neutral-500">
                  {formatOrderStatus(status)}
                </p>

                <p className="mt-2 text-2xl font-black">
                  {statusCounts[status]}
                </p>
              </div>
            ))}
          </div>

          {orders.map(
            (order) => {
              const derivedStatus = deriveOrderStatusFromItems(
                order.order_items.map((item) => item.status),
              );

              return (
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
                      {formatOrderStatus(derivedStatus)}
                    </span>

                    <p className="mt-3 text-xl font-bold">
                      {formatInr(order.total_amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {order.order_items.map(
                    (item) => (
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

                          <p className="mt-1 text-sm text-neutral-500">
                            Shop: {item.shops?.name ?? "Local shop"}
                          </p>

                          <p className="mt-2 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                            {formatOrderStatus(item.status)}
                          </p>
                        </div>

                        <p className="text-lg font-bold">
                          {formatInr(item.price)}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
              );
            }
          )}
        </div>
      )}
    </main>
  );
}
