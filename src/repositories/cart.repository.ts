import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { CartItemWithProduct } from "@/features/cart/types/cart.types";

export async function getCartItemsByUserId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CartItemWithProduct[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
        id,
        quantity,
        products (
          id,
          title,
          price,
          image_url,
          stock_quantity,
          is_active,
          shop_id
        )
      `,
    )
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data as CartItemWithProduct[];
}

export async function getCartQuantityByShopId(
  supabase: SupabaseClient<Database>,
  shopId: string,
): Promise<number | null> {
  const { data, error } = await supabase.rpc("get_shop_cart_quantity", {
    p_shop_id: shopId,
  });

  if (error || typeof data !== "number") {
    return null;
  }

  return data;
}
