import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database";

export type Category = Tables<"categories">;

export async function getCategories(
  supabase: SupabaseClient<Database>
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error || !data) {
    return [];
  }

  return data;
}
