import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database";

export type ShopPickupLocation = Tables<"shop_pickup_locations">;

export type ShopPickupLocationInput = Pick<
  Database["public"]["Tables"]["shop_pickup_locations"]["Insert"],
  | "shop_id"
  | "address"
  | "latitude"
  | "longitude"
  | "osm_place_id"
  | "osm_display_name"
  | "pickup_window"
  | "pickup_instructions"
>;

export async function getPickupLocationByShopId(
  supabase: SupabaseClient<Database>,
  shopId: string,
): Promise<ShopPickupLocation | null> {
  const { data, error } = await supabase
    .from("shop_pickup_locations")
    .select("*")
    .eq("shop_id", shopId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function upsertPickupLocation(
  supabase: SupabaseClient<Database>,
  values: ShopPickupLocationInput,
): Promise<boolean> {
  const { error } = await supabase
    .from("shop_pickup_locations")
    .upsert(
      {
        ...values,
        confirmed_at: new Date().toISOString(),
      },
      {
        onConflict: "shop_id",
      },
    );

  return !error;
}
