import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { OrderWithItems } from "@/features/orders/types/order.types";

export async function getOrdersByUserId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        *,
        order_items (
          id,
          quantity,
          price,
          products (
            title
          )
        )
      `,
    )
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error || !data) {
    return [];
  }

  return data as OrderWithItems[];
}
