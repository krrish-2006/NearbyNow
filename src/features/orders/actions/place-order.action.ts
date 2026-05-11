"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCartItemsByUserId } from "@/repositories/cart.repository";
import type { ActionResult } from "@/features/actions/action-result";
import { validateCartHasItems } from "@/features/checkout/lib/cart-checkout";
import { placeCartCodOrder } from "@/features/checkout/services/checkout.service";

export async function placeOrderAction(): Promise<ActionResult>;
export async function placeOrderAction(
  _previousState: ActionResult,
  _formData: FormData,
): Promise<ActionResult>;
export async function placeOrderAction(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cartItems = await getCartItemsByUserId(supabase, user.id);

  const cartValidation = validateCartHasItems(cartItems);

  if (!cartValidation.success) {
    return cartValidation;
  }

  const result = await placeCartCodOrder(supabase);

  if (!result.success) {
    revalidatePath("/cart");

    return result;
  }

  revalidatePath("/cart");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/seller/orders");

  for (const item of cartItems) {
    if (item.products?.id) {
      revalidatePath(`/products/${item.products.id}`);
    }
  }

  redirect("/orders");
}
