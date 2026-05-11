"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function updateCartQuantityAction(
  cartItemId: string,
  quantity: number
) {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Please login first",
    };
  }

  if (quantity <= 0) {
    await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("user_id", user.id);

    revalidatePath("/cart");

    return {
      success: true,
    };
  }

  const { data: cartItem } = await supabase
    .from("cart_items")
    .select(
      `
        id,
        products (
          stock_quantity,
          is_active
        )
      `,
    )
    .eq("id", cartItemId)
    .eq("user_id", user.id)
    .single();

  if (!cartItem?.products?.is_active) {
    return {
      success: false,
      error: "This product is unavailable",
    };
  }

  if (quantity > (cartItem.products.stock_quantity ?? 0)) {
    return {
      success: false,
      error: `Only ${cartItem.products.stock_quantity ?? 0} in stock`,
    };
  }

  await supabase
    .from("cart_items")
    .update({
      quantity,
    })
    .eq("id", cartItemId)
    .eq("user_id", user.id);

  revalidatePath("/cart");

  return {
    success: true,
  };
}
