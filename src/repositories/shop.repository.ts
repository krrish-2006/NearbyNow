import { SupabaseClient } from "@supabase/supabase-js";

import { Database, Tables } from "@/types/database";

type Shop = Tables<"shops">;

export async function getShopBySellerId(
  supabase: SupabaseClient<Database>,
  sellerProfileId: string
): Promise<Shop | null> {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("seller_profile_id", sellerProfileId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function createShop(
  supabase: SupabaseClient<Database>,
  values: Database["public"]["Tables"]["shops"]["Insert"]
): Promise<Shop | null> {
  const { data, error } = await supabase
    .from("shops")
    .insert(values)
    .select()
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function updateShopCityBySellerId(
  supabase: SupabaseClient<Database>,
  sellerProfileId: string,
  cityId: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from("shops")
    .update({
      city_id: cityId,
    })
    .eq("seller_profile_id", sellerProfileId);

  return !error;
}

export async function updateShopNameBySellerId(
  supabase: SupabaseClient<Database>,
  sellerProfileId: string,
  name: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("shops")
    .update({
      name,
    })
    .eq("seller_profile_id", sellerProfileId);

  return !error;
}
