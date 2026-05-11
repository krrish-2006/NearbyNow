"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/features/actions/action-result";

export async function removeCartItemAction(
  cartItemId: string
): Promise<ActionResult> {
  const supabase =
    await createClient();

  await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  revalidatePath("/cart");
  revalidatePath("/seller/orders");

  return {
    success: true,
  };
}
