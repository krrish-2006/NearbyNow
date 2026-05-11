import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database";

export type City = Tables<"cities">;

export async function getCities(
  supabase: SupabaseClient<Database>
): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .order("name");

  if (error || !data) {
    return [];
  }

  return data;
}
