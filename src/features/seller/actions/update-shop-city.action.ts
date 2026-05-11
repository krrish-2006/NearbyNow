"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/features/actions/action-result";
import { requireSeller } from "@/features/seller/utils/require-seller";
import { createClient } from "@/lib/supabase/server";
import { updateShopCityBySellerId } from "@/repositories/shop.repository";

export async function updateShopCityAction(
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireSeller();

  const supabase = await createClient();

  const cityId = String(formData.get("city_id") ?? "");

  if (!cityId) {
    return {
      success: false,
      error: "Select a city first",
    };
  }

  const updated = await updateShopCityBySellerId(
    supabase,
    profile.id,
    cityId,
  );

  if (!updated) {
    return {
      success: false,
      error: "Could not update shop city",
    };
  }

  revalidatePath("/seller/profile");

  return {
    success: true,
  };
}
