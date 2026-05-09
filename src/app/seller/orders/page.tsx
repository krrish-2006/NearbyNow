import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { getShopBySellerId } from "@/repositories/shop.repository";

import { updateOrderStatusAction } from "@/features/orders/actions/update-order-status.action";

const statuses = [
  "PENDING",
  "CONFIRMED",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "CANCELLED",
];

export default async function SellerOrdersPage() {
  const supabase: any = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sellerShop = await getShopBySellerId(supabase, user.id);

  if (!sellerShop) {
    redirect("/seller");
  }

  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("shop_id", sellerShop.id);

  const productIds = products?.map((product: any) => product.id) ?? [];

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
        id,
        quantity,
        price,
        products (
          id,
          title
        ),
        orders (
          id,
          status,
          payment_method,
          created_at,
          total_amount
        )
      `,
    )
    .in("product_id", productIds);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black">Seller Orders</h1>

        <p className="mt-2 text-neutral-500">
          Manage incoming customer orders.
        </p>
      </div>

      {!orderItems || orderItems.length === 0 ? (
        <div className="rounded-3xl border bg-white p-16 text-center">
          <h2 className="text-2xl font-bold">No orders yet</h2>

          <p className="mt-2 text-neutral-500">
            Orders from customers will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orderItems.map((item: any) => (
            <div key={item.id} className="rounded-3xl border bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
                <div>
                  <h2 className="text-2xl font-bold">{item.products?.title}</h2>

                  <p className="mt-2 text-sm text-neutral-500">
                    Quantity: {item.quantity}
                  </p>
                </div>

                <div className="text-right">
                  <span className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                    {item.orders?.status}
                  </span>

                  <p className="mt-3 text-lg font-bold">₹ {item.price}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-6 text-sm text-neutral-600">
                <p>Payment: {item.orders?.payment_method}</p>

                <p>
                  Ordered: {new Date(item.orders?.created_at).toLocaleString()}
                </p>

                <p>Order Total: ₹ {item.orders?.total_amount}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {statuses.map((status) => (
                  <form
                    key={status}
                    action={async () => {
                      "use server";

                      await updateOrderStatusAction(item.orders?.id, status);
                    }}
                  >
                    <button
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        item.orders?.status === status
                          ? "bg-black text-white"
                          : "border hover:bg-neutral-100"
                      }`}
                    >
                      {status}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
