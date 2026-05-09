"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

import { getShopBySellerId } from "@/repositories/shop.repository";

export async function deleteProductAction(
  productId: string
) {
  const supabase: any = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const sellerShop = await getShopBySellerId(
    supabase,
    user.id
  );

  if (!sellerShop) {
    return {
      success: false,
      error: "Seller shop not found",
    };
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("shop_id", sellerShop.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/seller/products");

  return {
    success: true,
  };
}
