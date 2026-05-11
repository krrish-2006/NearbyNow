"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/features/actions/action-result";
import { validateCartQuantityUpdate } from "@/features/cart/lib/cart-quantity";

export async function updateCartQuantityAction(
  cartItemId: string,
  quantity: number
): Promise<ActionResult> {
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
    revalidatePath("/seller/orders");

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

  const validation = validateCartQuantityUpdate(
    {
      stockQuantity: cartItem?.products?.stock_quantity,
      isActive: cartItem?.products?.is_active,
    },
    quantity,
  );

  if (!validation.success) {
    return validation;
  }

  await supabase
    .from("cart_items")
    .update({
      quantity,
    })
    .eq("id", cartItemId)
    .eq("user_id", user.id);

  revalidatePath("/cart");
  revalidatePath("/seller/orders");

  return {
    success: true,
  };
}
