"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/features/actions/action-result";
import { requireSeller } from "@/features/seller/utils/require-seller";
import { createClient } from "@/lib/supabase/server";
import { getShopBySellerId } from "@/repositories/shop.repository";
import { upsertPickupLocation } from "@/repositories/pickup-location.repository";

function parseCoordinate(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export async function updatePickupLocationAction(
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireSeller();
  const supabase = await createClient();
  const shop = await getShopBySellerId(supabase, profile.id);

  if (!shop) {
    return {
      success: false,
      error: "Seller shop not found",
    };
  }

  const address = String(formData.get("address") ?? "").trim();
  const latitude = parseCoordinate(formData.get("latitude"));
  const longitude = parseCoordinate(formData.get("longitude"));
  const pickupWindow = String(formData.get("pickup_window") ?? "").trim();
  const pickupInstructions = String(
    formData.get("pickup_instructions") ?? "",
  ).trim();
  const osmPlaceId = String(formData.get("osm_place_id") ?? "").trim();
  const osmDisplayName = String(formData.get("osm_display_name") ?? "").trim();

  if (address.length < 5) {
    return {
      success: false,
      error: "Select a valid pickup address",
    };
  }

  if (latitude === null || latitude < -90 || latitude > 90) {
    return {
      success: false,
      error: "Select a valid pickup latitude",
    };
  }

  if (longitude === null || longitude < -180 || longitude > 180) {
    return {
      success: false,
      error: "Select a valid pickup longitude",
    };
  }

  const updated = await upsertPickupLocation(supabase, {
    shop_id: shop.id,
    address,
    latitude,
    longitude,
    osm_place_id: osmPlaceId || null,
    osm_display_name: osmDisplayName || null,
    pickup_window: pickupWindow || null,
    pickup_instructions: pickupInstructions || null,
  });

  if (!updated) {
    return {
      success: false,
      error: "Could not update pickup location",
    };
  }

  revalidatePath("/seller/profile");
  revalidatePath("/seller/orders");
  revalidatePath("/orders");

  return {
    success: true,
  };
}
