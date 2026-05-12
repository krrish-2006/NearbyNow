"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  logServerEvent,
  reportServerError,
} from "@/lib/monitoring/server";
import type { ActionResult } from "@/features/actions/action-result";
import { placeDirectCodOrder } from "@/features/checkout/services/checkout.service";

type DirectOrderResult = ActionResult;

export async function placeDirectOrderAction(
  formData: FormData
): Promise<DirectOrderResult>;
export async function placeDirectOrderAction(
  _previousState: DirectOrderResult,
  formData: FormData
): Promise<DirectOrderResult>;
export async function placeDirectOrderAction(
  firstArg: FormData | DirectOrderResult,
  secondArg?: FormData,
): Promise<DirectOrderResult> {
  const formData = secondArg ?? (firstArg as FormData);

  const productId = String(formData.get("productId"));

  const quantity = Number(
    formData.get("quantity")
  );

  if (!productId || quantity <= 0) {
    return {
      success: false,
      error: "Choose a valid product and quantity",
    };
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product } =
    await supabase
      .from("products")
      .select(`
        id,
        title,
        price,
        stock_quantity,
        is_active
      `)
      .eq("id", productId)
      .single();

  if (!product || !product.is_active) {
    return {
      success: false,
      error: "This product is unavailable",
    };
  }

  if (product.stock_quantity < quantity) {
    return {
      success: false,
      error: `Only ${product.stock_quantity} in stock`,
    };
  }

  const result = await placeDirectCodOrder(supabase, {
    productId: product.id,
    quantity,
  });

  if (!result.success) {
    await reportServerError(result.error, {
      action: "placeDirectOrderAction",
      userId: user.id,
      productId: product.id,
    });

    return result;
  }

  logServerEvent("direct checkout completed", {
    action: "placeDirectOrderAction",
    userId: user.id,
    productId: product.id,
    orderId: result.data?.orderId ?? null,
  });

  revalidatePath("/orders");
  revalidatePath("/seller/orders");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${product.id}`);

  redirect("/orders");
}
