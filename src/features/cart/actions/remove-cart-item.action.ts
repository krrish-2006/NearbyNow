"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function removeCartItemAction(
  cartItemId: string
) {
  const supabase: any =
    await createClient();

  await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  revalidatePath("/cart");
}
