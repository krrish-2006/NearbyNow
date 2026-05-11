"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/features/actions/action-result";
import { requireSeller } from "@/features/seller/utils/require-seller";
import { createClient } from "@/lib/supabase/server";
import { updateShopNameBySellerId } from "@/repositories/shop.repository";

export async function updateShopNameAction(
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireSeller();

  const supabase = await createClient();

  const shopName = String(formData.get("shop_name") ?? "").trim();

  if (shopName.length < 2) {
    return {
      success: false,
      error: "Shop name must be at least 2 characters",
    };
  }

  const updated = await updateShopNameBySellerId(
    supabase,
    profile.id,
    shopName,
  );

  if (!updated) {
    return {
      success: false,
      error: "Could not update shop name",
    };
  }

  revalidatePath("/seller/profile");
  revalidatePath("/seller/products");
  revalidatePath("/products");

  return {
    success: true,
  };
}
