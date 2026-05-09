"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function updateOrderStatusAction(
  orderId: string,
  status: string
) {
  const supabase: any =
    await createClient();

  await supabase
    .from("orders")
    .update({
      status,
    })
    .eq("id", orderId);

  revalidatePath("/seller/orders");

  revalidatePath("/orders");
}
