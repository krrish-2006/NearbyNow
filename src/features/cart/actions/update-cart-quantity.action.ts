"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function updateCartQuantityAction(
  cartItemId: string,
  quantity: number
) {
  const supabase: any =
    await createClient();

  if (quantity <= 0) {
    await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    revalidatePath("/cart");

    return;
  }

  await supabase
    .from("cart_items")
    .update({
      quantity,
    })
    .eq("id", cartItemId);

  revalidatePath("/cart");
}
