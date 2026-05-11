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
          is_active
        )
      `,
    )
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data as CartItemWithProduct[];
}
