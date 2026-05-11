"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function addToCartAction(
  productId: string
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

  const { data: product } =
    await supabase
      .from("products")
      .select("stock_quantity, is_active")
      .eq("id", productId)
      .single();

  if (!product?.is_active) {
    return {
      success: false,
      error: "This product is unavailable",
    };
  }

  if ((product.stock_quantity ?? 0) <= 0) {
    return {
      success: false,
      error: "This product is out of stock",
    };
  }

  const { data: existingItem } =
    await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

  if (existingItem) {
    if (existingItem.quantity >= product.stock_quantity) {
      return {
        success: false,
        error: `Only ${product.stock_quantity} in stock`,
      };
    }

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
