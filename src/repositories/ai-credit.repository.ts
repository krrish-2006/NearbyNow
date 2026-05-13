import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database";

export type SellerAiCredits = Tables<"seller_ai_credits">;
export type AiCreditPurchase = Tables<"ai_credit_purchases">;

export async function getSellerAiCredits(
  supabase: SupabaseClient<Database>,
): Promise<SellerAiCredits | null> {
  const { data, error } = await supabase
    .from("seller_ai_credits")
    .select("*")
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function createAiCreditPurchase(
  supabase: SupabaseClient<Database>,
  values: Database["public"]["Tables"]["ai_credit_purchases"]["Insert"],
): Promise<AiCreditPurchase | null> {
  const { data, error } = await supabase
    .from("ai_credit_purchases")
    .insert(values)
    .select("*")
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function setPurchaseProviderOrderId(
  supabase: SupabaseClient<Database>,
  purchaseId: string,
  providerOrderId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("ai_credit_purchases")
    .update({
      provider_order_id: providerOrderId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchaseId);

  return !error;
}

export async function getPurchaseByProviderOrderId(
  supabase: SupabaseClient<Database>,
  providerOrderId: string,
): Promise<AiCreditPurchase | null> {
  const { data, error } = await supabase
    .from("ai_credit_purchases")
    .select("*")
    .eq("provider_order_id", providerOrderId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}
