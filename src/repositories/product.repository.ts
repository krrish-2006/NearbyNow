import { SupabaseClient } from "@supabase/supabase-js";

import { Database, Tables } from "@/types/database.types";

type Product = Tables<"products">;

export async function getProductsByShopId(
  supabase: SupabaseClient<Database>,
  shopId: string
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getProductById(
  supabase: SupabaseClient<Database>,
  productId: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function createProduct(
  supabase: SupabaseClient<Database>,
  values: Database["public"]["Tables"]["products"]["Insert"]
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .insert(values)
    .select()
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function updateProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  values: Database["public"]["Tables"]["products"]["Update"]
): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .update(values)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function deleteProduct(
  supabase: SupabaseClient<Database>,
  productId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  return !error;
}
