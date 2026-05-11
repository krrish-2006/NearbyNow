"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/features/actions/action-result";
import { validateProductCanBeAddedToCart } from "@/features/cart/lib/cart-quantity";

export async function addToCartAction(
  productId: string
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

  const { data: product } =
    await supabase
      .from("products")
      .select("stock_quantity, is_active")
      .eq("id", productId)
      .single();

  const { data: existingItem } =
    await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

  if (existingItem) {
    const validation = validateProductCanBeAddedToCart(
      {
        stockQuantity: product?.stock_quantity,
        isActive: product?.is_active,
      },
      existingItem.quantity,
    );

    if (!validation.success) {
      return validation;
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
    const validation = validateProductCanBeAddedToCart({
      stockQuantity: product?.stock_quantity,
      isActive: product?.is_active,
    });

    if (!validation.success) {
      return validation;
    }

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
  revalidatePath("/seller/orders");

  return {
    success: true,
  };
}
