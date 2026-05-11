"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { calculateCheckoutPricing } from "@/features/checkout/lib/calculate-checkout-pricing";

export async function placeDirectOrderAction(
  formData: FormData
) {
  const productId = String(formData.get("productId"));

  const quantity = Number(
    formData.get("quantity")
  );

  if (!productId || quantity <= 0) {
    redirect("/");
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

  if (!product || !product.is_active || product.stock_quantity < quantity) {
    redirect("/");
  }

  const pricing =
    calculateCheckoutPricing({
      price: product.price,
      quantity,
    });

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total_amount: pricing.total,
      payment_method: "COD",
    })
    .select()
    .single();

  if (orderError || !order) {
    redirect("/");
  }

  const {
    error: orderItemError,
  } = await supabase
    .from("order_items")
    .insert({
      order_id: order.id,
      product_id: product.id,
      quantity,
      price: product.price,
    });

  if (orderItemError) {
    redirect("/");
  }

  const { error: stockError } = await supabase
    .from("products")
    .update({
      stock_quantity:
        product.stock_quantity -
        quantity,
    })
    .eq("id", product.id)
    .eq("stock_quantity", product.stock_quantity);

  if (stockError) {
    redirect("/");
  }

  revalidatePath("/orders");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${product.id}`);

  redirect("/orders");
}
