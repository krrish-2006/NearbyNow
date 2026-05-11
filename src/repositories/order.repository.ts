import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import {
  countSellerOrderStatusMetrics,
  type SellerOrderStatusMetrics,
} from "@/features/orders/lib/order-status";
import type { OrderWithItems } from "@/features/orders/types/order.types";
import type { SellerOrderItem } from "@/features/seller/types/seller.types";

export type SellerOrderMetrics = SellerOrderStatusMetrics;

export async function getOrdersByUserId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<OrderWithItems[]> {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase.rpc("get_buyer_order_items");

  if (error || !data) {
    return [];
  }

  const ordersById = new Map<string, OrderWithItems>();

  for (const item of data) {
    const existingOrder = ordersById.get(item.order_id);

    if (!existingOrder) {
      ordersById.set(item.order_id, {
        id: item.order_id,
        user_id: item.order_user_id,
        total_amount: item.total_amount,
        payment_method: item.payment_method,
        payment_status: item.payment_status,
        checkout_source: item.checkout_source,
        platform_fee: item.platform_fee,
        status: item.order_status,
        created_at: item.order_created_at,
        order_items: [
          {
            id: item.order_item_id,
            quantity: item.quantity,
            price: item.price,
            status: item.item_status,
            products: {
              title: item.product_title,
            },
          },
        ],
      });

      continue;
    }

    existingOrder.order_items.push({
      id: item.order_item_id,
      quantity: item.quantity,
      price: item.price,
      status: item.item_status,
      products: {
        title: item.product_title,
      },
    });
  }

  return Array.from(ordersById.values());
}

export async function getSellerOrderItemsByShopId(
  supabase: SupabaseClient<Database>,
  shopId: string
): Promise<SellerOrderItem[]> {
  const { data, error } = await supabase.rpc("get_seller_order_items", {
    p_shop_id: shopId,
  });

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    price: item.price,
    status: item.status,
    products: {
      id: item.product_id,
      title: item.product_title,
    },
    orders: {
      id: item.order_id,
      user_id: item.buyer_user_id,
      payment_method: item.payment_method,
      created_at: item.ordered_at,
      total_amount: item.order_total_amount,
    },
  }));
}

export async function getSellerOrderMetricsByShopId(
  supabase: SupabaseClient<Database>,
  shopId: string,
): Promise<SellerOrderMetrics | null> {
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id")
    .eq("shop_id", shopId);

  if (productsError) {
    return null;
  }

  if (!products || products.length === 0) {
    return {
      inProgressCount: 0,
      completedCount: 0,
    };
  }

  const productIds = products.map((product) => product.id);

  const { data, error } = await supabase
    .from("order_items")
    .select("status")
    .in("product_id", productIds);

  if (error || !data) {
    return null;
  }

  return countSellerOrderStatusMetrics(data.map((item) => item.status));
}
