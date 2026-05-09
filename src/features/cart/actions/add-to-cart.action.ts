"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function addToCartAction(
  productId: string
) {
  const supabase: any =
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

  const { data: existingItem } =
    await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single();

  if (existingItem) {
    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity:
          existingItem.quantity + 1,
      })
      .eq("id", existingItem.id);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        product_id: productId,
        quantity: 1,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  revalidatePath("/cart");

  return {
    success: true,
  };
}
