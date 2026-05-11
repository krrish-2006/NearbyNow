import { createClient } from "@/lib/supabase/server";
import { formatInr } from "@/lib/formatters/currency";

import { getShopBySellerId } from "@/repositories/shop.repository";
import { getCartQuantityByShopId } from "@/repositories/cart.repository";
import { getSellerOrderItemsByShopId } from "@/repositories/order.repository";
import { getWishlistCountByShopId } from "@/repositories/wishlist.repository";

import { SellerOrderStatusControls } from "@/features/orders/components/seller-order-status-controls";
import {
  countOrderStatuses,
  formatOrderStatus,
  ORDER_STATUSES,
} from "@/features/orders/lib/order-status";
import { requireSeller } from "@/features/seller/utils/require-seller";

export default async function SellerOrdersPage() {
  const profile = await requireSeller();

  const supabase = await createClient();

  const sellerShop = await getShopBySellerId(supabase, profile.id);

  if (!sellerShop) {
    return (
      <div className="rounded-3xl border bg-white p-16 text-center">
        <h1 className="text-2xl font-bold">Shop not found</h1>

        <p className="mt-2 text-neutral-500">
          Orders will appear here after your shop is created.
        </p>
      </div>
    );
  }

  const [orderItems, wishlistCount, cartQuantity] =
    await Promise.all([
      getSellerOrderItemsByShopId(supabase, sellerShop.id),
      getWishlistCountByShopId(supabase, sellerShop.id),
      getCartQuantityByShopId(supabase, sellerShop.id),
    ]);

  const statusCounts = countOrderStatuses(
    orderItems.map((item) => item.status),
  );

  const metrics = [
    {
      label: "Orders in Cart",
      value: cartQuantity,
    },
    {
      label: "Wishlisted Products",
      value: wishlistCount,
    },
    {
      label: "Orders Completed",
      value: statusCounts.COMPLETED,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black">Seller Orders</h1>

        <p className="mt-2 text-neutral-500">
          Manage incoming customer orders.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border bg-white p-6">
            <p className="text-sm font-semibold text-neutral-500">
              {metric.label}
            </p>

            <p
              className={`mt-3 font-black ${
                metric.value === null || metric.value === undefined
                  ? "text-lg text-neutral-500"
                  : "text-4xl"
              }`}
            >
              {metric.value ?? "Unavailable"}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {ORDER_STATUSES.map((status) => (
          <div key={status} className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-semibold text-neutral-500">
              {formatOrderStatus(status)}
            </p>

            <p className="mt-2 text-2xl font-black">{statusCounts[status]}</p>
          </div>
        ))}
      </div>

      {orderItems.length === 0 ? (
        <div className="rounded-3xl border bg-white p-16 text-center">
          <h2 className="text-2xl font-bold">No orders yet</h2>

          <p className="mt-2 text-neutral-500">
            Orders from customers will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orderItems.map((item) => (
            <div key={item.id} className="rounded-3xl border bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
                <div>
                  <h2 className="text-2xl font-bold">
                    {item.products?.title ?? "Product"}
                  </h2>

                  <p className="mt-2 text-sm text-neutral-500">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <div className="text-right">
                  <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                    {formatOrderStatus(item.status)}
                  </span>

                  <p className="mt-3 text-lg font-bold">
                    {formatInr(item.price)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-6 text-sm text-neutral-600">
                <p>Payment: {item.orders?.payment_method ?? "COD"}</p>

                <p>
                  Buyer:{" "}
                  {item.orders?.user_id
                    ? item.orders.user_id.slice(0, 8)
                    : "Unknown"}
                </p>

                <p>
                  Ordered:{" "}
                  {item.orders?.created_at
                    ? new Date(item.orders.created_at).toLocaleString()
                    : "Unknown"}
                </p>

                <p>Order Total: {formatInr(item.orders?.total_amount ?? 0)}</p>
              </div>

              <SellerOrderStatusControls
                currentStatus={item.status}
                orderItemId={item.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
