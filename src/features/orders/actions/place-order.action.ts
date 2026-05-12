"use server";

import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  logServerEvent,
  reportServerError,
} from "@/lib/monitoring/server";
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
    logServerEvent("cart checkout validation failed", {
      userId: user.id,
      reason: cartValidation.error,
    });

    return cartValidation;
  }

  const result = await placeCartCodOrder(supabase);

  if (!result.success) {
    await reportServerError(result.error, {
      action: "placeOrderAction",
      userId: user.id,
    });

    revalidatePath("/cart");

    return result;
  }

  logServerEvent("cart checkout completed", {
    action: "placeOrderAction",
    userId: user.id,
    orderId: result.data?.orderId ?? null,
  });

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
