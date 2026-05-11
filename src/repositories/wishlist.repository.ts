import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export async function getWishlistItemId(
  supabase: SupabaseClient<Database>,
  userId: string | undefined,
  productId: string,
): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id;
}

export async function addWishlistItem(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    productId: string;
  },
): Promise<boolean> {
  const { error } = await supabase.from("wishlists").upsert(
    {
      user_id: input.userId,
      product_id: input.productId,
    },
    {
      onConflict: "user_id,product_id",
    },
  );

  return !error;
}

export async function removeWishlistItem(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    productId: string;
  },
): Promise<boolean> {
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", input.userId)
    .eq("product_id", input.productId);

  return !error;
}

export async function getWishlistCountByShopId(
  supabase: SupabaseClient<Database>,
  shopId: string,
): Promise<number | null> {
  const { data, error } = await supabase.rpc("get_shop_wishlist_count", {
    p_shop_id: shopId,
  });

  if (error || typeof data !== "number") {
    return null;
  }

  return data;
}
